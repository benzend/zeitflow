import { NodeData, Field } from './workflow-types';

/**
 * Defines the output fields available from each node type
 */

export interface OutputField {
  key: string;
  label: string;
  description: string;
  nodeId: string; // Keep track of the actual node ID for execution
}

/**
 * Convert a node label to a friendly variable name
 * e.g., "New Ticket" -> "new_ticket"
 */
function labelToVariableName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

export function getNodeOutputs(node: NodeData): OutputField[] {
  const outputs: OutputField[] = [];
  const varName = labelToVariableName(node.label);

  switch (node.type) {
    case 'entry':
      // Entry nodes output all their configured fields
      if (node.fields && Array.isArray(node.fields)) {
        node.fields.forEach((field: Field) => {
          outputs.push({
            key: `${varName}.${field.key}`,
            label: field.label || field.key,
            description: `${node.label} - ${field.type} field`,
            nodeId: node.id,
          });
        });
      }
      break;

    case 'ai':
      // AI nodes output the generated text
      outputs.push({
        key: `${varName}.output`,
        label: 'AI Output',
        description: `${node.label} - Generated text from AI`,
        nodeId: node.id,
      });
      break;

    case 'scheduler':
      // Scheduler nodes output event details
      outputs.push({
        key: `${varName}.eventId`,
        label: 'Event ID',
        description: `${node.label} - Calendar event ID`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.eventLink`,
        label: 'Event Link',
        description: `${node.label} - Link to calendar event`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.scheduledTime`,
        label: 'Scheduled Time',
        description: `${node.label} - When the event is scheduled`,
        nodeId: node.id,
      });
      break;

    case 'review':
      // Review nodes output validation status
      outputs.push({
        key: `${varName}.approved`,
        label: 'Approved',
        description: `${node.label} - Whether review was approved (true/false)`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.feedback`,
        label: 'Feedback',
        description: `${node.label} - Review feedback/comments`,
        nodeId: node.id,
      });
      break;

    case 'email':
      // Email nodes output delivery status
      outputs.push({
        key: `${varName}.messageId`,
        label: 'Message ID',
        description: `${node.label} - Email message ID`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.status`,
        label: 'Status',
        description: `${node.label} - Delivery status`,
        nodeId: node.id,
      });
      break;

    case 'slack':
      // Slack nodes output message info
      outputs.push({
        key: `${varName}.messageId`,
        label: 'Message ID',
        description: `${node.label} - Slack message ID`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.channel`,
        label: 'Channel',
        description: `${node.label} - Channel where message was sent`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.timestamp`,
        label: 'Timestamp',
        description: `${node.label} - Message timestamp`,
        nodeId: node.id,
      });
      break;

    case 'sms':
      // SMS nodes output message status
      outputs.push({
        key: `${varName}.messageId`,
        label: 'Message ID',
        description: `${node.label} - SMS message ID`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.status`,
        label: 'Status',
        description: `${node.label} - Delivery status`,
        nodeId: node.id,
      });
      break;

    case 'telegram':
      // Telegram nodes output message info
      outputs.push({
        key: `${varName}.messageId`,
        label: 'Message ID',
        description: `${node.label} - Telegram message ID`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.chatId`,
        label: 'Chat ID',
        description: `${node.label} - Chat where message was sent`,
        nodeId: node.id,
      });
      break;

    case 'condition':
      // Condition nodes output the evaluation result
      outputs.push({
        key: `${varName}.result`,
        label: 'Result',
        description: `${node.label} - Condition result (true/false)`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.leftValue`,
        label: 'Left Value',
        description: `${node.label} - Evaluated left side value`,
        nodeId: node.id,
      });
      outputs.push({
        key: `${varName}.rightValue`,
        label: 'Right Value',
        description: `${node.label} - Evaluated right side value`,
        nodeId: node.id,
      });
      break;
  }

  return outputs;
}

/**
 * Get all available variable suggestions for a node
 * Returns outputs from all nodes that come before this node in the workflow
 */
export function getAvailableVariables(
  currentNodeId: string,
  allNodes: NodeData[],
  connections: { from: string; to: string }[]
): OutputField[] {
  const suggestions: OutputField[] = [];

  // Build a set of nodes that are upstream (ancestors) of the current node
  const upstreamNodes = new Set<string>();
  const visited = new Set<string>();

  function findUpstream(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Find all connections where this node is the target
    connections
      .filter(conn => conn.to === nodeId)
      .forEach(conn => {
        upstreamNodes.add(conn.from);
        findUpstream(conn.from);
      });
  }

  findUpstream(currentNodeId);

  // Get outputs from all upstream nodes
  allNodes.forEach(node => {
    if (upstreamNodes.has(node.id)) {
      const nodeOutputs = getNodeOutputs(node);
      suggestions.push(...nodeOutputs);
    }
  });

  return suggestions;
}
