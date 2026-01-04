import { NodeData, Connection } from './workflow-types';
import { areNodesEqual } from './node-utils';

/**
 * Performs a deep comparison of two workflow states (nodes and connections)
 * Returns true if the states are identical, false if there are differences
 *
 * Now simplified to use the generic areNodesEqual function from node-utils
 * which automatically handles all config types via the node registry
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

  // Compare nodes using generic utility function
  const nodes2Map = new Map(nodes2.map(node => [node.id, node]));

  for (const node1 of nodes1) {
    const node2 = nodes2Map.get(node1.id);
    if (!node2) return false;

    // Use the generic comparison function from node-utils
    // This automatically handles all config types!
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