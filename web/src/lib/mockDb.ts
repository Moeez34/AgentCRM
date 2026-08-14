import crypto from 'crypto';

// In-memory tables stored on the Node global object so they persist between hot reloads
const globalMock = global as unknown as {
  mockOrgs: any[];
  mockUsers: any[];
  mockMemberships: any[];
  mockLeads: any[];
  mockResearch: any[];
  mockOutreach: any[];
  mockEmails: any[];
  mockNotifications: any[];
  mockAudits: any[];
};

// Initialize Mock Data
if (!globalMock.mockOrgs) {
  const orgId = 'org-acme-123';
  const userId = 'user-admin-123';
  
  globalMock.mockOrgs = [{
    id: orgId,
    name: 'Acme Mock SaaS Org',
    plan: 'PRO',
    stripeCustomerId: 'cus_mock_123',
    subscriptionStatus: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }];

  const adminPasswordHash = crypto.createHash('sha256').update('admin123').digest('hex');
  
  globalMock.mockUsers = [{
    id: userId,
    name: 'Demo Admin User',
    email: 'admin@agentcrm.com',
    password: adminPasswordHash,
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  }];

  globalMock.mockMemberships = [{
    id: 'membership-1',
    userId,
    organizationId: orgId,
    role: 'OWNER',
    createdAt: new Date(),
  }];

  globalMock.mockLeads = [
    {
      id: 'lead-1',
      organizationId: orgId,
      name: 'Jensen Huang',
      email: 'jensen@nvidia.com',
      companyName: 'Nvidia Corp',
      website: 'nvidia.com',
      status: 'NEW',
      score: null,
      scoreReasoning: null,
      assignedTo: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'lead-2',
      organizationId: orgId,
      name: 'Satya Nadella',
      email: 'satya@microsoft.com',
      companyName: 'Microsoft Corp',
      website: 'microsoft.com',
      status: 'SCORED',
      score: 85,
      scoreReasoning: 'Enterprise level headcount, massive AI cloud scaling alignment.',
      assignedTo: userId,
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 1800000),
    },
    {
      id: 'lead-3',
      organizationId: orgId,
      name: 'Sam Altman',
      email: 'sam@openai.com',
      companyName: 'OpenAI Inc',
      website: 'openai.com',
      status: 'OUTREACH_GENERATED',
      score: 95,
      scoreReasoning: 'Pioneer AI company, direct CRM pipeline integration customer candidate.',
      assignedTo: userId,
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 3600000),
    }
  ];

  globalMock.mockResearch = [
    {
      id: 'res-2',
      leadId: 'lead-2',
      summary: 'Microsoft Corp is a global technology company specializing in cloud computing (Azure), enterprise software, search, and computing devices.',
      technologies: 'React, Azure, C#, ASP.NET, Kubernetes',
      employeeCount: 220000,
      rawScrapedData: { inferred: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'res-3',
      leadId: 'lead-3',
      summary: 'OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.',
      technologies: 'Next.js, Python, PyTorch, Kubernetes, Postgres',
      employeeCount: 1200,
      rawScrapedData: { inferred: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  globalMock.mockOutreach = [
    {
      id: 'outreach-3',
      leadId: 'lead-3',
      subject: 'Custom automation for OpenAI Inc',
      body: "Hi Sam,\n\nI was looking at OpenAI's stack, particularly your Next.js and Kubernetes applications. We build systems that automate CRM pipelines and score customer actions.\n\nI believe this could help streamline your team's tracking workflow.\n\nWould you have 10 minutes next week for a brief demo?\n\nBest,\nCRM Team",
      status: 'DRAFT',
      generatedAt: new Date(),
      approvedAt: null,
      sentAt: null,
    }
  ];

  globalMock.mockEmails = [
    {
      id: 'email-1',
      leadId: 'lead-3',
      direction: 'OUTBOUND',
      subject: 'Custom automation for OpenAI Inc',
      body: 'Introductory email sent...',
      sentiment: null,
      actionItems: null,
      processedAt: new Date(Date.now() - 3600000),
    }
  ];

  globalMock.mockNotifications = [
    {
      id: 'notif-1',
      organizationId: orgId,
      userId,
      message: 'Welcome to AgentCRM. Postgres is currently running in offline demo fallback.',
      type: 'WARNING',
      isRead: false,
      createdAt: new Date(),
    }
  ];

  globalMock.mockAudits = [
    {
      id: 'audit-1',
      organizationId: orgId,
      userId,
      action: 'SYSTEM_INITIALIZED_OFFLINE_MOCK_STORE',
      ipAddress: '127.0.0.1',
      createdAt: new Date(),
    }
  ];
}

// Export mock database helper CRUD commands
export const mockDb = {
  users: {
    findMany: async () => globalMock.mockUsers,
    findFirst: async (email: string) => globalMock.mockUsers.find(u => u.email === email) || null,
    create: async (data: any) => {
      const newUser = { id: 'user-' + Math.random().toString(36).substring(7), ...data, createdAt: new Date() };
      globalMock.mockUsers.push(newUser);
      return newUser;
    }
  },
  organizations: {
    findMany: async () => globalMock.mockOrgs,
    findFirst: async () => globalMock.mockOrgs[0],
    update: async (id: string, data: any) => {
      const org = globalMock.mockOrgs.find(o => o.id === id);
      if (org) Object.assign(org, data, { updatedAt: new Date() });
      return org;
    }
  },
  leads: {
    findMany: async () => globalMock.mockLeads,
    findById: async (id: string) => globalMock.mockLeads.find(l => l.id === id) || null,
    create: async (data: any) => {
      const newLead = { 
        id: 'lead-' + Math.random().toString(36).substring(7), 
        score: null, 
        scoreReasoning: null, 
        status: 'NEW', 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        ...data 
      };
      globalMock.mockLeads.push(newLead);
      
      // Seed audit log
      globalMock.mockAudits.push({
        id: 'audit-' + Math.random().toString(36).substring(7),
        organizationId: data.organizationId,
        action: `LEAD_CREATED: Added ${data.name} (${data.companyName})`,
        createdAt: new Date()
      });

      return newLead;
    },
    update: async (id: string, data: any) => {
      const lead = globalMock.mockLeads.find(l => l.id === id);
      if (lead) {
        Object.assign(lead, data, { updatedAt: new Date() });
      }
      return lead;
    }
  },
  research: {
    findByLeadId: async (leadId: string) => globalMock.mockResearch.find(r => r.leadId === leadId) || null,
    upsert: async (leadId: string, data: any) => {
      const index = globalMock.mockResearch.findIndex(r => r.leadId === leadId);
      if (index > -1) {
        globalMock.mockResearch[index] = { ...globalMock.mockResearch[index], ...data, updatedAt: new Date() };
        return globalMock.mockResearch[index];
      } else {
        const newRes = { id: 'res-' + Math.random().toString(36).substring(7), leadId, ...data, createdAt: new Date(), updatedAt: new Date() };
        globalMock.mockResearch.push(newRes);
        return newRes;
      }
    }
  },
  outreach: {
    findByLeadId: async (leadId: string) => globalMock.mockOutreach.find(o => o.leadId === leadId) || null,
    findMany: async () => globalMock.mockOutreach,
    create: async (data: any) => {
      const newOutreach = { id: 'outreach-' + Math.random().toString(36).substring(7), status: 'DRAFT', generatedAt: new Date(), ...data };
      globalMock.mockOutreach.push(newOutreach);
      return newOutreach;
    },
    update: async (id: string, data: any) => {
      const outreach = globalMock.mockOutreach.find(o => o.id === id);
      if (outreach) Object.assign(outreach, data);
      return outreach;
    }
  },
  emails: {
    findManyByLeadId: async (leadId: string) => globalMock.mockEmails.filter(e => e.leadId === leadId),
    create: async (data: any) => {
      const newEmail = { id: 'email-' + Math.random().toString(36).substring(7), processedAt: new Date(), ...data };
      globalMock.mockEmails.push(newEmail);
      return newEmail;
    }
  },
  notifications: {
    findMany: async () => globalMock.mockNotifications,
    create: async (data: any) => {
      const newNotif = { id: 'notif-' + Math.random().toString(36).substring(7), isRead: false, createdAt: new Date(), ...data };
      globalMock.mockNotifications.push(newNotif);
      return newNotif;
    },
    markAllRead: async () => {
      globalMock.mockNotifications.forEach(n => n.isRead = true);
    }
  },
  audits: {
    findMany: async () => globalMock.mockAudits,
    create: async (data: any) => {
      const newAudit = { id: 'audit-' + Math.random().toString(36).substring(7), createdAt: new Date(), ...data };
      globalMock.mockAudits.push(newAudit);
      return newAudit;
    }
  }
};
