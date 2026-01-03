import { NodeData, Connection, Field } from './workflow-types';

/**
 * Performs a deep comparison of two workflow states (nodes and connections)
 * Returns true if the states are identical, false if there are differences
 */
export function areWorkflowStatesEqual(
  nodes1: NodeData[],
  connections1: Connection[],
  nodes2: NodeData[],
  connections2: Connection[]
): boolean {
  // Quick length check first
  if (nodes1.length !== nodes2.length || connections1.length !== connections2.length) {
    return false;
  }

  // Compare nodes
  const nodes2Map = new Map(nodes2.map(node => [node.id, node]));
  
  for (const node1 of nodes1) {
    const node2 = nodes2Map.get(node1.id);
    if (!node2) return false;
    
    if (!areNodesEqual(node1, node2)) {
      return false;
    }
  }

  // Compare connections
  const connections2Set = new Set(
    connections2.map(conn => `${conn.from}-${conn.to}`)
  );
  
  for (const conn1 of connections1) {
    const connKey = `${conn1.from}-${conn1.to}`;
    if (!connections2Set.has(connKey)) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two nodes for deep equality
 */
function areNodesEqual(node1: NodeData, node2: NodeData): boolean {
  // Basic properties
  if (node1.id !== node2.id ||
      node1.type !== node2.type ||
      node1.x !== node2.x ||
      node1.y !== node2.y ||
      node1.label !== node2.label ||
      node1.entryType !== node2.entryType) {
    return false;
  }

  // Compare fields arrays
  if (!areArraysEqual(node1.fields, node2.fields, areFieldsEqual)) {
    return false;
  }

  // Compare AI configs
  if (!areObjectsEqual(node1.aiConfig, node2.aiConfig, areAIConfigsEqual)) {
    return false;
  }

  // Compare scheduler configs
  if (!areObjectsEqual(node1.schedulerConfig, node2.schedulerConfig, areSchedulerConfigsEqual)) {
    return false;
  }

  // Compare review configs
  if (!areObjectsEqual(node1.reviewConfig, node2.reviewConfig, areReviewConfigsEqual)) {
    return false;
  }

  // Compare email configs
  if (!areObjectsEqual(node1.emailConfig, node2.emailConfig, areEmailConfigsEqual)) {
    return false;
  }

  // Compare slack configs
  if (!areObjectsEqual(node1.slackConfig, node2.slackConfig, areSlackConfigsEqual)) {
    return false;
  }

  return true;
}

/**
 * Compares two field objects
 */
function areFieldsEqual(field1: Field, field2: Field): boolean {
  return field1.id === field2.id &&
         field1.key === field2.key &&
         field1.name === field2.name &&
         field1.type === field2.type &&
         field1.label === field2.label;
}

/**
 * Compares two AI config objects
 */
function areAIConfigsEqual(config1: NodeData['aiConfig'], config2: NodeData['aiConfig']): boolean {
  if (!config1 && !config2) return true;
  if (!config1 || !config2) return false;
  
  return config1.model === config2.model &&
         config1.systemPrompt === config2.systemPrompt &&
         config1.userPrompt === config2.userPrompt &&
         config1.outputType === config2.outputType &&
         config1.outputStructure === config2.outputStructure &&
         config1.hasTemplate === config2.hasTemplate &&
         config1.templateText === config2.templateText;
}

/**
 * Compares two scheduler config objects
 */
function areSchedulerConfigsEqual(config1: NodeData['schedulerConfig'], config2: NodeData['schedulerConfig']): boolean {
  if (!config1 && !config2) return true;
  if (!config1 || !config2) return false;
  
  return JSON.stringify(config1.people) === JSON.stringify(config2.people) &&
         config1.minTimeRequirement === config2.minTimeRequirement &&
         config1.calendar === config2.calendar;
}

/**
 * Compares two review config objects
 */
function areReviewConfigsEqual(config1: NodeData['reviewConfig'], config2: NodeData['reviewConfig']): boolean {
  if (!config1 && !config2) return true;
  if (!config1 || !config2) return false;

  return JSON.stringify(config1.validationSteps) === JSON.stringify(config2.validationSteps) &&
         config1.meetingConfirmed === config2.meetingConfirmed;
}

/**
 * Compares two email config objects
 */
function areEmailConfigsEqual(config1: NodeData['emailConfig'], config2: NodeData['emailConfig']): boolean {
  if (!config1 && !config2) return true;
  if (!config1 || !config2) return false;

  return JSON.stringify(config1.to) === JSON.stringify(config2.to) &&
         config1.subject === config2.subject &&
         config1.message === config2.message;
}

/**
 * Compares two slack config objects
 */
function areSlackConfigsEqual(config1: NodeData['slackConfig'], config2: NodeData['slackConfig']): boolean {
  if (!config1 && !config2) return true;
  if (!config1 || !config2) return false;

  return config1.botId === config2.botId &&
         config1.channel === config2.channel &&
         config1.message === config2.message;
}

/**
 * Generic array comparison with custom comparator
 */
function areArraysEqual<T>(
  arr1: T[] | undefined,
  arr2: T[] | undefined,
  comparator: (a: T, b: T) => boolean
): boolean {
  if (!arr1 && !arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (!comparator(arr1[i], arr2[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Generic object comparison with custom comparator
 */
function areObjectsEqual<T>(
  obj1: T | undefined,
  obj2: T | undefined,
  comparator: (a: T, b: T) => boolean
): boolean {
  if (!obj1 && !obj2) return true;
  if (!obj1 || !obj2) return false;
  return comparator(obj1, obj2);
}