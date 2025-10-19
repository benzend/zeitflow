import { pgTable, text, integer, timestamp, foreignKey, serial, unique, varchar, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const subscriptionPlans = pgTable("subscription_plans", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	amount: integer().notNull(),
	currency: text().default('usd').notNull(),
	interval: text().notNull(),
	queueLimit: integer("queue_limit").default(20).notNull(),
	features: text(),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	customerId: text("customer_id").notNull(),
	priceId: text("price_id").notNull(),
	status: text().notNull(),
	currentPeriodStart: timestamp("current_period_start", { mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }).notNull(),
	cancelAtPeriodEnd: integer("cancel_at_period_end").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const queuedChainVariables = pgTable("queued_chain_variables", {
	id: serial().primaryKey().notNull(),
	queuedChainId: integer("queued_chain_id").notNull(),
	userId: text("user_id").notNull(),
	variableName: text("variable_name").notNull(),
	variableValue: text("variable_value").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.queuedChainId],
			foreignColumns: [queuedChains.id],
			name: "queued_chain_variables_queued_chain_id_queued_chains_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "queued_chain_variables_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const workflows = pgTable("workflows", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('draft').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "workflows_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const workflowConnections = pgTable("workflow_connections", {
	id: serial().primaryKey().notNull(),
	workflowId: integer("workflow_id").notNull(),
	fromNodeId: text("from_node_id").notNull(),
	toNodeId: text("to_node_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_connections_workflow_id_workflows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fromNodeId],
			foreignColumns: [workflowNodes.id],
			name: "workflow_connections_from_node_id_workflow_nodes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toNodeId],
			foreignColumns: [workflowNodes.id],
			name: "workflow_connections_to_node_id_workflow_nodes_id_fk"
		}).onDelete("cascade"),
]);

export const workflowNodes = pgTable("workflow_nodes", {
	id: text().primaryKey().notNull(),
	workflowId: integer("workflow_id").notNull(),
	type: text().notNull(),
	positionX: integer("position_x").notNull(),
	positionY: integer("position_y").notNull(),
	label: text().notNull(),
	config: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_nodes_workflow_id_workflows_id_fk"
		}).onDelete("cascade"),
]);

export const workflowExecutions = pgTable("workflow_executions", {
	id: serial().primaryKey().notNull(),
	workflowId: integer("workflow_id").notNull(),
	userId: text("user_id").notNull(),
	status: text().default('pending').notNull(),
	inputData: text("input_data"),
	outputData: text("output_data"),
	error: text(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_executions_workflow_id_workflows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "workflow_executions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const rateLimits = pgTable("rate_limits", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	count: integer().default(1).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("rate_limits_key_unique").on(table.key),
]);

export const subscribers = pgTable("subscribers", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("subscribers_email_unique").on(table.email),
]);

export const chains = pgTable("chains", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text(),
	cycleCount: integer("cycle_count").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chains_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const queues = pgTable("queues", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "queues_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const queuedChains = pgTable("queued_chains", {
	id: serial().primaryKey().notNull(),
	queueId: integer("queue_id").notNull(),
	chainId: integer("chain_id").notNull(),
	status: text().default('pending').notNull(),
	error: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	userId: text("user_id").notNull(),
	name: text(),
}, (table) => [
	foreignKey({
			columns: [table.queueId],
			foreignColumns: [queues.id],
			name: "queued_chains_queue_id_queues_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chainId],
			foreignColumns: [chains.id],
			name: "queued_chains_chain_id_chains_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "queued_chains_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	password: text(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const chainSteps = pgTable("chain_steps", {
	id: serial().primaryKey().notNull(),
	chainId: integer("chain_id").notNull(),
	prompt: text().notNull(),
	result: text(),
	cycleCount: integer("cycle_count").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	position: integer().notNull(),
	model: text().default('google/gemini-2.0-flash-001').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chainId],
			foreignColumns: [chains.id],
			name: "chain_steps_chain_id_chains_id_fk"
		}).onDelete("cascade"),
]);

export const queuedChainSteps = pgTable("queued_chain_steps", {
	id: serial().primaryKey().notNull(),
	queuedChainId: integer("queued_chain_id").notNull(),
	chainStepId: integer("chain_step_id").notNull(),
	response: text(),
	status: text().default('pending').notNull(),
	error: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	userId: text("user_id").notNull(),
	prompt: text().notNull(),
	position: integer().notNull(),
	model: text().default('google/gemini-2.0-flash-001').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.queuedChainId],
			foreignColumns: [queuedChains.id],
			name: "queued_chain_steps_queued_chain_id_queued_chains_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chainStepId],
			foreignColumns: [chainSteps.id],
			name: "queued_chain_steps_chain_step_id_chain_steps_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "queued_chain_steps_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const verificationTokens = pgTable("verificationTokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationTokens_identifier_token_pk"}),
]);

export const accounts = pgTable("accounts", {
	userId: text("user_id").notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_providerAccountId_pk"}),
]);
