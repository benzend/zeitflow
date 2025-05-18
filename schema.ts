import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const subscribersTable = pgTable('subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type InsertSubscriber = typeof subscribersTable.$inferInsert;
