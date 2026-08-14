import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, checkDbConnection } from './index';
import { users, organizations, memberships, leads } from './schema';
import crypto from 'crypto';

async function main() {
  console.log('[Migration] Starting database migration & seeding sequence...');

  const isConnected = await checkDbConnection();
  if (!isConnected) {
    console.error('[Migration Aborted] Database is not accessible. Make sure Postgres is running.');
    process.exit(1);
  }

  try {
    // 1. Run Migrations
    console.log('[Migration] Running Drizzle migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[Migration] Migrations applied successfully!');

    // 2. Seeding check
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('[Migration] Empty database detected. Seeding initial workspace data...');

      // A. Create Org
      const [org] = await db.insert(organizations)
        .values({
          name: 'Acme SaaS Org',
          plan: 'PRO',
          subscriptionStatus: 'active',
        })
        .returning();

      // B. Create Admin User
      const adminPasswordHash = crypto.createHash('sha256').update('admin123').digest('hex');
      const [admin] = await db.insert(users)
        .values({
          name: 'Moeez CRM Admin',
          email: 'admin@agentcrm.com',
          password: adminPasswordHash,
          role: 'ADMIN',
        })
        .returning();

      // C. Bind User <-> Org
      await db.insert(memberships)
        .values({
          userId: admin.id,
          organizationId: org.id,
          role: 'OWNER',
        });

      // D. Create some sample leads to populate the dashboard immediately!
      const initialLeads = [
        {
          organizationId: org.id,
          name: 'Jensen Huang',
          email: 'jensen@nvidia.com',
          companyName: 'Nvidia Corp',
          website: 'nvidia.com',
          status: 'NEW' as const,
        },
        {
          organizationId: org.id,
          name: 'Satya Nadella',
          email: 'satya@microsoft.com',
          companyName: 'Microsoft Corp',
          website: 'microsoft.com',
          status: 'NEW' as const,
        },
        {
          organizationId: org.id,
          name: 'Sam Altman',
          email: 'sam@openai.com',
          companyName: 'OpenAI Inc',
          website: 'openai.com',
          status: 'NEW' as const,
        }
      ];

      for (const leadData of initialLeads) {
        await db.insert(leads).values(leadData);
      }

      console.log('[Migration] Database seeding complete!');
      console.log(`
=========================================
Demo Workspace Ready!
Organization: Acme SaaS Org (PRO Plan)
Admin User  : admin@agentcrm.com
Password    : admin123
=========================================
      `);
    } else {
      console.log('[Migration] Database already seeded. Skipping seed process.');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('[Migration Error] Migration run failed:', error.message);
    process.exit(1);
  }
}

main();
