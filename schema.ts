import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  varchar,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";

export const rateLimitsTable = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  count: integer("count").notNull().default(1),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscribersTable = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stripe subscription tables
export const subscriptionsTable = pgTable("subscriptions", {
  id: text("id").primaryKey(), // Stripe subscription ID
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull(), // Stripe customer ID
  priceId: text("price_id").notNull(), // Stripe price ID
  status: text("status").notNull(), // active, canceled, past_due, etc.
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: integer("cancel_at_period_end").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const subscriptionPlansTable = pgTable("subscription_plans", {
  id: text("id").primaryKey(), // Stripe price ID
  name: text("name").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("usd"),
  interval: text("interval").notNull(), // month, year
  queueLimit: integer("queue_limit").notNull().default(20), // requests per hour
  features: text("features"), // JSON string of features
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NextAuth.js required tables
export const usersTable = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // For email/password authentication
  apiToken: text("api_token").unique(), // UUID for API access
});

export const accountsTable = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessionsTable = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokensTable = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const chainsTable = pgTable("chains", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  name: text("name"),

  cycleCount: integer("cycle_count").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const chainStepsTable = pgTable("chain_steps", {
  id: serial("id").primaryKey(),
  chainId: integer("chain_id")
    .notNull()
    .references(() => chainsTable.id, { onDelete: "cascade" }),

  prompt: text("prompt").notNull(),
  result: text("result"),
  position: integer("position").notNull(),

  model: text("model").notNull().default("google/gemini-2.0-flash-001"),

  cycleCount: integer("cycle_count").notNull(),

  aiDescription: text("ai_description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const queuesTable = pgTable("queues", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const queuedChainsTable = pgTable("queued_chains", {
  id: serial("id").primaryKey(),
  queueId: integer("queue_id")
    .notNull()
    .references(() => queuesTable.id, { onDelete: "cascade" }),
  chainId: integer("chain_id")
    .notNull()
    .references(() => chainsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  name: text("name"),

  status: text("status").notNull().default("pending"),
  error: text("error"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const queuedChainVariablesTable = pgTable("queued_chain_variables", {
  id: serial("id").primaryKey(),
  queuedChainId: integer("queued_chain_id")
    .notNull()
    .references(() => queuedChainsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  variableName: text("variable_name").notNull(),
  variableValue: text("variable_value").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const queuedChainStepsTable = pgTable("queued_chain_steps", {
  id: serial("id").primaryKey(),
  queuedChainId: integer("queued_chain_id")
    .notNull()
    .references(() => queuedChainsTable.id, { onDelete: "cascade" }),
  chainStepId: integer("chain_step_id")
    .notNull()
    .references(() => chainStepsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  model: text("model").notNull().default("google/gemini-2.0-flash-001"),

  prompt: text("prompt").notNull(),
  position: integer("position").notNull(),

  aiDescription: text("ai_description"),

  response: text("response"),
  status: text("status").notNull().default("pending"),
  error: text("error"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// Workflow system tables
export const workflowsTable = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  webhookSecret: text("webhook_secret"), // Secret token for webhook authentication
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const workflowNodesTable = pgTable("workflow_nodes", {
  id: text("id").primaryKey(), // Using string ID to match frontend
  workflowId: integer("workflow_id")
    .notNull()
    .references(() => workflowsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // entry, ai, scheduler, review
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
  label: text("label").notNull(),
  config: text("config"), // JSON string containing node-specific configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  entryType: text("entry_type"),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const workflowConnectionsTable = pgTable("workflow_connections", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id")
    .notNull()
    .references(() => workflowsTable.id, { onDelete: "cascade" }),
  fromNodeId: text("from_node_id")
    .notNull()
    .references(() => workflowNodesTable.id, { onDelete: "cascade" }),
  toNodeId: text("to_node_id")
    .notNull()
    .references(() => workflowNodesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowExecutionsTable = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id")
    .notNull()
    .references(() => workflowsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  inputData: text("input_data"), // JSON string of input data
  outputData: text("output_data"), // JSON string of output data
  logs: text("logs"), // JSON array of LogEntry objects for execution logging
  error: text("error"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat threads table for grouping conversations
export const chatThreadsTable = pgTable("chat_threads", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// Chat messages table for workflow creation conversations
export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .notNull()
    .references(() => chatThreadsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  workflowId: integer("workflow_id").references(() => workflowsTable.id, { onDelete: "set null" }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat events table for tracking workflow proposals, approvals, rejections
export const chatEventsTable = pgTable("chat_events", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .notNull()
    .references(() => chatThreadsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'workflow_proposed' | 'workflow_approved' | 'workflow_rejected'
  workflowId: integer("workflow_id")
    .references(() => workflowsTable.id, { onDelete: "set null" }),
  proposalData: text("proposal_data"), // JSON of proposed workflow
  metadata: text("metadata"), // JSON for extra context (rejection reason, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assets table for centralized media management
export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // bytes
  width: integer("width"), // Image width in pixels
  height: integer("height"), // Image height in pixels
  blurDataURL: text("blur_data_url"), // Blur placeholder for Next.js Image
  url: text("url").notNull(),
  altText: text("alt_text"),
  description: text("description"),
  tags: text("tags"), // JSON array of tags
  uploadedBy: text("uploaded_by")
    .references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// Slack bots table for workflow integration
export const slackBotsTable = pgTable("slack_bots", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("ZeitFlow Bot"),
  botToken: text("bot_token").notNull(),
  teamId: text("team_id").notNull(),
  teamName: text("team_name"),
  botUserId: text("bot_user_id").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// Blog posts table
export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  published: boolean("published").notNull().default(false),
  authorId: text("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  featuredImage: text("featured_image"),
  tags: text("tags"), // JSON array of tags
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export type InsertSubscriber = typeof subscribersTable.$inferInsert;
export type InsertRateLimit = typeof rateLimitsTable.$inferInsert;

// Chain types
export type InsertChain = typeof chainsTable.$inferInsert;
export type SelectChain = typeof chainsTable.$inferSelect;
export type SelectChainStep = typeof chainStepsTable.$inferSelect;
export type SelectQueue = typeof queuesTable.$inferSelect;
export type SelectQueuedChain = typeof queuedChainsTable.$inferSelect;
export type SelectQueuedChainStep = typeof queuedChainStepsTable.$inferSelect;
export type SelectQueuedChainVariable =
  typeof queuedChainVariablesTable.$inferSelect;
export type SelectQueuedChainVariables =
  typeof queuedChainVariablesTable.$inferSelect;

// Subscription types
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
export type SelectSubscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlansTable.$inferInsert;
export type SelectSubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;

// Workflow types
export type InsertWorkflow = typeof workflowsTable.$inferInsert;
export type SelectWorkflow = typeof workflowsTable.$inferSelect;
export type InsertWorkflowNode = typeof workflowNodesTable.$inferInsert;
export type SelectWorkflowNode = typeof workflowNodesTable.$inferSelect;
export type InsertWorkflowConnection = typeof workflowConnectionsTable.$inferInsert;
export type SelectWorkflowConnection = typeof workflowConnectionsTable.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutionsTable.$inferInsert;
export type SelectWorkflowExecution = typeof workflowExecutionsTable.$inferSelect;

// Chat types
export type InsertChatThread = typeof chatThreadsTable.$inferInsert;
export type SelectChatThread = typeof chatThreadsTable.$inferSelect;
export type InsertChatMessage = typeof chatMessagesTable.$inferInsert;
export type SelectChatMessage = typeof chatMessagesTable.$inferSelect;
export type InsertChatEvent = typeof chatEventsTable.$inferInsert;
export type SelectChatEvent = typeof chatEventsTable.$inferSelect;

// Asset types
export type InsertAsset = typeof assetsTable.$inferInsert;
export type SelectAsset = typeof assetsTable.$inferSelect;

// Slack bot types
export type InsertSlackBot = typeof slackBotsTable.$inferInsert;
export type SelectSlackBot = typeof slackBotsTable.$inferSelect;

// Blog types
export type InsertBlogPost = typeof blogPostsTable.$inferInsert;
export type SelectBlogPost = typeof blogPostsTable.$inferSelect;

// Add missing type for dashboard query
export type SelectQueuedChainWithStatus = SelectQueuedChain & {
  steps?: SelectQueuedChainStep[];
};
