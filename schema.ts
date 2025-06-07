import { pgTable, serial, text, timestamp, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';

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

// NextAuth.js required tables
export const usersTable = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accountsTable = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] })
}));

export const sessionsTable = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokensTable = pgTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] })
}));

export const chainsTable = pgTable('chains', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),

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
  position: integer('position').notNull(),

  cycleCount: integer('cycle_count').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export const queuesTable = pgTable('queues', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export const queuedChainsTable = pgTable('queued_chains', {
  id: serial('id').primaryKey(),
  queueId: integer('queue_id').notNull().references(() => queuesTable.id, { onDelete: 'cascade' }),
  chainId: integer('chain_id').notNull().references(() => chainsTable.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),

  name: text('name'),

  status: text('status').notNull().default('pending'),
  error: text('error'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date())
});

export const queuedChainStepsTable = pgTable('queued_chain_steps', {
  id: serial('id').primaryKey(),
  queuedChainId: integer('queued_chain_id').notNull().references(() => queuedChainsTable.id, { onDelete: 'cascade' }),
  chainStepId: integer('chain_step_id').notNull().references(() => chainStepsTable.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),

  prompt: text('prompt').notNull(),
  position: integer('position').notNull(),

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

// Add missing type for dashboard query
export type SelectQueuedChainWithStatus = SelectQueuedChain;
