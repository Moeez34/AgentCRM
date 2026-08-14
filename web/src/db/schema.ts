import { pgTable, text, timestamp, integer, boolean, pgEnum, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

// Vector type for pgvector semantic search (1536 dimensions for OpenAI embeddings)
export const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(val: number[]) {
    return `[${val.join(',')}]`;
  },
  fromDriver(val: any) {
    if (typeof val === 'string') {
      return val.replace('[', '').replace(']', '').split(',').map(Number);
    }
    return val as number[];
  }
});

// Enums
export const roleEnum = pgEnum('user_role', ['ADMIN', 'MEMBER']);
export const leadStatusEnum = pgEnum('lead_status', [
  'NEW',
  'RESEARCHING',
  'RESEARCHED',
  'SCORING',
  'SCORED',
  'OUTREACH_GENERATED',
  'APPROVED',
  'EMAIL_SENT',
  'REPLIED',
  'ARCHIVED'
]);
export const messageStatusEnum = pgEnum('message_status', ['DRAFT', 'APPROVED', 'SENT']);
export const emailDirectionEnum = pgEnum('email_direction', ['INBOUND', 'OUTBOUND']);
export const notificationTypeEnum = pgEnum('notification_type', ['INFO', 'WARNING', 'SUCCESS']);

// Users Table (NextAuth compatible but expanded)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // hashed
  role: roleEnum('role').default('MEMBER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organizations Table (Multi-tenancy)
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  plan: text('plan').default('FREE').notNull(), // 'FREE', 'STARTER', 'PRO'
  subscriptionStatus: text('subscription_status').default('active').notNull(), // 'active', 'trialing', 'past_due', 'canceled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Memberships Table (M-M Relation between Users and Orgs)
export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').default('MEMBER').notNull(), // OWNER, ADMIN, MEMBER
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Leads Table
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  companyName: text('company_name').notNull(),
  website: text('website').notNull(),
  status: leadStatusEnum('status').default('NEW').notNull(),
  score: integer('score'), // AI Score (0-100)
  scoreReasoning: text('score_reasoning'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  embedding: vector('embedding'), // semantic embedding
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Lead Research Table (AI Gathered Info)
export const leadResearch = pgTable('lead_research', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull().unique(),
  summary: text('summary'),
  technologies: text('technologies'), // comma separated
  employeeCount: integer('employee_count'),
  linkedInUrl: text('linkedin_url'),
  rawScrapedData: jsonb('raw_scraped_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Outreach Messages Table
export const outreachMessages = pgTable('outreach_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: messageStatusEnum('status').default('DRAFT').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  sentAt: timestamp('sent_at'),
});

// Email Logs Table (Replies & Inbound/Outbound tracking)
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  direction: emailDirectionEnum('direction').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  sentiment: text('sentiment'), // positive, negative, neutral
  actionItems: text('action_items'),
  processedAt: timestamp('processed_at').defaultNow().notNull(),
});

// Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(), // "LEAD_CREATED", "OUTREACH_APPROVED", etc.
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').default('INFO').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  leads: many(leads),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  organization: one(organizations, { fields: [memberships.organizationId], references: [organizations.id] }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  organization: one(organizations, { fields: [leads.organizationId], references: [organizations.id] }),
  assignedUser: one(users, { fields: [leads.assignedTo], references: [users.id] }),
  research: one(leadResearch, { fields: [leads.id], references: [leadResearch.leadId] }),
  outreachMessages: many(outreachMessages),
  emailLogs: many(emailLogs),
}));

export const leadResearchRelations = relations(leadResearch, ({ one }) => ({
  lead: one(leads, { fields: [leadResearch.leadId], references: [leads.id] }),
}));

export const outreachMessagesRelations = relations(outreachMessages, ({ one }) => ({
  lead: one(leads, { fields: [outreachMessages.leadId], references: [leads.id] }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  lead: one(leads, { fields: [emailLogs.leadId], references: [leads.id] }),
}));
