import { Node, Edge } from '@xyflow/react';
import { NodeData, Connection } from './workflow-types';
import { NodeType, ALL_CONFIG_KEYS } from './node-registry';

// React Flow node data type (without x, y since those are handled by React Flow)
// Now generic to support any config type from the registry
export interface ReactFlowNodeData extends Record<string, unknown> {
  id: string;
  type: NodeType;
  label: string;
  fields?: unknown[];
  entryType?: string;
  // Config properties are added dynamically based on node registry
}

// React Flow compatible node type
export type WorkflowNode = Node<ReactFlowNodeData>;

// React Flow compatible edge type  
export type WorkflowEdge = Edge;

// Helper to convert your current data to React Flow format
export const convertToReactFlow = (
  nodes: NodeData[],
  connections: Connection[]
): { nodes: WorkflowNode[], edges: WorkflowEdge[] } => {
  return {
    nodes: nodes.map(node => {
      // Build data object with base properties
      const data: ReactFlowNodeData = {
        id: node.id,
        type: node.type,
        label: node.label,
        entryType: node.entryType,
      };

      // Add fields for entry nodes
      if (node.fields) {
        data.fields = node.fields;
      }

      // Dynamically add all config types from registry
      ALL_CONFIG_KEYS.forEach(configKey => {
        if (node[configKey]) {
          data[configKey] = node[configKey];
        }
      });

      return {
        id: node.id,
        type: node.type,
        position: { x: node.x, y: node.y },
        data
      };
    }),
    edges: connections.map((conn, index) => ({
      id: `${conn.from}-${conn.to}-${index}`,
      source: conn.from,
      target: conn.to,
      type: 'smoothstep'
    }))
  };
};

// Helper to convert back from React Flow format
export const convertFromReactFlow = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { nodes: NodeData[], connections: Connection[] } => {
  return {
    nodes: nodes.map(node => {
      // Build node data with base properties
      const nodeData: Record<string, unknown> = {
        id: node.data.id,
        type: node.data.type,
        x: node.position.x,
        y: node.position.y,
        label: node.data.label,
        entryType: node.data.entryType,
      };

      // Add fields for entry nodes
      if (node.data.fields) {
        nodeData.fields = node.data.fields;
      }

      // Dynamically add all config types from registry
      ALL_CONFIG_KEYS.forEach(configKey => {
        if (node.data[configKey]) {
          nodeData[configKey] = node.data[configKey];
        }
      });

      return nodeData as unknown as NodeData;
    }),
    connections: edges.map(edge => ({
      from: edge.source,
      to: edge.target
    }))
  };
};