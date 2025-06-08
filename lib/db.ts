import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from 'dotenv';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');

// Create the database connection
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
