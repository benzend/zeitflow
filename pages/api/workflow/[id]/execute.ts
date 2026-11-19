import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowsTable, workflowNodesTable, workflowConnectionsTable, workflowExecutionsTable, usersTable, slackBotsTable } from "@/schema";
import { eq } from "drizzle-orm";

import { chat } from "@/lib/openrouter";
import {
  collectAvailableVariables,
  createWalk,
  enqueueSuccessors,
  outgoingConnections,
  prepareExecution,
  shiftReady,
  substituteVariables,
  unfinishedNodesMessage,
  type WorkflowConnection,
  type WorkflowNode,
} from "@/lib/workflow-engine";
// Legacy imports - kept for backward compatibility
import { sendWorkflowEmail } from "@/lib/email";
import { sendSlackMessage } from "@/lib/slack";
import { sendWorkflowSMS } from "@/lib/sms";
// New integration system
import { isIntegration, getIntegrationConfigKey } from "@/lib/integrations/registry";
import { executeIntegration, buildExecutionOptions } from "@/lib/integrations/executor";
// Logging system
import { createIntegrationLogger } from "@/lib/integrations/logger";
import type { LogEntry, IntegrationLogger } from "@/lib/integrations/types";
// Webhook utilities
import { validateWebhookSecret } from "@/lib/webhook-utils";
// Encryption
import { decrypt, hashValue, decryptConfigSecrets } from "@/lib/encryption";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const workflowId = parseInt(req.query.id as string, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ error: 'Invalid workflow ID' });
  }

  // Get workflow nodes and connections
  const dbNodes = await db
    .select()
    .from(workflowNodesTable)
    .where(eq(workflowNodesTable.workflowId, workflowId));

  // Map database nodes to WorkflowNode interface
  const nodes: WorkflowNode[] = dbNodes.map(node => ({
    id: node.id,
    type: node.type as 'entry' | 'ai' | 'scheduler' | 'review' | 'slack' | 'email' | 'sms' | 'telegram' | 'condition',
    label: node.label,
    entryType: node.entryType || undefined,
    config: node.config || undefined,
  }));

  if (nodes.length === 0) {
    return res.status(404).json({ error: 'Invalid workflow. No nodes found' });
  }

  // Verify workflow exists and belongs to user
  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(
      eq(workflowsTable.id, workflowId),
    )
    .limit(1);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  let userId: string = '';

  // Check for webhook secret authentication first (query param)
  const webhookSecret = req.query.secret as string | undefined;
  const isWebhookAuth = !!webhookSecret;

  if (isWebhookAuth) {
    // Validate webhook secret
    if (!validateWebhookSecret(webhookSecret, decrypt(workflow.webhookSecret))) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }
    // Use the workflow owner's userId for webhook executions
    userId = workflow.userId;
  } else {
    // Determine if this is an API entry request by checking:
    // 1. If entryNodeId is provided, check if that specific node is API type
    // 2. Otherwise, check if Authorization header is present (API call)
    const requestEntryNodeId = req.body?.entryNodeId;
    const selectedEntryNode = requestEntryNodeId
      ? nodes.find(n => n.id === requestEntryNodeId)
      : null;
    const isApiEntry = selectedEntryNode
      ? selectedEntryNode.entryType === 'api'
      : req.headers.authorization?.startsWith('Bearer ');

    if (isApiEntry) {
      // Check for API token in Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'API token required' });
      }

      const apiToken = authHeader.substring(7); // Remove 'Bearer ' prefix

      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.apiTokenHash, hashValue(apiToken)))
        .limit(1);

      if (user.length === 0) {
        return res.status(401).json({ error: 'Invalid API token' });
      }

      userId = user[0].id;
    } else {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, session.user.email))
        .limit(1);

      if (user.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      userId = user[0].id;
    }

    if (workflow.userId !== userId.toString()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Get workflow nodes and connections
    const dbConnections = await db
      .select()
      .from(workflowConnectionsTable)
      .where(eq(workflowConnectionsTable.workflowId, workflowId));

    // Map database connections to WorkflowConnection interface
    const connections: WorkflowConnection[] = dbConnections.map(conn => ({
      id: conn.id.toString(),
      fromNodeId: conn.fromNodeId,
      toNodeId: conn.toNodeId,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
    }));

    // Extract entryNodeId from request body
    const { inputData, entryNodeId } = req.body;

    // Create execution record
    const [execution] = await db.insert(workflowExecutionsTable).values({
      workflowId,
      userId: userId.toString(),
      status: 'running',
      inputData: JSON.stringify(inputData || {}),
    }).returning();

    const result = await executeWorkflow(workflowId, userId, inputData || {}, connections, nodes, execution.id, entryNodeId);

    // Serialize logs for storage (convert Date objects to ISO strings)
    const serializedLogs = result.logs.map(log => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));

    // Update execution status with output data and logs
    await db.update(workflowExecutionsTable)
      .set({
        status: 'completed',
        completedAt: new Date(),
        outputData: JSON.stringify(result.outputData),
        logs: JSON.stringify(serializedLogs),
      })
      .where(eq(workflowExecutionsTable.id, execution.id));

    res.status(200).json({ success: true, executionId: execution.id, outputData: result.outputData });
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
}

interface ExecutionResult {
  outputData: Record<string, unknown>;
  logs: LogEntry[];
}

async function executeWorkflow(
  workflowId: number,
  userId: string,
  inputData: Record<string, unknown>,
  connections: WorkflowConnection[],
  nodes: WorkflowNode[],
  executionId: number,
  entryNodeId?: string
): Promise<ExecutionResult> {
  // Graph validation, entry selection, and in-degree adjustment live in
  // lib/workflow-engine.ts so the Rust core can replay the same decisions.
  const prepared = prepareExecution(nodes, connections, entryNodeId);
  const walk = createWalk(prepared);
  const outputData: Record<string, unknown> = {};

  // Collect all log entries from the execution
  const allLogs: LogEntry[] = [];

  // Helper to create a logger for a node
  const createNodeLogger = (nodeType: string, nodeId: string): IntegrationLogger => {
    const logger = createIntegrationLogger(nodeType, nodeId, executionId.toString(), {
      minLevel: 'debug',
      consoleOutput: process.env.NODE_ENV !== 'production',
    });
    return logger;
  };

  // Execute nodes in BFS order
  while (true) {
    const node = shiftReady(walk);
    if (!node) break;

    // Parse config and decrypt any encrypted secrets
    const config = decryptConfigSecrets(JSON.parse(node.config || '{}'));

    // Create logger for this node
    const nodeLogger = createNodeLogger(node.type, node.id);

    // Execute node based on type
    switch (node.type) {
      case 'entry':
        nodeLogger.info(`Processing entry node`, { entryType: node.entryType, label: node.label });
        switch (node.entryType) {
          case 'api':
          case 'form':
          case 'webhook':
            // Store the raw input data for variable substitution
            outputData['userInput'] = inputData;
            // Also store individual fields for easier access
            if (inputData && typeof inputData === 'object') {
              Object.assign(outputData, inputData);
              nodeLogger.debug(`Input fields captured`, { fieldCount: Object.keys(inputData).length, fields: Object.keys(inputData) });
            }
            nodeLogger.info(`Entry data processed successfully`);
            break;
           default:
             nodeLogger.warn(`Unknown entry type: ${node.entryType}`);
             break;
         }
         allLogs.push(...nodeLogger.getEntries());
         break;
      case 'ai':
        const aiConfig = (config.aiConfig || {}) as Record<string, string>;
        nodeLogger.info(`Processing AI node`, { label: node.label, model: aiConfig.model || 'default' });

        // Collect available variables from connected nodes
        const availableVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);
        nodeLogger.debug(`Variables collected`, { variableCount: Object.keys(availableVariables).length, variables: Object.keys(availableVariables) });

        // Substitute variables in system prompt
        const systemPrompt = aiConfig.systemPrompt
          ? substituteVariables(aiConfig.systemPrompt, availableVariables)
          : '';

        // Substitute variables in user prompt
        const userPrompt = aiConfig.userPrompt
          ? substituteVariables(aiConfig.userPrompt, availableVariables)
          : '';

        nodeLogger.debug(`Prompts prepared`, {
          systemPromptLength: systemPrompt.length,
          userPromptLength: userPrompt.length
        });

        const endTimer = nodeLogger.startTimer('AI API call');
        const aiResponse = await chat(userPrompt, aiConfig.model, { systemPrompt });
        endTimer();

        if ('error' in aiResponse && aiResponse.error) {
          outputData[node.id] = { error: aiResponse.error };
          nodeLogger.error(`AI call failed`, { error: aiResponse.error });
          allLogs.push(...nodeLogger.getEntries());
          break;
        }
        outputData[node.id] = { response: aiResponse.text };
        nodeLogger.info(`AI response received`, { responseLength: aiResponse.text?.length || 0 });
        allLogs.push(...nodeLogger.getEntries());
        break;
      case 'scheduler':
        nodeLogger.info(`Processing scheduler node`, { label: node.label });
        // TODO: Implement scheduler call
        nodeLogger.warn(`Scheduler node not yet implemented`);
        allLogs.push(...nodeLogger.getEntries());
        break;
      case 'review':
        nodeLogger.info(`Processing review node`, { label: node.label });
        // TODO: Implement review call
        nodeLogger.warn(`Review node not yet implemented`);
        allLogs.push(...nodeLogger.getEntries());
        break;
      // Handle all registered integrations through the unified executor
      default:
        if (isIntegration(node.type)) {
          nodeLogger.info(`Processing ${node.type} integration`, { label: node.label });
          const configKey = getIntegrationConfigKey(node.type);
          const integrationConfig = configKey ? config[configKey] || {} : {};

          // Collect available variables from connected nodes
          const integrationVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);
          nodeLogger.debug(`Variables collected for integration`, { variableCount: Object.keys(integrationVariables).length });

          // Build execution options
          const execOptions = buildExecutionOptions({
            nodeType: node.type,
            nodeConfig: integrationConfig,
            userId,
            executionId: executionId.toString(),
            nodeId: node.id,
            collectedVariables: integrationVariables,
            db,
          });

          // Execute the integration
          const result = await executeIntegration(execOptions);

          // Collect logs from the integration executor
          const integrationLogs = result.logger.getEntries();
          allLogs.push(...integrationLogs);

          if (!result.success) {
            outputData[node.id] = { error: result.error };
            nodeLogger.error(`Integration ${node.type} failed`, { error: result.error });
          } else {
            outputData[node.id] = { success: true, ...result.data };
            nodeLogger.info(`Integration ${node.type} completed successfully`);
          }
          allLogs.push(...nodeLogger.getEntries());
        } else {
          nodeLogger.warn(`Unknown node type: ${node.type}`);
          allLogs.push(...nodeLogger.getEntries());
        }
        break;
    }

    // Update successors and add ready ones to queue
    const allSuccessorConnections = walk.adjacencyList.get(node.id) || [];
    let successorConnections;
    try {
      successorConnections = outgoingConnections(node, allSuccessorConnections, outputData[node.id]);
    } catch (error) {
      if (error instanceof Error) {
        nodeLogger.error(error.message);
      }
      throw error;
    }
    if (node.type === 'condition') {
      const conditionOutput = outputData[node.id] as { path?: string } | undefined;
      const selectedPath = conditionOutput?.path;
      if (selectedPath) {
        nodeLogger.info(`Condition evaluated to ${selectedPath}, following ${successorConnections.length} of ${allSuccessorConnections.length} paths`);
      }
    }
    enqueueSuccessors(successorConnections, walk.inDegree, walk.readyQueue, walk.queued);
  }

  // Verify all queued nodes were executed
  // Note: With condition nodes, not all executable nodes will be queued (branches not taken)
  // So we check against 'queued' (nodes that were added to queue) not 'executableNodes' (all reachable nodes)
  const unfinished = unfinishedNodesMessage(nodes, walk.queued, walk.executed);
  if (unfinished) {
    throw new Error(unfinished);
  }

  // Sort logs by timestamp
  allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return { outputData, logs: allLogs };
}
