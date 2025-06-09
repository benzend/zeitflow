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

// Stripe subscription tables
export const subscriptionsTable = pgTable('subscriptions', {
  id: text('id').primaryKey(), // Stripe subscription ID
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull(), // Stripe customer ID
  priceId: text('price_id').notNull(), // Stripe price ID
  status: text('status').notNull(), // active, canceled, past_due, etc.
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: integer('cancel_at_period_end').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull().$onUpdateFn(() => new Date()),
});

export const subscriptionPlansTable = pgTable('subscription_plans', {
  id: text('id').primaryKey(), // Stripe price ID
  name: text('name').notNull(),
  description: text('description'),
  amount: integer('amount').notNull(), // in cents
  currency: text('currency').notNull().default('usd'),
  interval: text('interval').notNull(), // month, year
  queueLimit: integer('queue_limit').notNull().default(20), // requests per hour
  features: text('features'), // JSON string of features
  isActive: integer('is_active').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NextAuth.js required tables
export const usersTable = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'), // For email/password authentication
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

// Subscription types
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
export type SelectSubscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlansTable.$inferInsert;
export type SelectSubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;

// Add missing type for dashboard query
export type SelectQueuedChainWithStatus = SelectQueuedChain & { steps?: SelectQueuedChainStep[] };
