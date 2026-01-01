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
    type: node.type as 'entry' | 'ai' | 'scheduler' | 'review' | 'slack' | 'email',
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
  type: 'entry' | 'ai' | 'scheduler' | 'review' | 'slack' | 'email';
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
    }
  });
  
  return variables;
}

/**
 * Substitutes variables in a prompt string with their values
 */
function substituteVariables(prompt: string, variables: Record<string, unknown>): string {
  let processedPrompt = prompt;
  
  // Extract all variables from the prompt
  const extractedVars = extractVariables(prompt);
  
  // Replace each variable with its value
  extractedVars.forEach(varName => {
    const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
    const value = variables[varName];
    if (value !== undefined && value !== null) {
      processedPrompt = processedPrompt.replace(regex, String(value));
    } else {
      console.warn(`Variable ${varName} not found in available variables`);
      // Replace with empty string if variable not found
      processedPrompt = processedPrompt.replace(regex, '');
    }
  });
  
  return processedPrompt;
}

async function executeWorkflow(
  workflowId: number, 
  userId: string, 
  inputData: Record<string, unknown>, 
  connections: WorkflowConnection[], 
  nodes: WorkflowNode[]
) {
  let currentNodeId = connections.find(c => !connections.some(other => other.toNodeId === c.fromNodeId))?.fromNodeId;

  const outputData: Record<string, unknown> = {};

  while (currentNodeId) {
    const node = nodes.find(n => n.id === currentNodeId);
    if (!node) break;

    const config = JSON.parse(node.config || '{}');

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
        
        // Substitute variables in message
        const slackMessage = slackConfig.message 
          ? substituteVariables(slackConfig.message, slackVariables)
          : '';
        
        // Substitute variables in channel
        const slackChannel = slackConfig.channel 
          ? substituteVariables(slackConfig.channel, slackVariables)
          : '';
        
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
        
        // Substitute variables in message
        const emailMessage = emailConfig.message 
          ? substituteVariables(emailConfig.message, emailVariables)
          : '';
        
        // Substitute variables in recipients array
        const emailRecipients = emailConfig.to 
          ? emailConfig.to.map((recipient: string) => substituteVariables(recipient, emailVariables))
          : [];
        
        try {
          const emailResponse = await sendWorkflowEmail(
            { to: emailRecipients, message: emailMessage }
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
    }

    // Move to next node
    const nextConnection = connections.find(c => c.fromNodeId === currentNodeId);
    currentNodeId = nextConnection?.toNodeId;
  }

  return outputData;
}
