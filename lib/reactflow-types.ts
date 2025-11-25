import { Node, Edge } from '@xyflow/react';
import { NodeData, Connection, Field, AINodeConfig, SchedulerConfig, ReviewConfig } from './workflow-types';

// React Flow node data type (without x, y since those are handled by React Flow)
export interface ReactFlowNodeData extends Record<string, unknown> {
  id: string;
  type: 'entry' | 'ai' | 'scheduler' | 'review';
  label: string;
  fields?: Field[];
  entryType?: string;
  aiConfig?: AINodeConfig;
  schedulerConfig?: SchedulerConfig;
  reviewConfig?: ReviewConfig;
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
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type, // Will map to custom node types
      position: { x: node.x, y: node.y },
      data: {
        id: node.id,
        type: node.type,
        label: node.label,
        fields: node.fields,
        entryType: node.entryType,
        aiConfig: node.aiConfig,
        schedulerConfig: node.schedulerConfig,
        reviewConfig: node.reviewConfig
      }
    })),
    edges: connections.map(conn => ({
      id: `${conn.from}-${conn.to}`,
      source: conn.from,
      target: conn.to,
      type: 'smoothstep' // Curved connections like your current implementation
    }))
  };
};

// Helper to convert back from React Flow format
export const convertFromReactFlow = (
  nodes: WorkflowNode[], 
  edges: WorkflowEdge[]
): { nodes: NodeData[], connections: Connection[] } => {
  return {
    nodes: nodes.map(node => ({
      id: node.data.id,
      type: node.data.type,
      x: node.position.x,
      y: node.position.y,
      label: node.data.label,
      fields: node.data.fields,
      entryType: node.data.entryType,
      aiConfig: node.data.aiConfig,
      schedulerConfig: node.data.schedulerConfig,
      reviewConfig: node.data.reviewConfig
    })),
    connections: edges.map(edge => ({
      from: edge.source,
      to: edge.target
    }))
  };
};