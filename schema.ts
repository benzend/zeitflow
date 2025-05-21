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

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date()),
});

export const chainStepsTable = pgTable('chain_steps', {
  id: serial('id').primaryKey(),
  chainId: integer('chain_id').notNull().references(() => chainsTable.id, { onDelete: 'cascade' }),

  prompt: text('prompt').notNull(),
  result: text('result'),

  cycleCount: integer('cycle_count').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export const queuesTable = pgTable('queues', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export const queuedChainsTable = pgTable('queued_chains', {
  id: serial('id').primaryKey(),
  queueId: integer('queue_id').notNull().references(() => queuesTable.id, { onDelete: 'cascade' }),
  chainId: integer('chain_id').notNull().references(() => chainsTable.id, { onDelete: 'cascade' }),

  status: text('status').notNull().default('pending'),
  error: text('error'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export const queuedChainStepsTable = pgTable('queued_chain_steps', {
  id: serial('id').primaryKey(),
  queuedChainId: integer('queued_chain_id').notNull().references(() => queuedChainsTable.id, { onDelete: 'cascade' }),
  chainStepId: integer('chain_step_id').notNull().references(() => chainStepsTable.id, { onDelete: 'cascade' }),

  response: text('response'),
  status: text('status').notNull().default('pending'),
  error: text('error'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export type InsertSubscriber = typeof subscribersTable.$inferInsert;
export type InsertRateLimit = typeof rateLimitsTable.$inferInsert;
export type InsertChain = typeof chainsTable.$inferInsert;
export type SelectChain = typeof chainsTable.$inferSelect;
export type SelectChainStep = typeof chainStepsTable.$inferSelect;
export type SelectQueue = typeof queuesTable.$inferSelect;
export type SelectQueuedChain = typeof queuedChainsTable.$inferSelect;
export type SelectQueuedChainStep = typeof queuedChainStepsTable.$inferSelect;
