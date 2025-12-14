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
      return { workflow: null, error: 'ERROR: Workflow name is required and must be a string. Example: name: My Workflow' };
    }

    if (!Array.isArray(yamlNodes) || yamlNodes.length === 0) {
      return { workflow: null, error: 'ERROR: Workflow must have at least one node. Example: nodes:\n  - type: entry\n    fields:\n      - name: notes\n        type: text' };
    }

    // Convert YAML nodes to NodeData format
    const nodes: NodeData[] = [];
    for (let i = 0; i < yamlNodes.length; i++) {
      try {
        const node = convertYamlNodeToNodeData(yamlNodes[i], yamlNodes);
        if (node) {
          nodes.push(node);
        }
      } catch (error) {
        return { 
          workflow: null, 
          error: `ERROR in node ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    }

    if (nodes.length === 0) {
      return { workflow: null, error: 'ERROR: Failed to parse any valid nodes. Check that each node has a valid type and required properties.' };
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
 * Validates a YAML node configuration
 */
function validateYamlNode(yamlNode: Record<string, unknown>, type: string): { isValid: boolean; error?: string } {
  switch (type) {
    case 'entry':
    case 'form':
      if (!yamlNode.fields || !Array.isArray(yamlNode.fields) || yamlNode.fields.length === 0) {
        return { isValid: false, error: 'Entry nodes require at least one field' };
      }
      // Validate each field has required properties
      for (let i = 0; i < yamlNode.fields.length; i++) {
        const field = yamlNode.fields[i] as Record<string, unknown>;
        if (!field.name || typeof field.name !== 'string') {
          return { isValid: false, error: `Entry field ${i + 1} requires a name property` };
        }
      }
      break;
    case 'ai':
      if (!yamlNode.systemPrompt || typeof yamlNode.systemPrompt !== 'string') {
        return { isValid: false, error: 'AI nodes require a systemPrompt' };
      }
      break;
    case 'scheduler':
      if (!yamlNode.people || !Array.isArray(yamlNode.people)) {
        return { isValid: false, error: 'Scheduler nodes require a people array' };
      }
      if (!yamlNode.minTimeRequirement || typeof yamlNode.minTimeRequirement !== 'string') {
        return { isValid: false, error: 'Scheduler nodes require minTimeRequirement' };
      }
      if (!yamlNode.calendar || typeof yamlNode.calendar !== 'string') {
        return { isValid: false, error: 'Scheduler nodes require calendar' };
      }
      break;
    case 'slack':
      if (!yamlNode.channel || typeof yamlNode.channel !== 'string') {
        return { isValid: false, error: 'Slack nodes require a channel' };
      }
      break;
    case 'review':
      // Review nodes don't require additional properties
      break;
  }
  return { isValid: true };
}

/**
 * Converts a YAML node object to NodeData format
 */
function convertYamlNodeToNodeData(yamlNode: Record<string, unknown>, allNodes: Record<string, unknown>[]): NodeData | null {
  if (!yamlNode || !yamlNode.type) {
    return null;
  }

  const type = yamlNode.type;
  const VALID_NODE_TYPES = ['entry', 'form', 'ai', 'scheduler', 'review', 'slack'];
  
  if (typeof type !== 'string' || !VALID_NODE_TYPES.includes(type)) {
    return null;
  }

  // Validate node configuration
  const validation = validateYamlNode(yamlNode, type);
  if (!validation.isValid) {
    throw new Error(validation.error);
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
    // Find entry node to get available fields for dynamic userPrompt
    let defaultUserPrompt = '{{ previousOutput }}'; // More reliable default
    
    const entryNode = allNodes.find(n => n.type === 'entry' || n.type === 'form');
    if (entryNode && entryNode.fields && Array.isArray(entryNode.fields) && entryNode.fields.length > 0) {
      const firstField = entryNode.fields[0] as Record<string, unknown>;
      if (firstField.name && typeof firstField.name === 'string') {
        defaultUserPrompt = `{{ entry.fields.${firstField.name} }}`;
      }
    }
    
    node.aiConfig = {
      model: typeof yamlNode.model === 'string' ? yamlNode.model : 'google/gemini-2.0-flash-001',
      systemPrompt: typeof yamlNode.systemPrompt === 'string' ? yamlNode.systemPrompt : '',
      userPrompt: typeof yamlNode.userPrompt === 'string' ? yamlNode.userPrompt : defaultUserPrompt,
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
