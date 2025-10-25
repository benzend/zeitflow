import { NodeData } from './workflow-types';

/**
 * Snaps a value to the nearest grid point
 */
export const snapToGrid = (value: number, gridSize: number = 20): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Gets the width of a node based on its type
 */
export const getNodeWidth = (type: string): number => {
  if (type === 'endpoint') return 98;
  if (type === 'ai') return 89;
  if (type === 'scheduler') return 103;
  return 89; // review
};

/**
 * Gets the icon name for a node type
 */
export const getNodeIcon = (node: NodeData): string => {
  if (node.type === 'endpoint') {
    return 'Form';
  } else if (node.type === 'ai') {
    return 'AI';
  } else if (node.type === 'scheduler') {
    return 'Scheduler';
  } else {
    return 'Review';
  }
};

/**
 * Generates a unique node ID using crypto.randomUUID
 */
export const generateNodeId = (): string => {
  return crypto.randomUUID();
};

/**
 * Generates a unique field ID using crypto.randomUUID
 */
export const generateFieldId = (): string => {
  return crypto.randomUUID();
};