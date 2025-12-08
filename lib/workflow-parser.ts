import { NodeData, Connection } from './workflow-types';
import { generateNodeId } from './workflow-utils';
import * as yaml from 'js-yaml';

export interface ParsedWorkflow {
  name: string;
  description?: string;
  nodes: NodeData[];
  connections: Connection[];
}

export interface WorkflowParseResult {
  workflow: ParsedWorkflow | null;
  error?: string;
}

/**
 * Parses workflow syntax from text and converts to NodeData format
 */
export const parseWorkflowFromText = (text: string): WorkflowParseResult => {
  try {
    let workflowText = '';

    // First, try to find workflow syntax directly in the text
    const workflowMatch = text.match(/workflow:([\s\S]*?)(?=\n\n|$)/);
    if (workflowMatch) {
      workflowText = workflowMatch[1];
    } 

    if (!workflowText) {
      // If not found directly, look for workflow syntax inside code blocks
      const codeBlockMatch = text.match(/```(?:yaml|yml)?\s*\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        const codeBlockContent = codeBlockMatch[1];
        const blockWorkflowMatch = codeBlockContent.match(/workflow:([\s\S]*?)(?=\n\n|$)/);
        if (blockWorkflowMatch) {
          workflowText = blockWorkflowMatch[1];
        }
      }
    }

    if (!workflowText) {
      return { workflow: null };
    }

    // Parse the YAML structure using js-yaml
    const parsedYaml = yaml.load(workflowText) as Record<string, unknown>;

    if (!parsedYaml || typeof parsedYaml !== 'object') {
      return { workflow: null, error: 'Invalid workflow structure' };
    }

    const name = parsedYaml.name;
    const description = typeof parsedYaml.description === 'string' ? parsedYaml.description : undefined;
    const yamlNodes = parsedYaml.nodes || [];

    if (!name || typeof name !== 'string') {
      return { workflow: null, error: 'Workflow name is required and must be a string' };
    }

    if (!Array.isArray(yamlNodes) || yamlNodes.length === 0) {
      return { workflow: null, error: 'Workflow must have at least one node' };
    }

    // Convert YAML nodes to NodeData format
    const nodes: NodeData[] = [];
    for (const yamlNode of yamlNodes) {
      const node = convertYamlNodeToNodeData(yamlNode);
      if (node) {
        nodes.push(node);
      }
    }

    if (nodes.length === 0) {
      return { workflow: null, error: 'Failed to parse any valid nodes' };
    }

    // Generate connections based on node order (simple linear flow)
    const connections: Connection[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      connections.push({
        from: nodes[i].id,
        to: nodes[i + 1].id
      });
    }

    // Position nodes automatically
    positionNodes(nodes);

    return {
      workflow: {
        name,
        description,
        nodes,
        connections
      }
    };

  } catch (error) {
    return {
      workflow: null,
      error: `Failed to parse workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Converts a YAML node object to NodeData format
 */
function convertYamlNodeToNodeData(yamlNode: Record<string, unknown>): NodeData | null {
  if (!yamlNode || !yamlNode.type) {
    return null;
  }

  const type = yamlNode.type;
  if (typeof type !== 'string' || !['entry', 'form', 'ai', 'scheduler', 'review', 'slack'].includes(type)) {
    return null;
  }

  // Map 'form' to 'entry' for compatibility
  const nodeType = type === 'form' ? 'entry' : type as NodeData['type'];

  const node: NodeData = {
    id: generateNodeId(),
    type: nodeType,
    label: getDefaultLabel(type),
    x: 0, // Will be set by positionNodes
    y: 0
  };

  // Handle node-specific properties
  if (nodeType === 'entry' && yamlNode.fields && Array.isArray(yamlNode.fields)) {
    node.fields = yamlNode.fields.map((field: Record<string, unknown>) => ({
      id: `field-${String(field.name || '')}`,
      key: String(field.name || ''),
      name: String(field.name || ''),
      label: String(field.label || field.name || ''),
      type: String(field.type || 'text')
    }));
  } else if (nodeType === 'ai') {
    node.aiConfig = {
      model: typeof yamlNode.model === 'string' ? yamlNode.model : 'google/gemini-2.0-flash-001',
      systemPrompt: typeof yamlNode.systemPrompt === 'string' ? yamlNode.systemPrompt : '',
      userPrompt: typeof yamlNode.userPrompt === 'string' ? yamlNode.userPrompt : '{{ entry.fields.notes }}',
      outputType: typeof yamlNode.outputType === 'string' ? yamlNode.outputType : 'text',
      outputStructure: typeof yamlNode.outputStructure === 'string' ? yamlNode.outputStructure : ''
    };
  } else if (nodeType === 'slack' && yamlNode.channel) {
    node.label = `Slack: ${yamlNode.channel}`;
  }

  return node;
}

/**
 * Gets default label for node type
 */
function getDefaultLabel(type: string): string {
  switch (type) {
    case 'entry':
    case 'form':
      return 'Form Input';
    case 'ai':
      return 'AI Assistant';
    case 'scheduler':
      return 'Schedule Meeting';
    case 'review':
      return 'Review & Confirm';
    case 'slack':
      return 'Send to Slack';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

/**
 * Automatically positions nodes in a workflow layout
 */
function positionNodes(nodes: NodeData[]): void {
  const columnWidth = 250;
  const rowHeight = 120;
  const startX = 100;
  const startY = 100;

  // Group nodes by type for positioning
  const entryNodes = nodes.filter(n => n.type === 'entry');
  const aiNodes = nodes.filter(n => n.type === 'ai');
  const actionNodes = nodes.filter(n => !['entry', 'ai'].includes(n.type));

  const currentY = startY;

  // Position entry nodes on the left
  entryNodes.forEach((node, index) => {
    node.x = startX;
    node.y = currentY + (index * rowHeight);
  });

  // Position AI nodes in the middle
  aiNodes.forEach((node, index) => {
    node.x = startX + columnWidth;
    node.y = currentY + (index * rowHeight);
  });

  // Position action nodes on the right
  actionNodes.forEach((node, index) => {
    node.x = startX + (columnWidth * 2);
    node.y = currentY + (index * rowHeight);
  });
}
