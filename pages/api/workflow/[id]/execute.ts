import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowsTable, workflowNodesTable, workflowConnectionsTable, workflowExecutionsTable, usersTable, slackBotsTable } from "@/schema";
import { eq } from "drizzle-orm";

import { chat } from "@/lib/openrouter";
import { extractVariables } from "@/lib/variables-client";
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

interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

interface WorkflowNode {
  id: string;
  type: 'entry' | 'ai' | 'scheduler' | 'review' | 'slack' | 'email' | 'sms' | 'telegram' | 'condition';
  label: string;
  entryType?: string;
  config?: string;
}

/**
 * Convert node label to variable name (matches frontend logic)
 */
function labelToVariableName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Collects available variables from ALL upstream ancestor nodes (not just direct predecessors).
 * Uses BFS to traverse the full upstream graph so that variables from earlier nodes
 * (e.g., entry node data) are available in downstream nodes like email/slack.
 * Returns nested structure matching autocomplete: {node_name: {field: value}}
 */
function collectAvailableVariables(
  nodeId: string,
  connections: WorkflowConnection[],
  nodes: WorkflowNode[],
  inputData: Record<string, unknown>,
  nodeOutputs: Record<string, unknown>
): Record<string, unknown> {
  const variables: Record<string, unknown> = {};

  // BFS to find all upstream ancestor nodes
  const visited = new Set<string>();
  const queue: string[] = [];

  // Start with direct incoming connections
  const directIncoming = connections.filter(edge => edge.toNodeId === nodeId);
  for (const edge of directIncoming) {
    if (!visited.has(edge.fromNodeId)) {
      visited.add(edge.fromNodeId);
      queue.push(edge.fromNodeId);
    }
  }

  // Traverse upstream
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const incomingToThis = connections.filter(edge => edge.toNodeId === currentId);
    for (const edge of incomingToThis) {
      if (!visited.has(edge.fromNodeId)) {
        visited.add(edge.fromNodeId);
        queue.push(edge.fromNodeId);
      }
    }
  }

  // For each upstream ancestor, collect its variables
  for (const ancestorId of visited) {
    const sourceNode = nodes.find(n => n.id === ancestorId);
    if (sourceNode) {
      const config = JSON.parse(sourceNode.config || '{}');
      const nodeLabel = sourceNode.label || sourceNode.id;
      const varName = labelToVariableName(nodeLabel);

      // Add variables from entry nodes
      if (sourceNode.type === 'entry') {
        if (sourceNode.entryType === 'api' || sourceNode.entryType === 'form' || sourceNode.entryType === 'webhook') {
          // Create nested object for entry node
          const entryVars: Record<string, unknown> = {};

          // Add input data fields
          if (inputData && typeof inputData === 'object') {
            Object.keys(inputData).forEach(key => {
              entryVars[key] = inputData[key];
            });
          }

          // Add fields from entry node configuration
          if (config.fields && Array.isArray(config.fields)) {
            config.fields.forEach((field: { key: string }) => {
              if (inputData && inputData[field.key]) {
                entryVars[field.key] = inputData[field.key];
              }
            });
          }

          variables[varName] = entryVars;
        }
      }

      // Add AI output variables
      if (sourceNode.type === 'ai' && nodeOutputs[sourceNode.id]) {
        const nodeOutput = nodeOutputs[sourceNode.id] as { response?: string };
        variables[varName] = {
          output: nodeOutput.response || ''
        };
      }

      // Add scheduler output variables
      if (sourceNode.type === 'scheduler' && nodeOutputs[sourceNode.id]) {
        const schedulerOutput = nodeOutputs[sourceNode.id] as { scheduledTime?: string; calendarLink?: string };
        variables[varName] = {
          eventId: schedulerOutput.scheduledTime || '',
          eventLink: schedulerOutput.calendarLink || '',
          scheduledTime: schedulerOutput.scheduledTime || ''
        };
      }

      // Add email output variables
      if (sourceNode.type === 'email' && nodeOutputs[sourceNode.id]) {
        const emailOutput = nodeOutputs[sourceNode.id] as { success?: boolean; error?: string };
        variables[varName] = {
          messageId: '', // Would need to be captured from email service
          status: emailOutput.success ? 'sent' : 'failed'
        };
      }

      // Add slack output variables
      if (sourceNode.type === 'slack' && nodeOutputs[sourceNode.id]) {
        const slackOutput = nodeOutputs[sourceNode.id] as { success?: boolean; error?: string; messageId?: string; channel?: string };
        variables[varName] = {
          messageId: slackOutput.messageId || '',
          channel: slackOutput.channel || '',
          timestamp: '' // Would need to be captured from Slack response
        };
      }

      // Add SMS output variables
      if (sourceNode.type === 'sms' && nodeOutputs[sourceNode.id]) {
        const smsOutput = nodeOutputs[sourceNode.id] as { success?: boolean; error?: string; messageId?: string };
        variables[varName] = {
          messageId: smsOutput.messageId || '',
          status: smsOutput.success ? 'sent' : 'failed'
        };
      }

      // Add Telegram output variables
      if (sourceNode.type === 'telegram' && nodeOutputs[sourceNode.id]) {
        const telegramOutput = nodeOutputs[sourceNode.id] as { success?: boolean; error?: string; messageId?: number; chatId?: string };
        variables[varName] = {
          messageId: telegramOutput.messageId?.toString() || '',
          chatId: telegramOutput.chatId || ''
        };
      }

      // Add condition output variables
      if (sourceNode.type === 'condition' && nodeOutputs[sourceNode.id]) {
        const conditionOutput = nodeOutputs[sourceNode.id] as { result?: boolean; leftValue?: unknown; rightValue?: unknown };
        variables[varName] = {
          result: conditionOutput.result || false,
          leftValue: conditionOutput.leftValue,
          rightValue: conditionOutput.rightValue
        };
      }

      // Add review output variables
      if (sourceNode.type === 'review' && nodeOutputs[sourceNode.id]) {
        const reviewOutput = nodeOutputs[sourceNode.id] as { approved?: boolean; feedback?: string };
        variables[varName] = {
          approved: reviewOutput.approved || false,
          feedback: reviewOutput.feedback || ''
        };
      }

      // Generic fallback: for any integration node type not explicitly handled above,
      // expose all stored output fields as variables. This covers youtube, discord,
      // http_request, google_sheets, github, notion, airtable, whatsapp, jira,
      // hubspot, webhook, linear, google_drive, stripe, shopify, and any future integrations.
      if (!variables[varName] && nodeOutputs[sourceNode.id]) {
        const output = nodeOutputs[sourceNode.id];
        if (output && typeof output === 'object') {
          variables[varName] = { ...output as Record<string, unknown> };
        }
      }
    }
  }

  return variables;
}

/**
 * Substitutes variables in a prompt string with their values
 * Supports nested paths like {{node.field}}
 */
function substituteVariables(prompt: string, variables: Record<string, unknown>): string {
  let processedPrompt = prompt;

  // Extract all variables from the prompt
  const extractedVars = extractVariables(prompt);

  // Replace each variable with its value
  extractedVars.forEach(varName => {
    // Escape special regex characters in variable name
    const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\{${escapedVarName}\\}\\}`, 'g');

    // Handle nested paths (e.g., "new_ticket.customer_name")
    let value: unknown = variables;
    const parts = varName.split('.');

    for (const part of parts) {
      if (value === null || value === undefined) {
        value = undefined;
        break;
      }
      if (typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined && value !== null) {
      // Convert to string, handling objects
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      processedPrompt = processedPrompt.replace(regex, stringValue);
    } else {
      console.warn(`Variable "${varName}" not found in available variables. Available:`, Object.keys(variables));
      // Replace with empty string if variable not found
      processedPrompt = processedPrompt.replace(regex, '');
    }
  });

  return processedPrompt;
}

/**
 * Builds graph data structures for BFS traversal
 */
function buildGraphStructures(nodes: WorkflowNode[], connections: WorkflowConnection[]) {
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, WorkflowConnection[]>();
  const nodeMap = new Map<string, WorkflowNode>();

  // Initialize all nodes with in-degree 0 and empty adjacency list
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
    nodeMap.set(node.id, node);
  }

  // Build in-degree counts and adjacency lists (store full connection objects)
  for (const conn of connections) {
    inDegree.set(conn.toNodeId, (inDegree.get(conn.toNodeId) || 0) + 1);
    adjacencyList.get(conn.fromNodeId)?.push(conn);
  }

  return { inDegree, adjacencyList, nodeMap };
}

/**
 * Finds root nodes (nodes with no incoming connections)
 */
function findRootNodes(inDegree: Map<string, number>): string[] {
  const rootNodes: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      rootNodes.push(nodeId);
    }
  }
  return rootNodes;
}

/**
 * Validates that all referenced nodes in connections exist in the nodes array
 */
function validateNodesExist(nodes: WorkflowNode[], connections: WorkflowConnection[]) {
  const nodeIds = new Set(nodes.map(n => n.id));
  for (const conn of connections) {
    if (!nodeIds.has(conn.fromNodeId)) {
      throw new Error(`Invalid connection: fromNodeId ${conn.fromNodeId} does not exist`);
    }
    if (!nodeIds.has(conn.toNodeId)) {
      throw new Error(`Invalid connection: toNodeId ${conn.toNodeId} does not exist`);
    }
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
  // Build graph structures for BFS traversal
  const { inDegree, adjacencyList, nodeMap } = buildGraphStructures(nodes, connections);

  // Validate graph and find root nodes
  validateNodesExist(nodes, connections);
  const rootNodes = findRootNodes(inDegree);

  if (rootNodes.length === 0) {
    throw new Error('No entry nodes found (all nodes have incoming connections). Check for cycles.');
  }

  // Filter to specific entry node if provided
  let startNodes = rootNodes;
  if (entryNodeId) {
    if (!rootNodes.includes(entryNodeId)) {
      throw new Error(`Invalid entryNodeId: ${entryNodeId} is not a valid entry point`);
    }
    startNodes = [entryNodeId];
  } else if (rootNodes.length > 1) {
    // Multiple entries but none specified - error
    const rootNodeLabels = rootNodes
      .map(id => nodeMap.get(id))
      .filter(Boolean)
      .map(n => `${n!.label} (${n!.id})`)
      .join(', ');
    throw new Error(
      `Workflow has multiple entry points: ${rootNodeLabels}. Specify 'entryNodeId' to select one.`
    );
  }

  // Calculate executable nodes from start nodes
  // A node is executable only if ALL its incoming edges come from executable nodes
  // This handles cases where a node has dependencies from multiple entry paths
  const predecessors = new Map<string, Set<string>>();
  for (const node of nodes) {
    predecessors.set(node.id, new Set());
  }
  for (const conn of connections) {
    predecessors.get(conn.toNodeId)?.add(conn.fromNodeId);
  }

  const executableNodes = new Set<string>(startNodes);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (executableNodes.has(node.id)) continue;

      const preds = predecessors.get(node.id) || new Set();
      if (preds.size === 0) continue; // No predecessors and not a start node

      // Check if AT LEAST ONE predecessor is executable
      // This allows "merge" nodes to run when triggered from any entry path
      let anyPredExecutable = false;
      for (const pred of preds) {
        if (executableNodes.has(pred)) {
          anyPredExecutable = true;
          break;
        }
      }

      if (anyPredExecutable) {
        executableNodes.add(node.id);
        changed = true;
      }
    }
  }

  // Adjust in-degree to only count edges from executable predecessors
  // This ensures the BFS will properly trigger nodes that have some non-executable predecessors
  for (const node of nodes) {
    if (!executableNodes.has(node.id)) continue;
    const preds = predecessors.get(node.id) || new Set();
    let executablePredCount = 0;
    for (const pred of preds) {
      if (executableNodes.has(pred)) {
        executablePredCount++;
      }
    }
    inDegree.set(node.id, executablePredCount);
  }


  // Initialize BFS with filtered nodes
  const readyQueue = [...startNodes];
  const executed = new Set<string>();
  const queued = new Set<string>(startNodes); // Track all nodes that were queued for execution
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
  while (readyQueue.length > 0) {
    const currentNodeId = readyQueue.shift()!;
    const node = nodeMap.get(currentNodeId);

    if (!node) {
      throw new Error(`Node ${currentNodeId} not found in node map`);
    }

    // Cycle detection: if already executed, we have a cycle
    if (executed.has(currentNodeId)) {
      throw new Error(`Cycle detected: node ${currentNodeId} (${node.label}) is being executed multiple times`);
    }

    executed.add(currentNodeId);

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
    const allSuccessorConnections = adjacencyList.get(currentNodeId) || [];

    // Filter connections based on condition node output
    let successorConnections = allSuccessorConnections;
    if (node.type === 'condition') {
      const conditionOutput = outputData[node.id] as { path?: string };
      const selectedPath = conditionOutput?.path;

      if (selectedPath) {
        // Only follow connections matching the condition result
        successorConnections = allSuccessorConnections.filter(conn => {
          // Condition nodes MUST have explicit sourceHandle
          if (!conn.sourceHandle) {
            const errorMsg = `Condition node "${node.id}" has a connection without sourceHandle. All condition node connections must specify sourceHandle ('true' or 'false').`;
            nodeLogger.error(errorMsg);
            throw new Error(errorMsg);
          }
          return conn.sourceHandle === selectedPath;
        });

        nodeLogger.info(`Condition evaluated to ${selectedPath}, following ${successorConnections.length} of ${allSuccessorConnections.length} paths`);
      }
    }

    for (const conn of successorConnections) {
      const successorId = conn.toNodeId;
      const newDegree = (inDegree.get(successorId) || 0) - 1;
      inDegree.set(successorId, newDegree);

      // Add to queue if all dependencies met
      if (newDegree === 0) {
        readyQueue.push(successorId);
        queued.add(successorId); // Track that this node was queued for execution
      } else if (newDegree < 0) {
        throw new Error(`Invalid graph state: node ${successorId} has negative in-degree`);
      }
    }
  }

  // Verify all queued nodes were executed
  // Note: With condition nodes, not all executable nodes will be queued (branches not taken)
  // So we check against 'queued' (nodes that were added to queue) not 'executableNodes' (all reachable nodes)
  if (executed.size < queued.size) {
    const unexecuted = nodes
      .filter(n => queued.has(n.id) && !executed.has(n.id))
      .map(n => `${n.label} (${n.id})`)
      .join(', ');
    throw new Error(
      `Workflow incomplete: ${queued.size - executed.size} nodes not executed: ${unexecuted}. ` +
      `This indicates either a cycle or disconnected nodes in the execution path.`
    );
  }

  // Sort logs by timestamp
  allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return { outputData, logs: allLogs };
}
