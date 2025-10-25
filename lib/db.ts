import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');

// Create the database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle({ client: pool });
