import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { db, schema } from './db';
import { eq } from 'drizzle-orm';
import { 
  researchCompany, 
  scoreLead, 
  getEmbedding, 
  generateOutreach, 
  analyzeInboundReply 
} from './ai';

// Load Env
dotenv.config({ path: path.join(__dirname, '../../web/.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SOCKET_PORT = 3001;

// 1. Initialize Redis Connection
console.log(`[Worker] Connecting to Redis at ${REDIS_URL}...`);
const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null
});

redisConnection.on('connect', () => console.log('[Worker] Connected to Redis successfully.'));
redisConnection.on('error', (err) => console.error('[Worker] Redis Connection Error:', err.message));

// 2. Initialize Socket.io Server for Real-Time UI Updates
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for dev simplicity
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('join-org', (orgId: string) => {
    socket.join(orgId);
    console.log(`[Socket] Client ${socket.id} joined channel: ${orgId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(SOCKET_PORT, () => {
  console.log(`[Socket] WebSocket server listening on port ${SOCKET_PORT}`);
});

// Helper to push update socket events
function notifyOrg(orgId: string, event: string, data: any) {
  io.to(orgId).emit(event, data);
  // Also broadcast to all for global dashboard updates
  io.emit(event, data);
}

// 3. Initialize BullMQ Queue for Chain Actions
const crmQueue = new Queue('crm-queue', { connection: redisConnection });

// 4. Initialize BullMQ Worker Processor
const worker = new Worker(
  'crm-queue',
  async (job) => {
    const { type, leadId, orgId } = job.data;
    console.log(`[Worker Job] Processing job: ${job.id} (${type}) for Lead: ${leadId}`);

    // Fetch the lead from the database
    const leadList = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).limit(1);
    if (leadList.length === 0) {
      console.warn(`[Worker Warning] Lead ${leadId} not found in database. Skipping.`);
      return;
    }
    const lead = leadList[0];

    try {
      if (type === 'research-lead') {
        // Step 1: Set Status to RESEARCHING
        await db.update(schema.leads)
          .set({ status: 'RESEARCHING', updatedAt: new Date() })
          .where(eq(schema.leads.id, leadId));
        notifyOrg(orgId, 'lead-updated', { leadId, status: 'RESEARCHING' });

        // Step 2: Research company website
        const research = await researchCompany(lead.website, lead.companyName);

        // Step 3: Insert research data
        await db.insert(schema.leadResearch)
          .values({
            leadId,
            summary: research.summary,
            technologies: research.technologies,
            employeeCount: research.employeeCount,
            rawScrapedData: research.rawScrapedData,
          })
          .onConflictDoUpdate({
            target: schema.leadResearch.leadId,
            set: {
              summary: research.summary,
              technologies: research.technologies,
              employeeCount: research.employeeCount,
              rawScrapedData: research.rawScrapedData,
              updatedAt: new Date(),
            }
          });

        // Step 4: Update Lead Status to RESEARCHED
        await db.update(schema.leads)
          .set({ status: 'RESEARCHED', updatedAt: new Date() })
          .where(eq(schema.leads.id, leadId));
        notifyOrg(orgId, 'lead-updated', { leadId, status: 'RESEARCHED' });

        // Step 5: Automatically trigger scoring
        await crmQueue.add(`score-${leadId}`, { type: 'score-lead', leadId, orgId });
      }

      else if (type === 'score-lead') {
        // Step 1: Set Status to SCORING
        await db.update(schema.leads)
          .set({ status: 'SCORING', updatedAt: new Date() })
          .where(eq(schema.leads.id, leadId));
        notifyOrg(orgId, 'lead-updated', { leadId, status: 'SCORING' });

        // Fetch the research data
        const researchList = await db.select().from(schema.leadResearch).where(eq(schema.leadResearch.leadId, leadId)).limit(1);
        const research = researchList[0];

        if (!research) throw new Error(`Research data missing for lead ${leadId}`);

        // Step 2: AI Lead scoring
        const scoreResult = await scoreLead(
          research.summary || '',
          research.technologies || '',
          research.employeeCount || 0
        );

        // Step 3: AI Vector Embedding generation for RAG search
        const embeddingText = `Company: ${lead.companyName}. Website: ${lead.website}. Summary: ${research.summary}. Tech: ${research.technologies}.`;
        const embedding = await getEmbedding(embeddingText);

        // Step 4: Update database
        await db.update(schema.leads)
          .set({
            status: 'SCORED',
            score: scoreResult.score,
            scoreReasoning: scoreResult.reasoning,
            embedding,
            updatedAt: new Date()
          })
          .where(eq(schema.leads.id, leadId));

        notifyOrg(orgId, 'lead-updated', { 
          leadId, 
          status: 'SCORED', 
          score: scoreResult.score,
          scoreReasoning: scoreResult.reasoning 
        });

        // Step 5: Automatically trigger outreach email generation
        await crmQueue.add(`outreach-${leadId}`, { type: 'generate-outreach', leadId, orgId });
      }

      else if (type === 'generate-outreach') {
        // Fetch research again
        const researchList = await db.select().from(schema.leadResearch).where(eq(schema.leadResearch.leadId, leadId)).limit(1);
        const research = researchList[0];
        
        // Generate personalized outreach
        const outreach = await generateOutreach(
          lead.name,
          lead.companyName,
          research?.summary || 'modern technology optimization services'
        );

        // Save Outreach Message draft in database
        await db.insert(schema.outreachMessages)
          .values({
            leadId,
            subject: outreach.subject,
            body: outreach.body,
            status: 'DRAFT',
          });

        // Update Lead status to OUTREACH_GENERATED
        await db.update(schema.leads)
          .set({ status: 'OUTREACH_GENERATED', updatedAt: new Date() })
          .where(eq(schema.leads.id, leadId));

        // Create notification for human review
        const notifyMsg = `Outreach message generated for ${lead.name} (${lead.companyName}) is ready for review.`;
        await db.insert(schema.notifications)
          .values({
            organizationId: orgId,
            message: notifyMsg,
            type: 'INFO',
            isRead: false,
          });

        notifyOrg(orgId, 'lead-updated', { leadId, status: 'OUTREACH_GENERATED' });
        notifyOrg(orgId, 'notification', { message: notifyMsg, type: 'INFO' });
      }

      else if (type === 'process-reply') {
        const { subject, body } = job.data;
        console.log(`[Worker] Processing reply from Lead: ${lead.name} <${lead.email}>`);

        // Step 1: Save Inbound Email Log
        await db.insert(schema.emailLogs)
          .values({
            leadId,
            direction: 'INBOUND',
            subject,
            body,
          });

        // Step 2: Analyze Reply using LLM
        const analysis = await analyzeInboundReply(subject, body);

        // Step 3: Update Lead status (e.g. REPLIED or ARCHIVED)
        await db.update(schema.leads)
          .set({ 
            status: analysis.updateCrmStatus as any, 
            updatedAt: new Date() 
          })
          .where(eq(schema.leads.id, leadId));

        // Step 4: Add log details (update first or insert email log analytics details)
        await db.insert(schema.emailLogs)
          .values({
            leadId,
            direction: 'INBOUND',
            subject: `[AI Analysis] ${subject}`,
            body: `Sentiment: ${analysis.sentiment.toUpperCase()}\nAction Items: ${analysis.actionItems}`,
          });

        // Step 5: Push Notification
        const emoji = analysis.sentiment === 'positive' ? '🎉' : analysis.sentiment === 'negative' ? '❌' : '✉️';
        const notifyMsg = `${emoji} Inbound reply analyzed from ${lead.name} (${lead.companyName}). Sentiment: ${analysis.sentiment}.`;
        
        await db.insert(schema.notifications)
          .values({
            organizationId: orgId,
            message: notifyMsg,
            type: analysis.sentiment === 'positive' ? 'SUCCESS' : analysis.sentiment === 'negative' ? 'WARNING' : 'INFO',
            isRead: false,
          });

        // Step 6: Log to audit trail
        await db.insert(schema.auditLogs)
          .values({
            organizationId: orgId,
            action: `EMAIL_REPLY_ANALYZED: Lead ${lead.name} sentiment is ${analysis.sentiment}`,
          });

        notifyOrg(orgId, 'lead-updated', { leadId, status: analysis.updateCrmStatus });
        notifyOrg(orgId, 'notification', { message: notifyMsg, type: 'INFO' });
      }

    } catch (err: any) {
      console.error(`[Worker Job Error] Failed processing job ${job.id}:`, err.message);
      // Fallback lead status reset to prevent stuck loading states in UI
      await db.update(schema.leads)
        .set({ updatedAt: new Date() })
        .where(eq(schema.leads.id, leadId));
      notifyOrg(orgId, 'lead-updated', { leadId });
    }
  },
  { connection: redisConnection }
);

worker.on('active', (job) => {
  console.log(`[Worker] Job active: ${job.id}`);
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job failed: ${job?.id} error:`, err.message);
});

console.log('[Worker] Worker processors initialized and listening to crm-queue.');
