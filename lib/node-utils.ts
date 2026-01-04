/**
 * Node Utility Functions
 *
 * Generic helpers for working with workflow nodes.
 * These use the node registry to handle all node types automatically.
 */

import { NodeData } from './workflow-types';
import { ALL_CONFIG_KEYS, getConfigKey, hasConfig, NodeType } from './node-registry';

/**
 * Extract all config properties from a node
 * Returns an object with all config keys that exist on the node
 */
export function getAllNodeConfigs(node: NodeData): Record<string, unknown> {
  const configs: Record<string, unknown> = {};

  // Add fields for entry nodes
  if (node.fields) {
    configs.fields = node.fields;
  }

  // Add all config types
  ALL_CONFIG_KEYS.forEach(configKey => {
    if (node[configKey]) {
      configs[configKey] = node[configKey];
    }
  });

  return configs;
}

/**
 * Serialize a node for database storage
 * Returns a plain object with only the necessary properties
 */
export function serializeNode(node: NodeData) {
  return {
    id: node.id,
    type: node.type,
    x: node.x,
    y: node.y,
    label: node.label,
    entryType: node.entryType,
    ...getAllNodeConfigs(node),
  };
}

/**
 * Serialize all node configs to a JSON string for database
 */
export function serializeNodeConfigsToJSON(node: NodeData): string {
  return JSON.stringify(getAllNodeConfigs(node));
}

/**
 * Parse node configs from database JSON
 */
export function parseNodeConfigsFromJSON(configJson: string): Record<string, unknown> {
  try {
    return JSON.parse(configJson || '{}');
  } catch (error) {
    console.error('Failed to parse node config:', error, configJson);
    return {};
  }
}

/**
 * Deep equality check for any value (objects, arrays, primitives)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!bKeys.includes(key)) return false;
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Compare two nodes for equality
 * Uses the registry to automatically check all config types
 */
export function areNodesEqual(node1: NodeData, node2: NodeData): boolean {
  // Compare basic properties
  if (
    node1.id !== node2.id ||
    node1.type !== node2.type ||
    node1.x !== node2.x ||
    node1.y !== node2.y ||
    node1.label !== node2.label ||
    node1.entryType !== node2.entryType
  ) {
    return false;
  }

  // Compare fields (for entry nodes)
  if (!deepEqual(node1.fields, node2.fields)) {
    return false;
  }

  // Compare all config types automatically
  for (const configKey of ALL_CONFIG_KEYS) {
    if (!deepEqual(node1[configKey], node2[configKey])) {
      return false;
    }
  }

  return true;
}

/**
 * Get the config object for a specific node
 * Returns the appropriate config based on node type
 */
export function getNodeConfig(node: NodeData): unknown {
  if (node.type === 'entry') {
    return { fields: node.fields, entryType: node.entryType };
  }

  const configKey = getConfigKey(node.type);
  if (configKey && hasConfig(node.type)) {
    return node[configKey];
  }

  return null;
}

/**
 * Create a serializable copy of nodes (for API requests)
 */
export function createSerializableNodes(nodes: NodeData[]) {
  return nodes.map(node => serializeNode(node));
}
