"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailLogsRelations = exports.outreachMessagesRelations = exports.leadResearchRelations = exports.leadsRelations = exports.membershipsRelations = exports.organizationsRelations = exports.usersRelations = exports.notifications = exports.auditLogs = exports.emailLogs = exports.outreachMessages = exports.leadResearch = exports.leads = exports.memberships = exports.organizations = exports.users = exports.notificationTypeEnum = exports.emailDirectionEnum = exports.messageStatusEnum = exports.leadStatusEnum = exports.roleEnum = exports.vector = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_2 = require("drizzle-orm/pg-core");
// Vector type for pgvector semantic search (1536 dimensions for OpenAI embeddings)
exports.vector = (0, pg_core_2.customType)({
    dataType() {
        return 'vector(1536)';
    },
    toDriver(val) {
        return `[${val.join(',')}]`;
    },
    fromDriver(val) {
        if (typeof val === 'string') {
            return val.replace('[', '').replace(']', '').split(',').map(Number);
        }
        return val;
    }
});
// Enums
exports.roleEnum = (0, pg_core_1.pgEnum)('user_role', ['ADMIN', 'MEMBER']);
exports.leadStatusEnum = (0, pg_core_1.pgEnum)('lead_status', [
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
exports.messageStatusEnum = (0, pg_core_1.pgEnum)('message_status', ['DRAFT', 'APPROVED', 'SENT']);
exports.emailDirectionEnum = (0, pg_core_1.pgEnum)('email_direction', ['INBOUND', 'OUTBOUND']);
exports.notificationTypeEnum = (0, pg_core_1.pgEnum)('notification_type', ['INFO', 'WARNING', 'SUCCESS']);
// Users Table (NextAuth compatible but expanded)
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    password: (0, pg_core_1.text)('password').notNull(), // hashed
    role: (0, exports.roleEnum)('role').default('MEMBER').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Organizations Table (Multi-tenancy)
exports.organizations = (0, pg_core_1.pgTable)('organizations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    stripeCustomerId: (0, pg_core_1.text)('stripe_customer_id'),
    plan: (0, pg_core_1.text)('plan').default('FREE').notNull(), // 'FREE', 'STARTER', 'PRO'
    subscriptionStatus: (0, pg_core_1.text)('subscription_status').default('active').notNull(), // 'active', 'trialing', 'past_due', 'canceled'
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Memberships Table (M-M Relation between Users and Orgs)
exports.memberships = (0, pg_core_1.pgTable)('memberships', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    organizationId: (0, pg_core_1.uuid)('organization_id').references(() => exports.organizations.id, { onDelete: 'cascade' }).notNull(),
    role: (0, pg_core_1.text)('role').default('MEMBER').notNull(), // OWNER, ADMIN, MEMBER
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Leads Table
exports.leads = (0, pg_core_1.pgTable)('leads', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)('organization_id').references(() => exports.organizations.id, { onDelete: 'cascade' }).notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    companyName: (0, pg_core_1.text)('company_name').notNull(),
    website: (0, pg_core_1.text)('website').notNull(),
    status: (0, exports.leadStatusEnum)('status').default('NEW').notNull(),
    score: (0, pg_core_1.integer)('score'), // AI Score (0-100)
    scoreReasoning: (0, pg_core_1.text)('score_reasoning'),
    assignedTo: (0, pg_core_1.uuid)('assigned_to').references(() => exports.users.id),
    embedding: (0, exports.vector)('embedding'), // semantic embedding
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Lead Research Table (AI Gathered Info)
exports.leadResearch = (0, pg_core_1.pgTable)('lead_research', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    leadId: (0, pg_core_1.uuid)('lead_id').references(() => exports.leads.id, { onDelete: 'cascade' }).notNull().unique(),
    summary: (0, pg_core_1.text)('summary'),
    technologies: (0, pg_core_1.text)('technologies'), // comma separated
    employeeCount: (0, pg_core_1.integer)('employee_count'),
    linkedInUrl: (0, pg_core_1.text)('linkedin_url'),
    rawScrapedData: (0, pg_core_1.jsonb)('raw_scraped_data'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Outreach Messages Table
exports.outreachMessages = (0, pg_core_1.pgTable)('outreach_messages', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    leadId: (0, pg_core_1.uuid)('lead_id').references(() => exports.leads.id, { onDelete: 'cascade' }).notNull(),
    subject: (0, pg_core_1.text)('subject').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    status: (0, exports.messageStatusEnum)('status').default('DRAFT').notNull(),
    generatedAt: (0, pg_core_1.timestamp)('generated_at').defaultNow().notNull(),
    approvedAt: (0, pg_core_1.timestamp)('approved_at'),
    sentAt: (0, pg_core_1.timestamp)('sent_at'),
});
// Email Logs Table (Replies & Inbound/Outbound tracking)
exports.emailLogs = (0, pg_core_1.pgTable)('email_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    leadId: (0, pg_core_1.uuid)('lead_id').references(() => exports.leads.id, { onDelete: 'cascade' }).notNull(),
    direction: (0, exports.emailDirectionEnum)('direction').notNull(),
    subject: (0, pg_core_1.text)('subject').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    sentiment: (0, pg_core_1.text)('sentiment'), // positive, negative, neutral
    actionItems: (0, pg_core_1.text)('action_items'),
    processedAt: (0, pg_core_1.timestamp)('processed_at').defaultNow().notNull(),
});
// Audit Logs Table
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)('organization_id').references(() => exports.organizations.id, { onDelete: 'cascade' }).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id),
    action: (0, pg_core_1.text)('action').notNull(), // "LEAD_CREATED", "OUTREACH_APPROVED", etc.
    ipAddress: (0, pg_core_1.text)('ip_address'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Notifications Table
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)('organization_id').references(() => exports.organizations.id, { onDelete: 'cascade' }).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    message: (0, pg_core_1.text)('message').notNull(),
    type: (0, exports.notificationTypeEnum)('type').default('INFO').notNull(),
    isRead: (0, pg_core_1.boolean)('is_read').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    memberships: many(exports.memberships),
}));
exports.organizationsRelations = (0, drizzle_orm_1.relations)(exports.organizations, ({ many }) => ({
    memberships: many(exports.memberships),
    leads: many(exports.leads),
    auditLogs: many(exports.auditLogs),
    notifications: many(exports.notifications),
}));
exports.membershipsRelations = (0, drizzle_orm_1.relations)(exports.memberships, ({ one }) => ({
    user: one(exports.users, { fields: [exports.memberships.userId], references: [exports.users.id] }),
    organization: one(exports.organizations, { fields: [exports.memberships.organizationId], references: [exports.organizations.id] }),
}));
exports.leadsRelations = (0, drizzle_orm_1.relations)(exports.leads, ({ one, many }) => ({
    organization: one(exports.organizations, { fields: [exports.leads.organizationId], references: [exports.organizations.id] }),
    assignedUser: one(exports.users, { fields: [exports.leads.assignedTo], references: [exports.users.id] }),
    research: one(exports.leadResearch, { fields: [exports.leads.id], references: [exports.leadResearch.leadId] }),
    outreachMessages: many(exports.outreachMessages),
    emailLogs: many(exports.emailLogs),
}));
exports.leadResearchRelations = (0, drizzle_orm_1.relations)(exports.leadResearch, ({ one }) => ({
    lead: one(exports.leads, { fields: [exports.leadResearch.leadId], references: [exports.leads.id] }),
}));
exports.outreachMessagesRelations = (0, drizzle_orm_1.relations)(exports.outreachMessages, ({ one }) => ({
    lead: one(exports.leads, { fields: [exports.outreachMessages.leadId], references: [exports.leads.id] }),
}));
exports.emailLogsRelations = (0, drizzle_orm_1.relations)(exports.emailLogs, ({ one }) => ({
    lead: one(exports.leads, { fields: [exports.emailLogs.leadId], references: [exports.leads.id] }),
}));
