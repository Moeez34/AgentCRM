"use server";

import { revalidatePath } from "next/cache";
import { db, checkDbConnection } from "@/db";
import { leads, leadResearch, outreachMessages, emailLogs, auditLogs, notifications, organizations } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { mockDb } from "@/lib/mockDb";
import { enqueueCrmJob } from "@/lib/queue";
import { getEmbedding } from "../../../worker/src/ai";
import crypto from "crypto";

// Helper to determine if we are in Postgres mode or Offline Mock mode
async function useRealDb(): Promise<boolean> {
  return await checkDbConnection();
}

export async function getDashboardData() {
  const isDbLive = await useRealDb();

  if (!isDbLive) {
    const org = await mockDb.organizations.findFirst();
    const leadsList = await mockDb.leads.findMany();
    const notificationsList = await mockDb.notifications.findMany();
    const auditsList = await mockDb.audits.findMany();
    const outreachList = await mockDb.outreach.findMany();

    const pendingApprovals = outreachList.filter(o => o.status === 'DRAFT');

    return {
      isDbLive: false,
      org,
      stats: {
        totalLeads: leadsList.length,
        researchedLeads: leadsList.filter(l => ['RESEARCHED', 'SCORED', 'OUTREACH_GENERATED', 'APPROVED', 'EMAIL_SENT', 'REPLIED'].includes(l.status)).length,
        scoredAverage: leadsList.filter(l => l.score !== null).reduce((acc, l) => acc + (l.score || 0), 0) / (leadsList.filter(l => l.score !== null).length || 1),
        repliedLeads: leadsList.filter(l => l.status === 'REPLIED').length,
      },
      notifications: notificationsList.slice(0, 10),
      audits: auditsList.slice(0, 10),
      pendingApprovals,
    };
  }

  try {
    const [org] = await db.select().from(organizations).limit(1);
    const leadsList = await db.select().from(leads);
    const notificationsList = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(10);
    const auditsList = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);
    
    const pendingApprovals = await db.select()
      .from(outreachMessages)
      .where(eq(outreachMessages.status, 'DRAFT'))
      .orderBy(desc(outreachMessages.generatedAt));

    const scored = leadsList.filter(l => l.score !== null);
    const avgScore = scored.length > 0 ? scored.reduce((acc, l) => acc + (l.score || 0), 0) / scored.length : 0;

    return {
      isDbLive: true,
      org,
      stats: {
        totalLeads: leadsList.length,
        researchedLeads: leadsList.filter(l => ['RESEARCHED', 'SCORED', 'OUTREACH_GENERATED', 'APPROVED', 'EMAIL_SENT', 'REPLIED'].includes(l.status)).length,
        scoredAverage: Math.round(avgScore),
        repliedLeads: leadsList.filter(l => l.status === 'REPLIED').length,
      },
      notifications: notificationsList,
      audits: auditsList,
      pendingApprovals,
    };
  } catch (error) {
    console.error("Failed to query Postgres dashboard data, fallback to mock:", error);
    // Fallback if query crashes
    return getDashboardData();
  }
}

export async function getLeads(searchQuery?: string) {
  const isDbLive = await useRealDb();

  if (!isDbLive) {
    const allLeads = await mockDb.leads.findMany();
    if (!searchQuery) return allLeads;

    const query = searchQuery.toLowerCase();
    // Simulate keyword and semantic matching on mock summary
    const results = [];
    for (const lead of allLeads) {
      const research = await mockDb.research.findByLeadId(lead.id);
      const content = `${lead.name} ${lead.companyName} ${lead.website} ${research?.summary || ''} ${research?.technologies || ''}`.toLowerCase();
      if (content.includes(query)) {
        results.push(lead);
      }
    }
    return results;
  }

  try {
    if (!searchQuery) {
      return await db.select().from(leads).orderBy(desc(leads.createdAt));
    }

    // Semantic Vector RAG Search using pgvector
    console.log(`[RAG Search] Calculating query embedding for: "${searchQuery}"`);
    const queryVector = await getEmbedding(searchQuery);
    
    // Postgres Cosine Distance Query: 1 - (embedding <=> queryVector) as similarity
    const similarity = sql<number>`1 - (${leads.embedding} <=> ${JSON.stringify(queryVector)}::vector)`;
    
    const results = await db.select({
      id: leads.id,
      organizationId: leads.organizationId,
      name: leads.name,
      email: leads.email,
      companyName: leads.companyName,
      website: leads.website,
      status: leads.status,
      score: leads.score,
      scoreReasoning: leads.scoreReasoning,
      assignedTo: leads.assignedTo,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      similarity: similarity
    })
    .from(leads)
    .where(sql`${leads.embedding} IS NOT NULL`)
    .orderBy(desc(similarity))
    .limit(10);

    return results;
  } catch (error: any) {
    console.error("[RAG Search Error] Fallback to simple ILIKE matching:", error.message);
    // Fallback to basic text search if pgvector errors
    return await db.select()
      .from(leads)
      .where(sql`${leads.name} ILIKE ${'%' + searchQuery + '%'} OR ${leads.companyName} ILIKE ${'%' + searchQuery + '%'}`)
      .orderBy(desc(leads.createdAt));
  }
}

export async function getLeadDetail(leadId: string) {
  const isDbLive = await useRealDb();

  if (!isDbLive) {
    const lead = await mockDb.leads.findById(leadId);
    if (!lead) return null;
    const research = await mockDb.research.findByLeadId(leadId);
    const outreach = await mockDb.outreach.findByLeadId(leadId);
    const emails = await mockDb.emails.findManyByLeadId(leadId);

    return { lead, research, outreach, emails };
  }

  try {
    const leadList = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (leadList.length === 0) return null;
    const lead = leadList[0];

    const [research] = await db.select().from(leadResearch).where(eq(leadResearch.leadId, leadId)).limit(1);
    const [outreach] = await db.select().from(outreachMessages).where(eq(outreachMessages.leadId, leadId)).limit(1);
    const emails = await db.select().from(emailLogs).where(eq(emailLogs.leadId, leadId)).orderBy(desc(emailLogs.processedAt));

    return { lead, research, outreach, emails };
  } catch (error) {
    console.error("Error fetching lead detail:", error);
    return null;
  }
}

export async function addLead(name: string, email: string, companyName: string, website: string) {
  const isDbLive = await useRealDb();
  let orgId = 'org-acme-123'; // Default fallback ID

  if (isDbLive) {
    const [org] = await db.select().from(organizations).limit(1);
    if (org) orgId = org.id;
  }

  const cleanWebsite = website.replace(/https?:\/\//, '').replace(/\/$/, '');

  let newLead;
  if (!isDbLive) {
    newLead = await mockDb.leads.create({
      organizationId: orgId,
      name,
      email,
      companyName,
      website: cleanWebsite,
    });
  } else {
    const [inserted] = await db.insert(leads)
      .values({
        organizationId: orgId,
        name,
        email,
        companyName,
        website: cleanWebsite,
        status: 'NEW',
      })
      .returning();
    
    newLead = inserted;

    await db.insert(auditLogs).values({
      organizationId: orgId,
      action: `LEAD_CREATED: Added ${name} (${companyName})`,
    });
  }

  console.log(`[Lead Created] Lead ID: ${newLead.id}. Triggering research queue...`);
  
  // Resilient enqueueing to Redis BullMQ
  await enqueueCrmJob(`research-${newLead.id}`, {
    type: 'research-lead',
    leadId: newLead.id,
    orgId,
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, leadId: newLead.id };
}

export async function approveOutreach(messageId: string) {
  const isDbLive = await useRealDb();

  console.log(`[Approval] Approving outreach message ${messageId}`);

  let outreach;
  if (!isDbLive) {
    const list = await mockDb.outreach.findMany();
    outreach = list.find(o => o.id === messageId);
    if (outreach) {
      await mockDb.outreach.update(messageId, {
        status: 'APPROVED',
        approvedAt: new Date(),
        sentAt: new Date()
      });
      await mockDb.leads.update(outreach.leadId, {
        status: 'EMAIL_SENT'
      });
      // Log outgoing email
      await mockDb.emails.create({
        leadId: outreach.leadId,
        direction: 'OUTBOUND',
        subject: outreach.subject,
        body: outreach.body,
      });
    }
  } else {
    const list = await db.select().from(outreachMessages).where(eq(outreachMessages.id, messageId)).limit(1);
    outreach = list[0];
    if (outreach) {
      await db.update(outreachMessages)
        .set({
          status: 'APPROVED',
          approvedAt: new Date(),
          sentAt: new Date(),
        })
        .where(eq(outreachMessages.id, messageId));

      await db.update(leads)
        .set({ status: 'EMAIL_SENT', updatedAt: new Date() })
        .where(eq(leads.id, outreach.leadId));

      await db.insert(emailLogs).values({
        leadId: outreach.leadId,
        direction: 'OUTBOUND',
        subject: outreach.subject,
        body: outreach.body,
      });

      const [lead] = await db.select().from(leads).where(eq(leads.id, outreach.leadId)).limit(1);
      await db.insert(auditLogs).values({
        organizationId: lead.organizationId,
        action: `OUTREACH_SENT: Approved outreach to ${lead.name} (${lead.companyName})`,
      });
    }
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function simulateInboundReply(leadId: string, subject: string, body: string) {
  const isDbLive = await useRealDb();
  let orgId = 'org-acme-123';

  if (isDbLive) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (lead) orgId = lead.organizationId;
  }

  console.log(`[Simulation Inbound] Incoming reply from Lead ${leadId}`);

  // Push job to processing queue (or simulate)
  await enqueueCrmJob(`reply-${leadId}-${Date.now()}`, {
    type: 'process-reply',
    leadId,
    orgId,
    subject,
    body,
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function mockStripeCheckout() {
  const isDbLive = await useRealDb();
  let org;

  if (!isDbLive) {
    org = await mockDb.organizations.findFirst();
    if (org) {
      const nextPlan = org.plan === 'PRO' ? 'FREE' : 'PRO';
      await mockDb.organizations.update(org.id, {
        plan: nextPlan,
        subscriptionStatus: 'active'
      });
    }
  } else {
    const list = await db.select().from(organizations).limit(1);
    org = list[0];
    if (org) {
      const nextPlan = org.plan === 'PRO' ? 'FREE' : 'PRO';
      await db.update(organizations)
        .set({ plan: nextPlan, updatedAt: new Date() })
        .where(eq(organizations.id, org.id));
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function clearNotifications() {
  const isDbLive = await useRealDb();

  if (!isDbLive) {
    await mockDb.notifications.markAllRead();
  } else {
    await db.update(notifications).set({ isRead: true });
  }

  revalidatePath("/dashboard");
  return { success: true };
}
