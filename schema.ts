import { pgTable, serial, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

export const rateLimitsTable = pgTable('rate_limits', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  count: integer('count').notNull().default(1),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscribersTable = pgTable('subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export const chainsTable = pgTable('chains', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),

  name: text('name'),

  cycleCount: integer('cycle_count').notNull(),
  currentCycle: integer('current_cycle').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date()),
});

export const chainStepsTable = pgTable('chain_steps', {
  id: serial('id').primaryKey(),
  chainId: integer('chain_id').notNull().references(() => chainsTable.id, { onDelete: 'cascade' }),

  prompt: text('prompt').notNull(),
  result: text('result'),

  cycleCount: integer('cycle_count').notNull(),
  currentCycle: integer('current_cycle').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export type InsertSubscriber = typeof subscribersTable.$inferInsert;
export type InsertRateLimit = typeof rateLimitsTable.$inferInsert;
export type InsertChain = typeof chainsTable.$inferInsert;
export type SelectChain = typeof chainsTable.$inferSelect;
