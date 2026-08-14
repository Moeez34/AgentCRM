import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

// Load env from web folder
dotenv.config({ path: path.join(__dirname, '../../web/.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/agentcrm';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[Worker DB Error]', err.message);
});

export const db = drizzle(pool, { schema });
export { schema };
