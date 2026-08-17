import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisConnection: IORedis | null = null;
let crmQueue: Queue | null = null;

try {
  redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 2000, // Quick timeout to prevent blocking Next.js
  });

  redisConnection.on('error', (err) => {
    console.warn('[Queue Redis Warning]', err.message);
  });

  crmQueue = new Queue('crm-queue', { 
    connection: redisConnection 
  });
  console.log('[Queue] BullMQ CRM Queue initialized.');
} catch (error: any) {
  console.error('[Queue Error] Failed to initialize BullMQ CRM Queue:', error.message);
}

/**
 * Enqueue a job resiliently.
 * Falls back to mock in-memory queue simulation if Redis is offline.
 */
export async function enqueueCrmJob(
  name: string,
  data: { type: string; leadId: string; orgId: string; [key: string]: any }
) {
  if (crmQueue && redisConnection && redisConnection.status === 'ready') {
    try {
      const job = await crmQueue.add(name, data);
      console.log(`[Queue Success] Enqueued job: ${job.id} (${data.type})`);
      return { success: true, jobId: job.id, mode: 'redis' };
    } catch (err: any) {
      console.error('[Queue Write Error] Fallback triggered:', err.message);
    }
  }

  // Fallback mode: Print info.
  console.warn(`[Queue Mock Fallback] Redis offline. Simulating Job ${name} in-memory:`, data);
  
  // We can simulate background processing in-memory during development!
  if (process.env.NODE_ENV !== 'production') {
    // Run the job processing in a non-blocking timeout mock loop!
    simulateJobProcessing(data);
  }

  return { success: true, jobId: 'mock-job-id-' + Math.random().toString(36).substring(7), mode: 'mock' };
}

/**
 * Local development in-memory job processing simulator for cases where Redis/Docker is not running!
 * This guarantees the full CRM flow runs smoothly even without Docker!
 */
async function simulateJobProcessing(data: { type: string; leadId: string; orgId: string; [key: string]: any }) {
  const { type, leadId, orgId } = data;
  
  // To avoid circular dependencies, we fetch the DB and schemas inside
  const { db } = await import('@/db');
  const { leads, leadResearch, outreachMessages, notifications, emailLogs, auditLogs } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const { researchCompany, scoreLead, getEmbedding, generateOutreach, analyzeInboundReply } = await import('@/lib/embedding');

  try {
    // Check if lead exists
    const leadList = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (leadList.length === 0) return;
    const lead = leadList[0];

    if (type === 'research-lead') {
      console.log(`[Mock Process] Starting Research for lead ${lead.companyName}`);
      await db.update(leads).set({ status: 'RESEARCHING', updatedAt: new Date() }).where(eq(leads.id, leadId));
      
      const research = await researchCompany(lead.website, lead.companyName);
      
      await db.insert(leadResearch).values({
        leadId,
        summary: research.summary,
        technologies: research.technologies,
        employeeCount: research.employeeCount,
        rawScrapedData: research.rawScrapedData,
      }).onConflictDoUpdate({
        target: leadResearch.leadId,
        set: {
          summary: research.summary,
          technologies: research.technologies,
          employeeCount: research.employeeCount,
          rawScrapedData: research.rawScrapedData,
          updatedAt: new Date(),
        }
      });

      await db.update(leads).set({ status: 'RESEARCHED', updatedAt: new Date() }).where(eq(leads.id, leadId));
      console.log(`[Mock Process] Completed Research for lead ${lead.companyName}`);
      
      // Auto-trigger scoring
      setTimeout(() => simulateJobProcessing({ type: 'score-lead', leadId, orgId }), 1500);
    }

    else if (type === 'score-lead') {
      console.log(`[Mock Process] Starting Scoring for lead ${lead.companyName}`);
      await db.update(leads).set({ status: 'SCORING', updatedAt: new Date() }).where(eq(leads.id, leadId));

      const researchList = await db.select().from(leadResearch).where(eq(leadResearch.leadId, leadId)).limit(1);
      const research = researchList[0];
      if (!research) return;

      const scoreResult = await scoreLead(research.summary || '', research.technologies || '', research.employeeCount || 0);
      const embedding = await getEmbedding(`Company: ${lead.companyName}. Summary: ${research.summary}`);

      await db.update(leads).set({
        status: 'SCORED',
        score: scoreResult.score,
        scoreReasoning: scoreResult.reasoning,
        embedding,
        updatedAt: new Date(),
      }).where(eq(leads.id, leadId));
      console.log(`[Mock Process] Completed Scoring for lead ${lead.companyName}: ${scoreResult.score}`);

      // Auto-trigger outreach
      setTimeout(() => simulateJobProcessing({ type: 'generate-outreach', leadId, orgId }), 1500);
    }

    else if (type === 'generate-outreach') {
      console.log(`[Mock Process] Starting Outreach Copywriting for lead ${lead.companyName}`);
      const researchList = await db.select().from(leadResearch).where(eq(leadResearch.leadId, leadId)).limit(1);
      const research = researchList[0];

      const outreach = await generateOutreach(lead.name, lead.companyName, research?.summary || 'high growth services');

      await db.insert(outreachMessages).values({
        leadId,
        subject: outreach.subject,
        body: outreach.body,
        status: 'DRAFT',
      });

      await db.update(leads).set({ status: 'OUTREACH_GENERATED', updatedAt: new Date() }).where(eq(leads.id, leadId));

      const notifyMsg = `[Simulation] Outreach email generated for ${lead.name} (${lead.companyName}) is ready for review.`;
      await db.insert(notifications).values({
        organizationId: orgId,
        message: notifyMsg,
        type: 'INFO',
        isRead: false,
      });

      console.log(`[Mock Process] Outreach generated for lead ${lead.companyName}`);
    }

    else if (type === 'process-reply') {
      const { subject, body } = data;
      console.log(`[Mock Process] Starting Reply Analysis for lead ${lead.name}`);

      await db.insert(emailLogs).values({
        leadId,
        direction: 'INBOUND',
        subject,
        body,
      });

      const analysis = await analyzeInboundReply(subject, body);

      await db.update(leads).set({
        status: analysis.updateCrmStatus as any,
        updatedAt: new Date(),
      }).where(eq(leads.id, leadId));

      await db.insert(emailLogs).values({
        leadId,
        direction: 'INBOUND',
        subject: `[AI Analysis] ${subject}`,
        body: `Sentiment: ${analysis.sentiment.toUpperCase()}\nAction Items: ${analysis.actionItems}`,
      });

      const emoji = analysis.sentiment === 'positive' ? '🎉' : analysis.sentiment === 'negative' ? '❌' : '✉️';
      const notifyMsg = `[Simulation] ${emoji} Inbound reply analyzed from ${lead.name}. Sentiment: ${analysis.sentiment}.`;
      
      await db.insert(notifications).values({
        organizationId: orgId,
        message: notifyMsg,
        type: analysis.sentiment === 'positive' ? 'SUCCESS' : analysis.sentiment === 'negative' ? 'WARNING' : 'INFO',
        isRead: false,
      });

      await db.insert(auditLogs).values({
        organizationId: orgId,
        action: `[Simulation] EMAIL_REPLY_ANALYZED: Lead ${lead.name} sentiment is ${analysis.sentiment}`,
      });

      console.log(`[Mock Process] Reply analyzed for lead ${lead.name}`);
    }

  } catch (error: any) {
    console.error('[Mock Process Error]', error.message);
  }
}
