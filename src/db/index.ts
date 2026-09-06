// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set. FlatMate+ requires Render PostgreSQL.');
  }

  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on PostgreSQL pool client:', err);
    });
  }

  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });
