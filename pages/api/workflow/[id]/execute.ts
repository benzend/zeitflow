import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowsTable, workflowNodesTable, workflowConnectionsTable, workflowExecutionsTable, usersTable, slackBotsTable } from "@/schema";
import { eq } from "drizzle-orm";

import { chat } from "@/lib/openrouter";
import { extractVariables } from "@/lib/variables-client";
import { sendWorkflowEmail } from "@/lib/email";
import { sendSlackMessage } from "@/lib/slack";
import { sendWorkflowSMS } from "@/lib/sms";

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
    type: node.type as 'entry' | 'ai' | 'scheduler' | 'review' | 'slack' | 'email' | 'sms',
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

  if (nodes[0].type === 'entry' && nodes[0].entryType === 'api') {
    // Check for API token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'API token required' });
    }

    const apiToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.apiToken, apiToken))
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
    }));

    // Create execution record
    const [execution] = await db.insert(workflowExecutionsTable).values({
      workflowId,
      userId: userId.toString(),
      status: 'running',
      inputData: JSON.stringify(req.body.inputData || {}),
    }).returning();

    const outputData = await executeWorkflow(workflowId, userId, req.body.inputData || {}, connections, nodes);

    // Update execution status
    await db.update(workflowExecutionsTable)
      .set({
        status: 'completed',
        completedAt: new Date(),
        outputData: JSON.stringify(outputData),
      })
      .where(eq(workflowExecutionsTable.id, execution.id));

    res.status(200).json({ success: true, executionId: execution.id, outputData });
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
}

interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

interface WorkflowNode {
  id: string;
  type: 'entry' | 'ai' | 'scheduler' | 'review' | 'slack' | 'email' | 'sms';
  label: string;
  entryType?: string;
  config?: string;
}

/**
 * Collects available variables from connected nodes that come before current node
 */
function collectAvailableVariables(
  nodeId: string, 
  connections: WorkflowConnection[], 
  nodes: WorkflowNode[], 
  inputData: Record<string, unknown>,
  nodeOutputs: Record<string, unknown>
): Record<string, unknown> {
  const variables: Record<string, unknown> = {};
  
  // Find all incoming connections to this node
  const incomingEdges = connections.filter(edge => edge.toNodeId === nodeId);
  
  // For each incoming edge, get the source node and its variables
  incomingEdges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.fromNodeId);
    if (sourceNode) {
      const config = JSON.parse(sourceNode.config || '{}');
      
      // Add variables from entry nodes
      if (sourceNode.type === 'entry') {
        if (sourceNode.entryType === 'api' || sourceNode.entryType === 'form') {
          // Add input data fields
          if (inputData && typeof inputData === 'object') {
            Object.keys(inputData).forEach(key => {
              variables[key] = inputData[key];
            });
          }
          
          // Add fields from entry node configuration
          if (config.fields && Array.isArray(config.fields)) {
            config.fields.forEach((field: { key: string }) => {
              if (inputData && inputData[field.key]) {
                variables[field.key] = inputData[field.key];
              }
            });
          }
        }
      }
      
      // Add AI output variables
      if (sourceNode.type === 'ai' && nodeOutputs[sourceNode.id]) {
        const nodeOutput = nodeOutputs[sourceNode.id] as { response?: string };
        const nodeLabel = sourceNode.label || sourceNode.id;
        const variableName = nodeLabel.toLowerCase().replace(/\s+/g, '_');
        variables[variableName] = nodeOutput.response;
      }
      
      // Add scheduler output variables
      if (sourceNode.type === 'scheduler' && nodeOutputs[sourceNode.id]) {
        const schedulerOutput = nodeOutputs[sourceNode.id] as { scheduledTime?: string; calendarLink?: string };
        variables['scheduled_time'] = schedulerOutput.scheduledTime || '';
        variables['calendar_link'] = schedulerOutput.calendarLink || '';
      }

      // Add email output variables
      if (sourceNode.type === 'email' && nodeOutputs[sourceNode.id]) {
        const emailOutput = nodeOutputs[sourceNode.id] as { success?: boolean; error?: string };
        const nodeLabel = sourceNode.label || sourceNode.id;
        const variableName = nodeLabel.toLowerCase().replace(/\s+/g, '_');
        variables[`${variableName}_status`] = emailOutput.success ? 'sent' : 'failed';
        if (emailOutput.error) {
          variables[`${variableName}_error`] = emailOutput.error;
        }
      }

      // Add slack output variables
      if (sourceNode.type === 'slack' && nodeOutputs[sourceNode.id]) {
        const slackOutput = nodeOutputs[sourceNode.id] as { success?: boolean; error?: string };
        const nodeLabel = sourceNode.label || sourceNode.id;
        const variableName = nodeLabel.toLowerCase().replace(/\s+/g, '_');
        variables[`${variableName}_status`] = slackOutput.success ? 'sent' : 'failed';
        if (slackOutput.error) {
          variables[`${variableName}_error`] = slackOutput.error;
        }
      }

      // Add SMS output variables
      if (sourceNode.type === 'sms' && nodeOutputs[sourceNode.id]) {
        const smsOutput = nodeOutputs[sourceNode.id] as { success?: boolean; error?: string };
        const nodeLabel = sourceNode.label || sourceNode.id;
        const variableName = nodeLabel.toLowerCase().replace(/\s+/g, '_');
        variables[`${variableName}_status`] = smsOutput.success ? 'sent' : 'failed';
        if (smsOutput.error) {
          variables[`${variableName}_error`] = smsOutput.error;
        }
      }
    }
  });

  return variables;
}

/**
 * Substitutes variables in a prompt string with their values
 * Supports variable names with spaces, dots, underscores, etc.
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
    const value = variables[varName];
    if (value !== undefined && value !== null) {
      processedPrompt = processedPrompt.replace(regex, String(value));
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
  const adjacencyList = new Map<string, string[]>();
  const nodeMap = new Map<string, WorkflowNode>();

  // Initialize all nodes with in-degree 0 and empty adjacency list
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
    nodeMap.set(node.id, node);
  }

  // Build in-degree counts and adjacency lists
  for (const conn of connections) {
    inDegree.set(conn.toNodeId, (inDegree.get(conn.toNodeId) || 0) + 1);
    adjacencyList.get(conn.fromNodeId)?.push(conn.toNodeId);
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

async function executeWorkflow(
  workflowId: number,
  userId: string,
  inputData: Record<string, unknown>,
  connections: WorkflowConnection[],
  nodes: WorkflowNode[]
) {
  // Build graph structures for BFS traversal
  const { inDegree, adjacencyList, nodeMap } = buildGraphStructures(nodes, connections);

  // Validate graph and find root nodes
  validateNodesExist(nodes, connections);
  const rootNodes = findRootNodes(inDegree);

  if (rootNodes.length === 0) {
    throw new Error('No entry nodes found (all nodes have incoming connections). Check for cycles.');
  }

  // Initialize BFS
  const readyQueue = [...rootNodes];
  const executed = new Set<string>();
  const outputData: Record<string, unknown> = {};

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

    // Parse config
    const config = JSON.parse(node.config || '{}');

    // Execute node based on type
    switch (node.type) {
      case 'entry':
        switch (node.entryType) {
          case 'api':
          case 'form':
            // Store the raw input data for variable substitution
            outputData['userInput'] = inputData;
            // Also store individual fields for easier access
            if (inputData && typeof inputData === 'object') {
              Object.assign(outputData, inputData);
            }
            break;
           default:
             break;
         }
         break;
      case 'ai':
        const aiConfig = config.aiConfig || {};

        // Collect available variables from connected nodes
        const availableVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);

        // Substitute variables in system prompt
        const systemPrompt = aiConfig.systemPrompt
          ? substituteVariables(aiConfig.systemPrompt, availableVariables)
          : '';

        // Substitute variables in user prompt
        const userPrompt = aiConfig.userPrompt
          ? substituteVariables(aiConfig.userPrompt, availableVariables)
          : '';

        console.log(`AI Node ${node.id} - Available variables:`, Object.keys(availableVariables));
        console.log(`AI Node ${node.id} - Original system prompt:`, aiConfig.systemPrompt);
        console.log(`AI Node ${node.id} - Processed system prompt:`, systemPrompt);
        console.log(`AI Node ${node.id} - Original user prompt:`, aiConfig.userPrompt);
        console.log(`AI Node ${node.id} - Processed user prompt:`, userPrompt);

        const aiResponse = await chat(userPrompt, aiConfig.model, { systemPrompt });

        if ('error' in aiResponse && aiResponse.error) {
          outputData[node.id] = { error: aiResponse.error };
          console.error('AI call error:', aiResponse.error);
          break;
        }
        outputData[node.id] = { response: aiResponse.text };
        console.log('AI call response:', aiResponse.text);
        break;
      case 'scheduler':
        // TODO: Implement scheduler call
        break;
      case 'review':
        // TODO: Implement review call
        break;
      case 'slack':
        const slackConfig = config.slackConfig || {};

        // Collect available variables from connected nodes
        const slackVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);

        console.log(`Slack Node ${node.id} - Available variables:`, Object.keys(slackVariables));
        console.log(`Slack Node ${node.id} - Original message:`, slackConfig.message);
        console.log(`Slack Node ${node.id} - Original channel:`, slackConfig.channel);

        // Substitute variables in message
        const slackMessage = slackConfig.message
          ? substituteVariables(slackConfig.message, slackVariables)
          : '';

        // Substitute variables in channel
        const slackChannel = slackConfig.channel
          ? substituteVariables(slackConfig.channel, slackVariables)
          : '';

        console.log(`Slack Node ${node.id} - Processed message:`, slackMessage);
        console.log(`Slack Node ${node.id} - Processed channel:`, slackChannel);

        try {
          // Use specific bot from config if provided, otherwise find any bot for this user
          let botToUse;

          if (slackConfig.botId) {
            const [specificBot] = await db
              .select()
              .from(slackBotsTable)
              .where(eq(slackBotsTable.id, slackConfig.botId))
              .limit(1);

            if (!specificBot || specificBot.userId !== userId) {
              outputData[node.id] = { error: 'Specified Slack bot not found or unauthorized' };
              break;
            }
            botToUse = specificBot;
          } else {
            // Find any bot for this user
            const [userBot] = await db
              .select()
              .from(slackBotsTable)
              .where(eq(slackBotsTable.userId, userId))
              .limit(1);

            if (!userBot) {
              outputData[node.id] = { error: 'No Slack bot configured for this user' };
              break;
            }
            botToUse = userBot;
          }

          const slackResponse = await sendSlackMessage(
            { botId: botToUse.id, channel: slackChannel, message: slackMessage }
          );

          if (!slackResponse.success) {
            outputData[node.id] = { error: slackResponse.error };
            console.error('Slack call error:', slackResponse.error);
            break;
          }
          outputData[node.id] = { success: true };
        } catch (error) {
          outputData[node.id] = { error: 'Failed to send Slack message' };
          console.error('Slack call error:', error);
        }
        break;
      case 'email':
        const emailConfig = config.emailConfig || {};

        // Collect available variables from connected nodes
        const emailVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);

        console.log(`Email Node ${node.id} - Available variables:`, Object.keys(emailVariables));
        console.log(`Email Node ${node.id} - Original message:`, emailConfig.message);
        console.log(`Email Node ${node.id} - Original subject:`, emailConfig.subject);

        // Substitute variables in message
        const emailMessage = emailConfig.message
          ? substituteVariables(emailConfig.message, emailVariables)
          : '';

        // Substitute variables in subject
        const emailSubject = emailConfig.subject
          ? substituteVariables(emailConfig.subject, emailVariables)
          : undefined;

        // Substitute variables in from
        const emailFrom = emailConfig.from
          ? substituteVariables(emailConfig.from, emailVariables)
          : undefined;

        // Substitute variables in recipients array
        const emailRecipients = emailConfig.to
          ? emailConfig.to.map((recipient: string) => substituteVariables(recipient, emailVariables))
          : [];

        console.log(`Email Node ${node.id} - Processed message:`, emailMessage);
        console.log(`Email Node ${node.id} - Processed subject:`, emailSubject);
        console.log(`Email Node ${node.id} - Recipients:`, emailRecipients);

        try {
          const emailResponse = await sendWorkflowEmail(
            {
              to: emailRecipients,
              subject: emailSubject,
              message: emailMessage,
              from: emailFrom
            }
          );

          if (!emailResponse.success) {
            outputData[node.id] = { error: emailResponse.error };
            console.error('Email call error:', emailResponse.error);
            break;
          }
          outputData[node.id] = { success: true };
        } catch (error) {
          outputData[node.id] = { error: 'Failed to send email' };
          console.error('Email call error:', error);
        }
        break;
      case 'sms':
        const smsConfig = config.smsConfig || {};

        // Collect available variables from connected nodes
        const smsVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);

        console.log(`SMS Node ${node.id} - Available variables:`, Object.keys(smsVariables));
        console.log(`SMS Node ${node.id} - Original message:`, smsConfig.message);

        // Substitute variables in message
        const smsMessage = smsConfig.message
          ? substituteVariables(smsConfig.message, smsVariables)
          : '';

        // Substitute variables in recipients array
        const smsRecipients = smsConfig.to
          ? smsConfig.to.map((recipient: string) => substituteVariables(recipient, smsVariables))
          : [];

        console.log(`SMS Node ${node.id} - Processed message:`, smsMessage);
        console.log(`SMS Node ${node.id} - Recipients:`, smsRecipients);

        try {
          const smsResponse = await sendWorkflowSMS(
            {
              to: smsRecipients,
              message: smsMessage
            }
          );

          if (!smsResponse.success) {
            outputData[node.id] = { error: smsResponse.error };
            console.error('SMS call error:', smsResponse.error);
            break;
          }
          outputData[node.id] = { success: true };
        } catch (error) {
          outputData[node.id] = { error: 'Failed to send SMS' };
          console.error('SMS call error:', error);
        }
        break;
    }

    // Update successors and add ready ones to queue
    const successors = adjacencyList.get(currentNodeId) || [];
    for (const successorId of successors) {
      const newDegree = (inDegree.get(successorId) || 0) - 1;
      inDegree.set(successorId, newDegree);

      // Add to queue if all dependencies met
      if (newDegree === 0) {
        readyQueue.push(successorId);
      } else if (newDegree < 0) {
        throw new Error(`Invalid graph state: node ${successorId} has negative in-degree`);
      }
    }
  }

  // Verify all nodes executed
  if (executed.size < nodes.length) {
    const unexecuted = nodes
      .filter(n => !executed.has(n.id))
      .map(n => `${n.label} (${n.id})`)
      .join(', ');
    throw new Error(
      `Workflow incomplete: ${nodes.length - executed.size} nodes not executed: ${unexecuted}. ` +
      `This indicates either a cycle or disconnected nodes.`
    );
  }

  return outputData;
}
