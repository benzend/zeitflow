import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) throw new Error('missing DATABASE_URL');

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
