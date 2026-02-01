import { NodeData, Connection } from './workflow-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sanitize node configuration to remove sensitive data before saving as template
 */
export function sanitizeNodeConfig(node: NodeData): NodeData {
  const sanitized: NodeData = { ...node };

  // Remove Slack bot credentials
  if (sanitized.slackConfig?.botId) {
    sanitized.slackConfig = {
      ...sanitized.slackConfig,
      botId: undefined,
      channel: '#general', // Default placeholder
    };
  }

  // Remove Telegram bot tokens
  if (sanitized.telegramConfig?.botToken) {
    sanitized.telegramConfig = {
      ...sanitized.telegramConfig,
      botToken: undefined,
      chatId: '', // Clear chat ID
    };
  }

  // Clear email recipients (keep structure for template)
  if (sanitized.emailConfig?.to && sanitized.emailConfig.to.length > 0) {
    sanitized.emailConfig = {
      ...sanitized.emailConfig,
      to: [], // Empty array - users will configure their own
    };
  }

  // Clear SMS recipients
  if (sanitized.smsConfig?.to && sanitized.smsConfig.to.length > 0) {
    sanitized.smsConfig = {
      ...sanitized.smsConfig,
      to: [], // Empty array
    };
  }

  // Clear scheduler people list
  if (sanitized.schedulerConfig?.people && sanitized.schedulerConfig.people.length > 0) {
    sanitized.schedulerConfig = {
      ...sanitized.schedulerConfig,
      people: [], // Empty array
    };
  }

  return sanitized;
}

/**
 * Sanitize all nodes in a workflow
 */
export function sanitizeNodes(nodes: NodeData[]): NodeData[] {
  return nodes.map(sanitizeNodeConfig);
}

/**
 * Generate a URL-friendly slug from a template name
 * Examples:
 *  "My Template" -> "my-template"
 *  "AI Content Moderator!" -> "ai-content-moderator"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if slug already exists
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Deep copy nodes and generate new UUIDs for template instantiation
 */
export function cloneNodesWithNewIds(nodes: NodeData[]): { nodes: NodeData[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();

  // Generate new IDs for all nodes
  nodes.forEach(node => {
    idMap.set(node.id, uuidv4());
  });

  // Clone nodes with new IDs
  const clonedNodes = nodes.map(node => ({
    ...node,
    id: idMap.get(node.id)!,
  }));

  return { nodes: clonedNodes, idMap };
}

/**
 * Update connection references to use new node IDs
 */
export function updateConnectionIds(connections: Connection[], idMap: Map<string, string>): Connection[] {
  return connections.map(conn => ({
    ...conn,
    from: idMap.get(conn.from) || conn.from,
    to: idMap.get(conn.to) || conn.to,
  }));
}

/**
 * Clone entire workflow (nodes + connections) with new IDs for instantiation
 */
export function cloneWorkflow(nodes: NodeData[], connections: Connection[]): {
  nodes: NodeData[];
  connections: Connection[];
} {
  const { nodes: clonedNodes, idMap } = cloneNodesWithNewIds(nodes);
  const clonedConnections = updateConnectionIds(connections, idMap);

  return {
    nodes: clonedNodes,
    connections: clonedConnections,
  };
}

/**
 * Validate template data before creation
 */
export interface TemplateValidationError {
  field: string;
  message: string;
}

export function validateTemplateData(data: {
  name?: string;
  category?: string;
  nodes?: NodeData[];
  connections?: Connection[];
}): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Template name is required' });
  }

  if (data.name && data.name.length > 100) {
    errors.push({ field: 'name', message: 'Template name must be 100 characters or less' });
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  if (!data.nodes || data.nodes.length === 0) {
    errors.push({ field: 'nodes', message: 'Template must have at least one node' });
  }

  return errors;
}

/**
 * Predefined template categories
 */
export const TEMPLATE_CATEGORIES = [
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'ai-automation', label: 'AI Automation', icon: '🤖' },
  { value: 'data-processing', label: 'Data Processing', icon: '📊' },
  { value: 'scheduling', label: 'Scheduling', icon: '📅' },
  { value: 'approval', label: 'Approval', icon: '✅' },
  { value: 'sales', label: 'Sales', icon: '💰' },
  { value: 'marketing', label: 'Marketing', icon: '📣' },
  { value: 'customer-support', label: 'Customer Support', icon: '🎧' },
  { value: 'general', label: 'General', icon: '⚙️' },
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]['value'];

/**
 * Get category display name and icon
 */
export function getCategoryInfo(categoryValue: string) {
  const category = TEMPLATE_CATEGORIES.find(c => c.value === categoryValue);
  return category || { value: 'general', label: 'General', icon: '⚙️' };
}
