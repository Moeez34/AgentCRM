import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForDb = global as unknown as { pool: Pool | undefined };

// Build a resilient connection pool
let pool: Pool;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/agentcrm';

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
} else {
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({
      connectionString,
      // Short connection timeout so local dev loads quickly even if docker is not running
      connectionTimeoutMillis: 2000,
    });
  }
  pool = globalForDb.pool;
}

// Log connection warnings gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err.message);
});

export const db = drizzle(pool, { schema });

// Helper to check DB health
export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error: any) {
    console.warn(`[Database Warning] Unable to connect to PostgreSQL at ${connectionString.split('@').pop()}: ${error.message}`);
    return false;
  }
}
