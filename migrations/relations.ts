import { relations } from "drizzle-orm/relations";
import { users, subscriptions, queuedChains, queuedChainVariables, workflows, workflowConnections, workflowNodes, workflowExecutions, chains, queues, sessions, chainSteps, queuedChainSteps, accounts } from "./schema";

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	subscriptions: many(subscriptions),
	queuedChainVariables: many(queuedChainVariables),
	workflows: many(workflows),
	workflowExecutions: many(workflowExecutions),
	chains: many(chains),
	queues: many(queues),
	sessions: many(sessions),
	queuedChains: many(queuedChains),
	queuedChainSteps: many(queuedChainSteps),
	accounts: many(accounts),
}));

export const queuedChainVariablesRelations = relations(queuedChainVariables, ({one}) => ({
	queuedChain: one(queuedChains, {
		fields: [queuedChainVariables.queuedChainId],
		references: [queuedChains.id]
	}),
	user: one(users, {
		fields: [queuedChainVariables.userId],
		references: [users.id]
	}),
}));

export const queuedChainsRelations = relations(queuedChains, ({one, many}) => ({
	queuedChainVariables: many(queuedChainVariables),
	queue: one(queues, {
		fields: [queuedChains.queueId],
		references: [queues.id]
	}),
	chain: one(chains, {
		fields: [queuedChains.chainId],
		references: [chains.id]
	}),
	user: one(users, {
		fields: [queuedChains.userId],
		references: [users.id]
	}),
	queuedChainSteps: many(queuedChainSteps),
}));

export const workflowsRelations = relations(workflows, ({one, many}) => ({
	user: one(users, {
		fields: [workflows.userId],
		references: [users.id]
	}),
	workflowConnections: many(workflowConnections),
	workflowNodes: many(workflowNodes),
	workflowExecutions: many(workflowExecutions),
}));

export const workflowConnectionsRelations = relations(workflowConnections, ({one}) => ({
	workflow: one(workflows, {
		fields: [workflowConnections.workflowId],
		references: [workflows.id]
	}),
	workflowNode_fromNodeId: one(workflowNodes, {
		fields: [workflowConnections.fromNodeId],
		references: [workflowNodes.id],
		relationName: "workflowConnections_fromNodeId_workflowNodes_id"
	}),
	workflowNode_toNodeId: one(workflowNodes, {
		fields: [workflowConnections.toNodeId],
		references: [workflowNodes.id],
		relationName: "workflowConnections_toNodeId_workflowNodes_id"
	}),
}));

export const workflowNodesRelations = relations(workflowNodes, ({one, many}) => ({
	workflowConnections_fromNodeId: many(workflowConnections, {
		relationName: "workflowConnections_fromNodeId_workflowNodes_id"
	}),
	workflowConnections_toNodeId: many(workflowConnections, {
		relationName: "workflowConnections_toNodeId_workflowNodes_id"
	}),
	workflow: one(workflows, {
		fields: [workflowNodes.workflowId],
		references: [workflows.id]
	}),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({one}) => ({
	workflow: one(workflows, {
		fields: [workflowExecutions.workflowId],
		references: [workflows.id]
	}),
	user: one(users, {
		fields: [workflowExecutions.userId],
		references: [users.id]
	}),
}));

export const chainsRelations = relations(chains, ({one, many}) => ({
	user: one(users, {
		fields: [chains.userId],
		references: [users.id]
	}),
	queuedChains: many(queuedChains),
	chainSteps: many(chainSteps),
}));

export const queuesRelations = relations(queues, ({one, many}) => ({
	user: one(users, {
		fields: [queues.userId],
		references: [users.id]
	}),
	queuedChains: many(queuedChains),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const chainStepsRelations = relations(chainSteps, ({one, many}) => ({
	chain: one(chains, {
		fields: [chainSteps.chainId],
		references: [chains.id]
	}),
	queuedChainSteps: many(queuedChainSteps),
}));

export const queuedChainStepsRelations = relations(queuedChainSteps, ({one}) => ({
	queuedChain: one(queuedChains, {
		fields: [queuedChainSteps.queuedChainId],
		references: [queuedChains.id]
	}),
	chainStep: one(chainSteps, {
		fields: [queuedChainSteps.chainStepId],
		references: [chainSteps.id]
	}),
	user: one(users, {
		fields: [queuedChainSteps.userId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));