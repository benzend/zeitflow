'use client';

import { useState, useCallback, useMemo, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
  OnConnectStart,
  OnConnectEnd
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { EmailIcon } from './icons/Email';
import { SlackIcon } from './icons/Slack';
import { SMSIcon } from './icons/SMS';
import { NodeData, Connection as WorkflowConnection, Field, EmailConfig, SlackConfig, SMSConfig, SchedulerConfig, AINodeConfig, ReviewConfig } from '@/lib/workflow-types';
import { Connection as ReactFlowConnection } from '@xyflow/react';
import { generateNodeId } from '@/lib/workflow-utils';
import { convertToReactFlow, convertFromReactFlow, ReactFlowNodeData } from '@/lib/reactflow-types';
import { AI_MODELS } from '@/lib/constants';
import { getDefaultConfig, NODE_CONFIGS, NodeType, NodeConfigKey } from '@/lib/node-registry';
import { serializeNode } from '@/lib/node-utils';
import TypeaheadTextarea from './TypeaheadTextarea';
import { ToastContainer, toast } from 'react-toastify';

import EntryNode from './reactflow-nodes/EntryNode';
import AINode from './reactflow-nodes/AINode';
import SchedulerNode from './reactflow-nodes/SchedulerNode';
import ReviewNode from './reactflow-nodes/ReviewNode';
import EmailNode from './reactflow-nodes/EmailNode';
import SlackNode from './reactflow-nodes/SlackNode';
import SMSNode from './reactflow-nodes/SMSNode';
import TelegramNode from './reactflow-nodes/TelegramNode';
import Dropdown, { DropdownOption } from './Dropdown';
import IntegrationConfigForm from './IntegrationConfigForm';
import { isIntegration, getIntegrationConfigKey } from '@/lib/integrations/registry';
import ExecuteWorkflowModal from './ExecuteWorkflowModal';

interface WorkflowBuilderProps {
  workflowId?: number;
  workflowName?: string;
  initialNodes?: NodeData[];
  initialConnections?: WorkflowConnection[];
  onSave?: (nodes: NodeData[], connections: WorkflowConnection[]) => void;
  onChange?: (nodes: NodeData[], connections: WorkflowConnection[]) => void;
}

export interface WorkflowBuilderRef {
  save: () => void;
  getCurrentState: () => { nodes: NodeData[], connections: WorkflowConnection[] };
}

const nodeTypes: NodeTypes = {
  entry: EntryNode,
  ai: AINode,
  scheduler: SchedulerNode,
  review: ReviewNode,
  email: EmailNode,
  slack: SlackNode,
  sms: SMSNode,
  telegram: TelegramNode,
};

// WebhookConfig component for webhook entry type
const WebhookConfig = ({ workflowId }: { workflowId?: number }) => {
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (workflowId) {
      fetchWebhookUrl();
    }
  }, [workflowId]);

  const fetchWebhookUrl = async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/workflow/${workflowId}`);
      const data = await response.json();
      if (data.success && data.workflow?.webhookSecret) {
        const host = window.location.origin;
        setWebhookUrl(`${host}/api/workflow/${workflowId}/execute?secret=${data.workflow.webhookSecret}`);
      } else if (data.success && !data.workflow?.webhookSecret) {
        // Workflow exists but has no secret - generate one
        await handleRegenerateSecret();
      }
    } catch (error) {
      console.error('Failed to fetch webhook URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (!workflowId) return;
    setRegenerating(true);
    try {
      const response = await fetch(`/api/workflow/${workflowId}/regenerate-secret`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        const host = window.location.origin;
        setWebhookUrl(`${host}/api/workflow/${workflowId}/execute?secret=${data.webhookSecret}`);
        toast.success('Webhook secret regenerated');
      } else {
        toast.error(data.message || 'Failed to regenerate secret');
      }
    } catch (error) {
      console.error('Failed to regenerate secret:', error);
      toast.error('Failed to regenerate secret');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook URL copied to clipboard');
    }
  };

  if (!workflowId) {
    return (
      <div className="mb-[12px]">
        <p className="text-warning text-sm">
          Save the workflow first to get a webhook URL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-[12px]">
        <h3 className="text-foreground text-lg font-bold mb-[4px]">
          Webhook Configuration
        </h3>
        <p className="text-text-muted text-sm leading-relaxed">
          External services can trigger this workflow by sending a POST request to the webhook URL.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-foreground-light text-[12px] font-medium">
          Webhook URL
        </label>
        {loading ? (
          <div className="bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] px-[12px] flex items-center">
            <span className="text-text-muted text-[12px]">Loading...</span>
          </div>
        ) : webhookUrl ? (
          <div className="flex gap-2">
            <div className="bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] px-[12px] flex-1 overflow-hidden flex items-center">
              <span className="text-foreground text-[11px] truncate font-mono">{webhookUrl}</span>
            </div>
            <Button
              onClick={handleCopyUrl}
              variant="tertiary"
              className="!bg-transparent border-border border-[0.5px] h-[32px] px-[12px] rounded-[8px]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </Button>
          </div>
        ) : (
          <div className="bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] px-[12px] flex items-center">
            <span className="text-text-muted text-[12px]">No webhook URL available</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-foreground-light text-[12px] font-medium">
          Request Format
        </label>
        <div className="bg-background-extra-light border-border border-[0.5px] rounded-[8px] p-[12px]">
          <pre className="text-foreground text-[11px] font-mono whitespace-pre-wrap">
{`POST ${webhookUrl || '{webhook_url}'}
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}`}
          </pre>
        </div>
      </div>

      <Button
        onClick={handleRegenerateSecret}
        disabled={regenerating || !webhookUrl}
        variant="tertiary"
        className="!bg-transparent border-border border-[0.5px] flex gap-3 h-[36px] hover:!bg-surface-hover items-center px-[16px] rounded-[8px] transition-colors w-full"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        <p className="text-[12px] text-foreground font-medium">
          {regenerating ? 'Regenerating...' : 'Regenerate Secret'}
        </p>
      </Button>

      <p className="text-text-muted text-[11px]">
        Regenerating the secret will invalidate the current webhook URL.
      </p>
    </div>
  );
};

const FIELD_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'tel', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'calendar slot', label: 'Calendar Slot' },
  { value: 'file', label: 'File Upload' },
];

const API_FIELD_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'string', label: 'String' },
  { value: 'json', label: 'JSON' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File' },
];

const ENTRY_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'api', label: 'API' },
  { value: 'form', label: 'Form' },
  { value: 'webhook', label: 'Webhook' },
];

const NODE_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'entry', label: 'Entry' },
  { value: 'ai', label: 'AI Model' },
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack' },
  // { value: 'sms', label: 'SMS' },
  { value: 'telegram', label: 'Telegram' },
];

// Wrapper component to provide React Flow context
const WorkflowBuilderInner = forwardRef<WorkflowBuilderRef, WorkflowBuilderProps>(({
  workflowId,
  workflowName,
  initialNodes = [],
  initialConnections = [],
  onSave,
  onChange
}, ref) => {
   // Convert initial data to React Flow format
   const initialFlowData = useMemo(() => {
     const flowData = convertToReactFlow(initialNodes, initialConnections);
     // Apply edge styling to existing edges
     flowData.edges = flowData.edges.map(edge => ({
       ...edge,
       type: 'smoothstep',
       markerEnd: { type: 'arrowclosed', color: '#a3e635' }
     }));
     return flowData;
   }, [initialNodes, initialConnections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowData.edges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [emailWarning, setEmailWarning] = useState('');
  const [rawEmailInput, setRawEmailInput] = useState('');
  const [rawSubjectInput, setRawSubjectInput] = useState('');
  const [rawMessageInput, setRawMessageInput] = useState('');
  const [rawSlackChannelInput, setRawSlackChannelInput] = useState('');
  const [rawSlackMessageInput, setRawSlackMessageInput] = useState('');
  const [smsWarning, setSmsWarning] = useState('');
  const [rawSMSRecipientsInput, setRawSMSRecipientsInput] = useState('');
  const [rawSMSMessageInput, setRawSMSMessageInput] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [slackBots, setSlackBots] = useState<{ id: number; name: string; teamName: string }[]>([]);
  const previousSelectedNode = useRef<string | null>(null);
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [executeEntryNodeId, setExecuteEntryNodeId] = useState<string | null>(null);

  // State for connection drag-to-add-node feature
  const connectStartNodeId = useRef<string | null>(null);
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const [connectionDropdownPosition, setConnectionDropdownPosition] = useState<{ x: number; y: number } | null>(null);
  const connectionDropdownJustOpened = useRef(false);

  const { screenToFlowPosition } = useReactFlow();

  // Handle run click from entry nodes
  const handleRunFromEntry = useCallback((nodeId: string) => {
    if (!workflowId) {
      toast.error('Save the workflow first to execute it');
      return;
    }
    setExecuteEntryNodeId(nodeId);
    setExecuteModalOpen(true);
  }, [workflowId]);

  // Get entry node data for the modal
  const getEntryNodeForModal = useCallback(() => {
    if (!executeEntryNodeId) return null;
    const node = nodes.find(n => n.id === executeEntryNodeId);
    if (!node || node.type !== 'entry') return null;
    return {
      id: node.data.id as string,
      label: node.data.label as string,
      entryType: node.data.entryType as string | undefined,
      fields: node.data.fields as Field[] | undefined,
    };
  }, [executeEntryNodeId, nodes]);

  // Transform nodes to inject the run callback into entry nodes
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map(node => {
      if (node.type === 'entry') {
        return {
          ...node,
          data: {
            ...node.data,
            onRunClick: handleRunFromEntry,
          },
        };
      }
      return node;
    });
  }, [nodes, handleRunFromEntry]);

  // Fetch Slack bots on component mount
  useEffect(() => {
    const fetchSlackBots = async () => {
      try {
        const response = await fetch('/api/slack/bots');
        const data = await response.json();
        if (data.success) {
          setSlackBots(data.bots);
        }
      } catch (error) {
        console.error('Failed to fetch Slack bots:', error);
      }
    };
    fetchSlackBots();
   }, []);

   // Sync raw input states ONLY when selected node ID changes (not when nodes array updates)
   useEffect(() => {
     // Only sync if the selected node ID has actually changed
     if (previousSelectedNode.current !== selectedNode) {
       previousSelectedNode.current = selectedNode;

        // Batch state updates to prevent cascading renders
        setTimeout(() => {
          if (selectedNode) {
            const selectedData = nodes.find(n => n.id === selectedNode)?.data;
            
            // Reset all states first
            setRawEmailInput('');
            setRawSubjectInput('');
            setRawMessageInput('');
            setRawSlackChannelInput('');
            setRawSlackMessageInput('');
            setRawSMSRecipientsInput('');
            setRawSMSMessageInput('');
            
            // Then set values based on config
            if (selectedData?.emailConfig) {
              const emailConfig = selectedData.emailConfig as EmailConfig;
              setRawEmailInput(emailConfig.to?.join(', ') || '');
              setRawSubjectInput(emailConfig.subject || '');
              setRawMessageInput(emailConfig.message || '');
            }
            if (selectedData?.slackConfig) {
              const slackConfig = selectedData.slackConfig as SlackConfig;
              setRawSlackChannelInput(slackConfig.channel || '');
              setRawSlackMessageInput(slackConfig.message || '');
            }
            if (selectedData?.smsConfig) {
              const smsConfig = selectedData.smsConfig as SMSConfig;
              setRawSMSRecipientsInput(smsConfig.to?.join(', ') || '');
              setRawSMSMessageInput(smsConfig.message || '');
            }
          } else {
            // Clear all raw inputs when no node is selected
            setRawEmailInput('');
            setRawSubjectInput('');
            setRawMessageInput('');
            setRawSlackChannelInput('');
            setRawSlackMessageInput('');
            setRawSMSRecipientsInput('');
            setRawSMSMessageInput('');
          }
        }, 0);
     }
   }, [selectedNode, nodes]);

   // Handle new connections
  const onConnect = useCallback(
    (params: ReactFlowConnection) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      markerEnd: { type: 'arrowclosed', color: '#a3e635' }
    }, eds)),
    [setEdges]
  );

  // Track when a connection drag starts
  const onConnectStart: OnConnectStart = useCallback((_event, { nodeId }) => {
    connectStartNodeId.current = nodeId ?? null;
  }, []);

  // Handle when a connection drag ends (possibly on empty space)
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectStartNodeId.current) return;

      // Check if the connection was NOT completed (dropped on empty space)
      if (!connectionState.toHandle) {
        const clientX = 'clientX' in event ? event.clientX : (event as TouchEvent).touches?.[0]?.clientX;
        const clientY = 'clientY' in event ? event.clientY : (event as TouchEvent).touches?.[0]?.clientY;

        if (clientX !== undefined && clientY !== undefined) {
          setConnectionDropdownPosition({ x: clientX, y: clientY });
          setShowConnectionDropdown(true);
          connectionDropdownJustOpened.current = true;
        }
      } else {
        connectStartNodeId.current = null;
      }
    },
    []
  );

  // Add node from connection drag and create edge
  const addNodeFromConnection = useCallback((type: NodeType) => {
    if (!connectionDropdownPosition || !connectStartNodeId.current) return;

    const flowPosition = screenToFlowPosition({
      x: connectionDropdownPosition.x,
      y: connectionDropdownPosition.y
    });

    // Get label for node type
    const labelMap: Record<NodeType, string> = {
      entry: 'Entry',
      ai: 'AI Model',
      scheduler: 'Scheduler',
      review: 'Review',
      email: 'Email',
      slack: 'Slack',
      sms: 'SMS',
      telegram: 'Telegram',
    };

    // Generate ONE ID for both React Flow node and node data
    const nodeId = generateNodeId();

    // Build node data using registry
    const nodeData: Record<string, unknown> = {
      id: nodeId,
      type,
      label: labelMap[type],
    };

    // Add entry-specific fields
    if (type === 'entry') {
      nodeData.fields = [];
      nodeData.entryType = 'api';
    }

    // Add config from registry
    const configKey = NODE_CONFIGS[type].configKey;
    const defaultConfig = getDefaultConfig(type);
    if (configKey && defaultConfig) {
      nodeData[configKey] = defaultConfig;
    }

    const newNode = {
      id: nodeId,
      type,
      position: flowPosition,
      data: nodeData as ReactFlowNodeData,
    };

    // Add the node
    setNodes((nds) => [...nds, newNode]);

    // Create edge from source node to new node
    const newEdge = {
      id: `${connectStartNodeId.current}-${nodeId}`,
      source: connectStartNodeId.current,
      target: nodeId,
      type: 'smoothstep',
      markerEnd: { type: 'arrowclosed' as const, color: '#a3e635' }
    };
    setEdges((eds) => [...eds, newEdge]);

    // Select the new node
    setSelectedNode(nodeId);

    // Clean up
    setShowConnectionDropdown(false);
    setConnectionDropdownPosition(null);
    connectStartNodeId.current = null;
  }, [connectionDropdownPosition, screenToFlowPosition, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: { id: string }) => {
    setSelectedNode(node.id);
    setEmailWarning('');
  }, []);

  const findEntryNode = () => {
    return nodes.find(n => n.type === 'entry');
  }

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    // Skip closing if the dropdown was just opened (from connection drag)
    if (connectionDropdownJustOpened.current) {
      connectionDropdownJustOpened.current = false;
      return;
    }

    setSelectedNode(null);
    setShowAddDropdown(false);
    setShowConnectionDropdown(false);
    setConnectionDropdownPosition(null);
    connectStartNodeId.current = null;
    setEmailWarning('');
    setSmsWarning('');
  }, []);

  // Add new node
  const addNode = useCallback((type: NodeType) => {
    const centerPosition = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    // Get label for node type
    const labelMap: Record<NodeType, string> = {
      entry: 'Entry',
      ai: 'AI Model',
      scheduler: 'Scheduler',
      review: 'Review',
      email: 'Email',
      slack: 'Slack',
      sms: 'SMS',
      telegram: 'Telegram',
    };

    // Generate ONE ID for both React Flow node and node data
    const nodeId = generateNodeId();

    // Build node data using registry
    const nodeData: Record<string, unknown> = {
      id: nodeId,
      type,
      label: labelMap[type],
    };

    // Add entry-specific fields
    if (type === 'entry') {
      nodeData.fields = [];
      nodeData.entryType = 'api';
    }

    // Add config from registry
    const configKey = NODE_CONFIGS[type].configKey;
    const defaultConfig = getDefaultConfig(type);
    if (configKey && defaultConfig) {
      nodeData[configKey] = defaultConfig;
    }

    const newNode = {
      id: nodeId,
      type,
      position: centerPosition,
      data: nodeData as ReactFlowNodeData,
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(nodeId);
  }, [setNodes, screenToFlowPosition]);

  // Remove selected node
  const removeSelectedNode = useCallback(() => {
    if (!selectedNode) return;

    if (!confirm('Are you sure you want to delete this node?')) {
      return;
    }
    
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== selectedNode && edge.target !== selectedNode
    ));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  // Shared function to serialize nodes (saves all configs, even partial ones)
  const serializeNodes = useCallback((workflowNodes: NodeData[]) => {
    // Use the utility function - automatically handles all node configs!
    return workflowNodes.map(node => serializeNode(node));
  }, []);

  // Save workflow
  const handleSave = useCallback(() => {
    if (onSave) {
      const { nodes: workflowNodes, connections: workflowConnections } =
        convertFromReactFlow(nodes, edges);

      // Validate connections before saving
      const nodeIds = new Set(workflowNodes.map(node => node.id));
      const validConnections = workflowConnections
        .filter(conn => {
          // Remove connections that reference non-existent nodes
          if (!nodeIds.has(conn.from) || !nodeIds.has(conn.to)) {
            console.warn(`Filtering out invalid connection: ${conn.from} -> ${conn.to}`);
            return false;
          }
          // Remove self-referencing connections
          if (conn.from === conn.to) {
            console.warn(`Filtering out self-referencing connection: ${conn.from} -> ${conn.to}`);
            return false;
          }
          return true;
        })
        // Remove duplicate connections
        .filter((conn, index, arr) =>
          arr.findIndex(c => c.from === conn.from && c.to === conn.to) === index
        );

      const serializableNodes = serializeNodes(workflowNodes);
      onSave(serializableNodes, validConnections);
    }
  }, [nodes, edges, onSave, serializeNodes]);

  // Get current workflow state
  const getCurrentState = useCallback(() => {
    const { nodes: workflowNodes, connections: workflowConnections } =
      convertFromReactFlow(nodes, edges);

    const serializableNodes = serializeNodes(workflowNodes);

    return {
      nodes: serializableNodes,
      connections: workflowConnections
    };
  }, [nodes, edges, serializeNodes]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      const currentState = getCurrentState();
      onChange(currentState.nodes, currentState.connections);
    }
  }, [nodes, edges, onChange, getCurrentState]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    save: handleSave,
    getCurrentState
  }));

  // Helper functions for updating node data
  const updateNodeData = useCallback((nodeId: string, updates: Partial<ReactFlowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [setNodes]);

  const addField = useCallback(() => {
    if (!selectedNode) return;
    const newField = {
      id: crypto.randomUUID(),
      key: 'New Field',
      name: 'new_field',
      type: 'text'
    };
    const currentNode = nodes.find(n => n.id === selectedNode);

    if (!currentNode) return console.warn('No current node found');

    const currentFields = (currentNode.data.fields as Field[] | undefined) || [];

    updateNodeData(selectedNode, { fields: [...currentFields, newField] });
  }, [selectedNode, nodes, updateNodeData]);

  const removeField = useCallback((fieldId: string) => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.fields) {
      const fields = currentNode.data.fields as Field[];
      updateNodeData(selectedNode, {
        fields: fields.filter(f => f.id !== fieldId)
      });
    }
  }, [selectedNode, nodes, updateNodeData]);

  const updateField = useCallback((fieldId: string, updates: { key?: string; type?: string }) => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.fields) {
      const fields = currentNode.data.fields as Field[];
      updateNodeData(selectedNode, {
        fields: fields.map(f =>
          f.id === fieldId ? { ...f, ...updates } : f
        )
      });
    }
  }, [selectedNode, nodes, updateNodeData]);

  const updateAIConfig = useCallback((updates: {
    model?: string;
    systemPrompt?: string;
    userPrompt?: string;
    outputType?: string;
    outputStructure?: string;
    hasTemplate?: boolean;
    templateText?: string
  }) => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.aiConfig) {
      updateNodeData(selectedNode, { 
        aiConfig: { ...currentNode.data.aiConfig, ...updates } 
      });
    }
  }, [selectedNode, nodes, updateNodeData]);

  const updateSchedulerConfig = useCallback((updates: { 
    people?: string[]; 
    minTimeRequirement?: string; 
    calendar?: string 
  }) => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.schedulerConfig) {
      updateNodeData(selectedNode, { 
        schedulerConfig: { ...currentNode.data.schedulerConfig, ...updates } 
      });
    }
  }, [selectedNode, nodes, updateNodeData]);
  const updateNodeConfig = useCallback((configType: NodeConfigKey, updates: object) => {
    if (!selectedNode) {
      return;
    }
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode) {
      // Always update the config, even if it doesn't exist yet
      const currentConfig = currentNode.data[configType] || {};
      const newConfig = { ...currentConfig, ...updates };
      updateNodeData(selectedNode, {
        [configType]: newConfig
      });
    }
  }, [selectedNode, nodes, updateNodeData]);

  // Improved email validation function
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }, []);

  // Process email recipients with validation
  const processEmailRecipients = useCallback((emailsString: string): string[] => {
    const allEmails = emailsString
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
    
    const validEmails = allEmails.filter(email => validateEmail(email));
    const invalidEmails = allEmails.filter(email => !validateEmail(email));
    
    if (invalidEmails.length > 0) {
      setEmailWarning(`Invalid email format: ${invalidEmails.join(', ')}`);
    } else {
      setEmailWarning('');
    }
    
    return validEmails;
  }, [validateEmail]);

  // Validate phone number (E.164 format)
  const validatePhoneNumber = useCallback((phone: string): boolean => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }, []);

  // Process SMS recipients with validation
  const processSMSRecipients = useCallback((phonesString: string): string[] => {
    const allPhones = phonesString
      .split(',')
      .map(phone => phone.trim())
      .filter(phone => phone);

    const validPhones = allPhones.filter(phone => validatePhoneNumber(phone));
    const invalidPhones = allPhones.filter(phone => !validatePhoneNumber(phone));

    if (invalidPhones.length > 0) {
      setSmsWarning(`Invalid phone format: ${invalidPhones.join(', ')}. Use E.164 format (e.g., +12345678900)`);
    } else {
      setSmsWarning('');
    }

    return validPhones;
  }, [validatePhoneNumber]);

  const addPerson = useCallback(() => {
    if (!selectedNode || !newPersonName.trim()) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.schedulerConfig) {
      const schedulerConfig = currentNode.data.schedulerConfig as SchedulerConfig;
      updateSchedulerConfig({
        people: [...schedulerConfig.people, newPersonName.trim()]
      });
    }
    setNewPersonName('');
  }, [selectedNode, newPersonName, nodes, updateSchedulerConfig]);

  const removePerson = useCallback((personName: string) => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.schedulerConfig) {
      const schedulerConfig = currentNode.data.schedulerConfig as SchedulerConfig;
      updateSchedulerConfig({
        people: schedulerConfig.people.filter(p => p !== personName)
      });
    }
  }, [selectedNode, nodes, updateSchedulerConfig]);



  // Get field suggestions from connected nodes that come before the current AI node
  const getFieldSuggestions = useCallback((nodeId: string): (string | { name: string, description: string })[] => {
    const suggestions: (string | { name: string, description: string })[] = [];
    
    // Find all incoming edges to this node
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    
    // For each incoming edge, get the source node and its fields
    incomingEdges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        const nodeData = sourceNode.data;
        
        // Add fields from entry nodes
        if (nodeData.type === 'entry' && nodeData.fields) {
          const fields = nodeData.fields as Field[];
          fields.forEach((field: Field) => {
            suggestions.push({
              name: field.key,
              description: `${nodeData.label} - ${field.type}`
            });
          });
        }
        
        // Add AI output fields (we can suggest the node label as a variable)
        if (nodeData.type === 'ai' && nodeData.aiConfig) {
          suggestions.push({
            name: nodeData.label.toLowerCase().replace(/\s+/g, '_'),
            description: `${nodeData.label} - AI Output`
          });
        }
        
        // Add scheduler output fields
        if (nodeData.type === 'scheduler' && nodeData.schedulerConfig) {
          suggestions.push({
            name: 'scheduled_time',
            description: `${nodeData.label} - Scheduled Time`
          });
          suggestions.push({
            name: 'calendar_link',
            description: `${nodeData.label} - Calendar Link`
          });
        }
      }
    });

    return suggestions;
  }, [nodes, edges]);

  const handleEntryNodeClick = () => {
    const entryNode = findEntryNode();
    if (entryNode) {
      setSelectedNode(entryNode.id);
      setNodes((nds) => nds.map((node) => {
        if (node.id === entryNode.id) {
          return { ...node, selected: true };
        } else {
          return { ...node, selected: false };
        }
      }));
    } else {
      toast.error('No entry node found. Please add one to the workflow.');
    }
  }

  const selectedNodeData = nodes.find(n => n.id === selectedNode)?.data;

  return (
    <div className="bg-background h-[calc(100vh-64px)] flex">
      {/* Left Sidebar - Node Palette */}
      <div className="w-16 bg-background-light border-r border-border flex flex-col gap-2 p-2 z-10">
        <div className="relative">
          <Button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            variant="tertiary"
            className="!bg-transparent h-10 w-full hover:!bg-surface-hover flex items-center justify-center rounded transition-colors"
          >
            <Plus className="text-foreground" size={20} />
          </Button>
          {showAddDropdown && (
            <div className="absolute left-full top-0 ml-2 bg-surface border border-border rounded shadow-lg z-100 min-w-[120px]">
              {NODE_TYPE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => {
                    addNode(option.value as NodeType);
                    setShowAddDropdown(false);
                  }}
                  variant="tertiary"
                  className="!bg-transparent w-full !p-2 text-foreground hover:!bg-surface-hover text-sm transition-colors text-left rounded-none"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <Button
          onClick={() => addNode('review')}
          variant="tertiary"
          className="!bg-transparent h-10 hover:!bg-surface-hover flex items-center justify-center rounded transition-colors"
        >
          <svg className="text-foreground" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="0.8" fill="none" />
          </svg>
        </Button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: 'transparent' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--border)"
          />
        </ReactFlow>

        {/* Connection drop-to-add-node dropdown */}
        {showConnectionDropdown && connectionDropdownPosition && (
          <div
            className="fixed bg-surface border border-border rounded shadow-lg z-50 min-w-[120px]"
            style={{
              left: connectionDropdownPosition.x,
              top: connectionDropdownPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b border-border">
              <p className="text-text-muted text-xs">Add node</p>
            </div>
            {NODE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  addNodeFromConnection(option.value as NodeType);
                }}
                className="bg-transparent w-full p-2 text-foreground hover:bg-surface-hover text-sm transition-colors text-left"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar - Properties Panel */}
      { selectedNodeData ? (
      <div className="w-80 bg-background-light border-l border-border">
        <div className="h-full overflow-clip relative w-80 overflow-y-auto">
          {/* Header */}
          <div className="border-border border-b-[0.5px] h-[49px] left-0 top-0 w-80 z-10">
            <div className="flex h-[49px] items-center justify-between overflow-clip px-[16px] relative w-80">
              <div className="flex gap-2 items-center">
                {selectedNodeData?.type === 'entry' ? (
                  <>
                    <div className="w-4 h-3">
                      <svg className="w-full h-full" fill="none" viewBox="0 0 15 13">
                        <circle cx="13" cy="2" r="1.75" stroke="var(--foreground)" strokeWidth="0.5" />
                        <circle cx="10" cy="10" r="1.75" stroke="var(--foreground)" strokeWidth="0.5" />
                        <circle cx="5" cy="3" r="1.75" stroke="var(--foreground)" strokeWidth="0.5" />
                        <circle cx="2" cy="11" r="1.75" stroke="var(--foreground)" strokeWidth="0.5" />
                        <line stroke="var(--foreground)" strokeWidth="0.5" x1="2.76788" x2="4.76788" y1="9.90715" y2="4.90715" />
                        <line stroke="var(--foreground)" strokeWidth="0.5" x1="10.7679" x2="12.7679" y1="8.90715" y2="3.90715" />
                        <line stroke="var(--foreground)" strokeWidth="0.5" x1="9.13017" x2="6.43759" y1="8.96121" y2="4.29752" />
                      </svg>
                    </div>
                     <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-foreground whitespace-pre">
                      Entry
                    </p>
                  </>
                ) : selectedNodeData?.type === 'ai' ? (
                  <>
                    <div className="relative">
                      <p className="font-['Inter:Regular',_sans-serif] font-normal h-[16px] leading-[normal] not-italic text-[15px] text-foreground w-[16.667px]">
                        AI
                      </p>
                      <div className="absolute h-0 left-[14px] top-[3.56px] w-[6.667px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 1">
                          <line stroke="var(--foreground)" strokeWidth="0.5" x2="6.66671" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                      <div className="absolute h-[7px] left-[17.67px] top-0 w-[7px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 1" style={{ transform: 'rotate(90deg)', transformOrigin: '0 0', position: 'relative', left: '0', top: '7px' }}>
                          <line stroke="var(--foreground)" strokeWidth="0.5" x2="7" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                      <div className="absolute h-0 left-[17.67px] top-0 w-[7px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 1" style={{ transform: 'rotate(90deg)', transformOrigin: '0 0', position: 'relative', left: '0', top: '7px' }}>
                          <line stroke="var(--foreground)" strokeWidth="0.5" x2="7" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                    </div>
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] ml-[15px] not-italic text-[20px] text-nowrap text-foreground whitespace-pre">
                      {selectedNodeData?.label}
                    </p>
                  </>
                ) : selectedNodeData?.type === 'scheduler' ? (
                  <>
                    <div className="h-[20px] relative w-[20px]">
                      <div className="absolute h-[5px] left-0 top-[7.5px] w-[20px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 7">
                          <line stroke="var(--foreground)" strokeWidth="0.5" x2="20.16" y1="5.79" y2="5.79" />
                          <line stroke="var(--foreground)" strokeWidth="0.5" x2="20.16" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                    </div>
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-foreground whitespace-pre">
                      {selectedNodeData?.label}
                    </p>
                  </>
                ) : selectedNodeData?.type === 'review' ? (
                  <>
                    <div className="relative size-[18px]">
                        <svg className="block size-full" fill="none" viewBox="0 0 18 19">
                          <circle cx="9" cy="10" r="8.75" stroke="var(--foreground)" strokeWidth="0.5" />
                          <line stroke="var(--foreground)" x1="5.49641" x2="9.35355" y1="8.36073" y2="12.2179" />
                          <line stroke="var(--foreground)" x1="8.60532" x2="17.6053" y1="12.2645" y2="0.69303" />
                        </svg>
                    </div>
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-foreground whitespace-pre">
                      Review
                    </p>
                  </>
                ) : selectedNodeData?.type === 'email' ? (
                  <>
                    <EmailIcon className="size-[18px]" />
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-foreground whitespace-pre">
                      Email
                    </p>
                  </>
                ) : selectedNodeData?.type === 'slack' ? (
                  <>
                    <SlackIcon className="size-[18px]" />
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-foreground whitespace-pre">
                      Slack
                    </p>
                  </>
                ) : selectedNodeData?.type === 'sms' ? (
                  <>
                    <SMSIcon className="size-[18px]" />
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-foreground whitespace-pre">
                      SMS
                    </p>
                  </>
                ) : null}
                {selectedNodeData?.type === 'entry' ? (
                  <>
                    <div className="bg-warning py-[3px] overflow-clip rounded-[10px] w-auto px-[7px]">
                      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-foreground text-nowrap whitespace-pre">
                        {ENTRY_TYPE_OPTIONS.find(opt => opt.value === selectedNodeData.entryType)?.label || 'Entry'}
                      </p>
                    </div>
                  </>
                ) : selectedNodeData?.type === 'ai' ? (
                  <div className="bg-success py-[3px] overflow-clip rounded-[10px] w-[49px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-foreground text-nowrap top-px whitespace-pre text-center">
                      Transformer
                    </p>
                  </div>
                ) : selectedNodeData?.type === 'scheduler' ? (
                  <div className="bg-info py-[3px] overflow-clip rounded-[10px] w-[36px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-foreground text-nowrap top-px whitespace-pre">
                      Planner
                    </p>
                  </div>
                ) : selectedNodeData?.type === 'review' ? (
                  <div className="bg-success py-[3px] overflow-clip rounded-[10px] w-[42px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-foreground text-nowrap top-px whitespace-pre text-center">
                      Validation
                    </p>
                  </div>
                ) : selectedNodeData?.type === 'email' ? (
                  <div className="bg-info py-[3px] overflow-clip rounded-[10px] w-[42px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-foreground text-nowrap top-px whitespace-pre text-center">
                      Communication
                    </p>
                  </div>
                ) : selectedNodeData?.type === 'slack' ? (
                  <div className="bg-info py-[3px] overflow-clip rounded-[10px] w-[42px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-foreground text-nowrap top-px whitespace-pre text-center">
                      Communication
                    </p>
                  </div>
                ) : selectedNodeData?.type === 'sms' ? (
                  <div className="bg-info py-[3px] overflow-clip rounded-[10px] w-[42px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-foreground text-nowrap top-px whitespace-pre text-center">
                      Communication
                    </p>
                  </div>
                ) : null}
              </div>
              <Button
                onClick={removeSelectedNode}
                variant="tertiary"
                className="!bg-error flex h-[23px] hover:!bg-error/50 items-center justify-center rounded-[10px] transition-colors w-14"
              >
                <Trash2 className="text-white" color="#ffffff" size={13} />
              </Button>
            </div>

          </div>

          {/* Content based on node type */}
          {selectedNodeData?.type === 'entry' ? (
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-foreground text-xl font-bold mb-[4px]">
                  Endpoint Configuration
                </h2>
                <p className="text-text-muted text-sm leading-relaxed">
                  Configure the entry type and input fields
                </p>
              </div>

              <div className="mb-[20px]">
                <label className="block text-foreground-light text-[14px] font-medium mb-[8px]">
                  Entry Type
                </label>
                 <Dropdown
                   value={selectedNodeData.entryType || 'api'}
                   onChange={(value) => updateNodeData(selectedNode!, { entryType: value })}
                   options={ENTRY_TYPE_OPTIONS}
                   className="h-[32px]"
                 />
              </div>

              {selectedNodeData.entryType === 'api' ? (
                <>
                <div className="mb-[12px]">
                  <h3 className="text-foreground text-lg font-bold mb-[4px]">
                    Set Expected API Input
                  </h3>
                </div>

                <div className="space-y-[16px]">
                  <div className="grid grid-cols-2 gap-4 pb-[8px] border-b border-border">
                    <p className="text-foreground-light text-[12px] font-medium">
                      Key
                    </p>
                    <p className="text-foreground-light text-[12px] font-medium">
                      Type
                    </p>
                  </div>

                  {((selectedNodeData.fields as Field[] | undefined) || []).map((field) => (
                    <div key={field.id} className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] overflow-hidden">
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateField(field.id, { key: e.target.value })}
                            placeholder="Field name"
                            className="bg-transparent h-full w-full px-[12px] text-[12px] text-foreground placeholder-text-placeholder outline-none"
                          />
                        </div>
                         <Dropdown
                          value={field.type}
                          onChange={(value) => updateField(field.id, { type: value })}
                          options={API_FIELD_TYPE_OPTIONS}
                          className="h-[32px]"
                        />
                      </div>
                      <Button
                        onClick={() => removeField(field.id)}
                        variant="tertiary"
                        className="!bg-transparent flex h-[8px] hover:opacity-70 items-center justify-end transition-opacity w-full !p-0"
                      >
                        <svg className="text-foreground-light" width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="0.5" />
                          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="0.5" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={addField}
                  variant="tertiary"
                  className="!bg-transparent border-border border-[0.5px] flex gap-3 h-[36px] hover:!bg-surface-hover items-center mt-[16px] px-[16px] rounded-[8px] transition-colors w-full"
                >
                  <div className="flex h-[12px] items-center justify-center w-[12px]">
                    <div className="bg-foreground-light h-[1px] w-[12px]" />
                    <div className="absolute bg-foreground-light h-[12px] w-[1px]" />
                  </div>
                  <p className="text-[12px] text-foreground font-medium">
                    Add Field
                  </p>
                </Button>
              </>

              ) : selectedNodeData.entryType === 'form' ? (
              <>
                <div className="mb-[12px]">
                  <h3 className="text-foreground text-lg font-bold mb-[4px]">
                    Fields
                  </h3>
                </div>

                <div className="space-y-[16px]">
                  <div className="grid grid-cols-2 gap-4 pb-[8px] border-b border-border">
                    <p className="text-foreground-light text-[12px] font-medium">
                      Field Name
                    </p>
                    <p className="text-foreground-light text-[12px] font-medium">
                      Input Type
                    </p>
                  </div>

                  {((selectedNodeData.fields as Field[] | undefined) || []).map((field) => (
                    <div key={field.id} className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] overflow-hidden">
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateField(field.id, { key: e.target.value })}
                            placeholder="Field name"
                            className="bg-transparent h-full w-full px-[12px] text-[12px] text-foreground placeholder-text-placeholder outline-none"
                          />
                        </div>
                         <Dropdown
                          value={field.type}
                          onChange={(value) => updateField(field.id, { type: value })}
                          options={FIELD_TYPE_OPTIONS}
                          className="h-[32px]"
                        />
                      </div>
                      <Button
                        onClick={() => removeField(field.id)}
                        variant="tertiary"
                        className="!bg-transparent flex h-[8px] hover:opacity-70 items-center justify-end transition-opacity w-full !p-0"
                      >
                        <svg className="text-foreground-light" width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="0.5" />
                          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="0.5" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={addField}
                  variant="tertiary"
                  className="!bg-transparent border-border border-[0.5px] flex gap-3 h-[36px] hover:!bg-surface-hover items-center mt-[16px] px-[16px] rounded-[8px] transition-colors w-full"
                >
                  <div className="flex h-[12px] items-center justify-center w-[12px]">
                    <div className="bg-foreground-light h-[1px] w-[12px]" />
                    <div className="absolute bg-foreground-light h-[12px] w-[1px]" />
                  </div>
                  <p className="text-[12px] text-foreground font-medium">
                    Add Field
                  </p>
                </Button>
              </>
              ) : selectedNodeData.entryType === 'webhook' ? (
              <>
                <WebhookConfig workflowId={workflowId} />
              </>
              ) : null}
            </div>
           ) : selectedNodeData?.type === 'ai' && selectedNodeData.aiConfig ? (
             <div className="mt-[20px] px-[20px] pb-[20px]">
               <div className="mb-[20px]">
                 <h2 className="text-foreground text-lg font-bold mb-[4px]">
                   AI Configuration
                 </h2>
                 <p className="text-text-muted text-sm leading-relaxed">
                   Configure prompts and output settings for this AI model
                 </p>
               </div>

               <div className="mb-[16px]">
                 <label className="block text-foreground-light font-medium mb-[8px]">
                   AI Model
                 </label>
                 <Dropdown
                   value={(selectedNodeData.aiConfig as AINodeConfig).model}
                   onChange={(value) => updateAIConfig({ model: value })}
                   options={AI_MODELS}
                   className="h-[32px]"
                 />
               </div>

               <div>
                 {getFieldSuggestions(selectedNode!).length === 0 && (
                   <div className="mb-[16px]">
                     <p className="block text-warning text-sm font-medium mb-[8px]">
                       Note: Please add fields to the{" "}
                       <button
                         className="font-bold cursor-pointer underline"
                         onClick={handleEntryNodeClick}>Entry node</button>
                       to inject variables into the prompt.
                     </p>
                   </div>
                 )}
               </div>

               <div className="mb-[16px]">
                 <label className="block text-foreground-light font-medium mb-[8px]">
                   System Prompt
                 </label>
               </div>

               <div className="bg-background-extra-light mt-[4px] rounded">
                <TypeaheadTextarea
                  value={(selectedNodeData.aiConfig as AINodeConfig).systemPrompt || ""}
                  onChange={(value) => updateAIConfig({ systemPrompt: value })}
                  suggestions={getFieldSuggestions(selectedNode!)}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal h-[119px] leading-[normal] not-italic outline-none p-4 resize-none text-sm text-foreground w-full"
                  placeholder="Enter system prompt... Type {{ for variables"
                  hintNoSuggestionsMessage={"No variables found"}
                />
              </div>

               <div className="mt-[20px]">
                 <label className="block text-foreground-light font-medium mb-[8px]">
                   User Prompt
                 </label>
               </div>

               <div>
                 <div className="bg-background-extra-light mt-[4px] rounded">
                   <TypeaheadTextarea
                     value={(selectedNodeData.aiConfig as AINodeConfig).userPrompt}
                     onChange={(value) => updateAIConfig({ userPrompt: value })}
                     suggestions={getFieldSuggestions(selectedNode!)}
                     className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal h-[119px] leading-[normal] not-italic outline-none p-4 resize-none text-sm text-foreground w-full"
                     placeholder="Enter user prompt... Type {{ for variables"
                      hintNoSuggestionsMessage={"No variables found"}
                   />
                 </div>
               </div>
            </div>
          ) : selectedNodeData?.type === 'scheduler' && selectedNodeData.schedulerConfig ? (
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-foreground text-[18px] font-bold mb-[4px]">
                  Scheduler Settings
                </h2>
                <p className="text-text-muted text-[12px] leading-relaxed">
                  Configure calendar and scheduling options
                </p>
              </div>

              <div className="mb-[12px]">
                <label className="block text-foreground-light text-[14px] font-medium mb-[8px]">
                  People Involved
                </label>
              </div>

              <div className="bg-background-extra-light border-border border-[0.5px] mt-[4px] min-h-[71px] overflow-clip p-[7px] rounded-[10px]">
                <div className="flex flex-wrap gap-[3px]">
                  {(selectedNodeData.schedulerConfig as SchedulerConfig).people.map((person, idx) => (
                    <div key={idx} className="bg-success flex h-[18px] items-center overflow-clip px-[9px] relative rounded-[10px]">
                      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[8px] text-foreground text-nowrap whitespace-pre">
                        {person}
                      </p>
                      <Button
                        onClick={() => removePerson(person)}
                        variant="tertiary"
                        className="!bg-transparent !p-0 absolute hover:opacity-70 right-[7px] top-[7px] transition-opacity"
                      >
                        <div className="flex h-[calc(1px*5.488)] items-center justify-center rotate-45 w-[calc(1px*5.488)]">
                          <div className="bg-foreground h-[0.5px] w-[5.488px]" />
                        </div>
                        <div className="absolute flex h-[calc(1px*5.345)] items-center justify-center left-0 rotate-[135deg] top-0 w-[calc(1px*5.345)]">
                          <div className="bg-foreground h-[0.5px] w-[5.345px]" />
                        </div>
                      </Button>
                    </div>
                  ))}
                  <div className="bg-transparent border-border border-[0.5px] flex gap-1 h-[16px] items-center overflow-clip px-[8px] rounded-[10px]">
                    <input
                      type="text"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPerson();
                        }
                      }}
                      placeholder="Add"
                      className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic outline-none text-[7px] text-foreground w-[30px]"
                    />
                    <Button onClick={addPerson} variant="tertiary" className="!bg-transparent !p-0 flex h-[5px] items-center justify-center w-[5px]">
                      <div className="bg-foreground-light h-px rotate-90 w-[5px]" />
                      <div className="absolute bg-foreground-light h-px w-[5px]" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-[16px] mb-[6px]">
                <label className="block text-foreground-light text-[14px] font-medium">
                  Minimum Time Required
                </label>
              </div>

              <div className="bg-background-extra-light border-border border-[0.5px] h-[26px] mt-[4px] overflow-clip rounded-[10px]">
                <input
                  type="text"
                  value={(selectedNodeData.schedulerConfig as SchedulerConfig).minTimeRequirement}
                  onChange={(e) => updateSchedulerConfig({ minTimeRequirement: e.target.value })}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal h-full leading-[normal] not-italic outline-none px-[11px] text-sm text-nowrap text-foreground w-full"
                />
              </div>

              <div className="mt-[16px] mb-[6px]">
                <label className="block text-foreground-light text-[14px] font-medium">
                  Target Calendar
                </label>
              </div>

              <div className="bg-background-extra-light border-border border-[0.5px] h-[26px] mt-[4px] overflow-clip rounded-[10px]">
                <input
                  type="text"
                  value={(selectedNodeData.schedulerConfig as SchedulerConfig).calendar}
                  onChange={(e) => updateSchedulerConfig({ calendar: e.target.value })}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal h-full leading-[normal] not-italic outline-none px-[11px] text-sm text-nowrap text-foreground w-full"
                />
              </div>
            </div>
          ) : selectedNodeData?.type === 'review' && selectedNodeData.reviewConfig ? (
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-foreground text-[18px] font-bold mb-[4px]">
                  Review Checklist
                </h2>
                <p className="text-text-muted text-[12px] leading-relaxed">
                  Mark validation steps for workflow nodes
                </p>
              </div>
              <div className="space-y-[8px]">
                {nodes.filter(n => n.data.type !== 'review').map((node) => {
                  const validationStep = (selectedNodeData.reviewConfig as ReviewConfig).validationSteps.find(s => s.nodeId === node.id);
                  const isValidated = validationStep?.validated || false;

                  return (
                    <div
                      key={node.id}
                      className={`${isValidated ? 'bg-surface-hover' : 'bg-surface'} cursor-pointer h-[37px] overflow-clip relative rounded-[10px] transition-colors hover:bg-surface-hover`}
                      onClick={() => {
                        const updatedSteps = (selectedNodeData.reviewConfig as ReviewConfig).validationSteps.map(step =>
                          step.nodeId === node.id ? { ...step, validated: !step.validated } : step
                        );
                        updateNodeData(selectedNode!, { 
                          reviewConfig: { ...(selectedNodeData.reviewConfig as ReviewConfig), validationSteps: updatedSteps } 
                        });
                      }}
                    >
                      <div className="flex h-full items-center px-[15px] relative">
                        <div className="flex items-center">
                          {node.data.type === 'entry' ? (
                            <div className="h-[18px] mr-[13px] w-[15px]">
                              <svg className="block size-full" fill="none" viewBox="0 0 15 18">
                               <line stroke={isValidated ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="0.5" x1="10.4614" x2="3.18514" y1="4.25" y2="4.25" />
                               <line stroke={isValidated ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="0.5" x1="12" x2="3" y1="8.0968" y2="8.0968" />
                               <line stroke={isValidated ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="0.5" x1="10.2764" x2="3.00008" y1="12.0968" y2="12.0968" />
                               <rect height="17.5" stroke={isValidated ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="0.5" width="14.5" x="0.25" y="0.25" />
                              </svg>
                            </div>
                          ) : node.data.type === 'ai' ? (
                            <div className="mr-[9px] relative size-[28px]">
                             <p className={`absolute font-['Inter:Regular',_sans-serif] font-normal h-[16px] leading-[normal] left-[9px] not-italic text-[15px] top-4 w-[16.667px]`} style={{ color: isValidated ? "var(--foreground)" : "var(--text-muted)" }}>
                               AI
                             </p>
                             <div className="absolute h-0 left-[23px] top-[13.56px] w-[6.667px]">
                               <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 1">
                                 <line stroke={isValidated ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="0.5" x2="6.66671" y1="0.75" y2="0.75" />
                               </svg>
                             </div>
                             <div className="absolute h-[7px] left-[26.67px] top-[10px] w-0">
                               <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 7" style={{ transform: 'rotate(-90deg)' }}>
                                 <line stroke={isValidated ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="0.5" x2="7" y1="0.75" y2="0.75" />
                               </svg>
                             </div>
                            </div>
                          ) : node.data.type === 'scheduler' ? (
                            <div className="mr-[9px] relative size-[28px]">
                             <div className="absolute h-[5.04px] left-[9px] top-[9px] w-[20.16px]">
                               <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 7">
                                 <line stroke={isValidated ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="0.5" x2="20.16" y1="5.79" y2="5.79" />
                                 <line stroke={isValidated ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="0.5" x2="20.16" y1="0.75" y2="0.75" />
                               </svg>
                             </div>
                            </div>
                          ) : null}
                          <p className={`font-['Inter:Bold',_sans-serif] font-bold leading-[normal] not-italic text-lg text-nowrap whitespace-pre`} style={{ color: isValidated ? "var(--foreground)" : "var(--text-muted)" }}>
                            {node.data.type === 'entry' ? 'Form' : node.data.label}
                          </p>
                        </div>
                        <div className="absolute right-[15px] rounded-[2px] size-[9px]">
                          <div className={`border ${isValidated ? 'border-foreground' : 'border-text-muted'} border-solid inset-0 rounded-[2px]`}>
                            {isValidated && (
                              <svg className="block size-full" fill="none" viewBox="0 0 7 6" style={{ transform: 'translate(1px, 2px) scale(0.8)' }}>
                                <line stroke="var(--foreground)" x1="0.299998" x2="2.96666" y1="3.6" y2="5.59997" />
                                <line stroke="var(--foreground)" x1="2.2719" x2="6.16078" y1="5.693" y2="0.693011" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

               <div className="mt-[20px] pt-[16px] border-t border-border">
                 <h3 className="text-foreground text-[14px] font-medium mb-[8px]">
                   Meeting Creation
                 </h3>
                <div
                  className={`cursor-pointer h-[37px] overflow-clip relative rounded-[10px] transition-colors hover:bg-surface-hover ${(selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed ? 'bg-surface-hover' : 'bg-surface'}`}
                  onClick={() => {
                    updateNodeData(selectedNode!, { 
                      reviewConfig: { 
                        ...(selectedNodeData.reviewConfig as ReviewConfig), 
                        meetingConfirmed: !(selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed 
                      } 
                    });
                  }}
                >
                  <div className="flex h-full items-center px-[15px] relative">
                    <div className="flex items-center">
                      <div className="mr-[13px] size-[18px]">
                        <svg className="block size-full" fill="none" viewBox="0 0 18 18">
                         <rect x="1" y="3" width="16" height="12" rx="2" stroke={(selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="1" />
                         <line x1="1" y1="7" x2="17" y2="7" stroke={(selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="1" />
                         <line x1="5" y1="11" x2="13" y2="11" stroke={(selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="1" />
                         <line x1="5" y1="13" x2="11" y2="13" stroke={(selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed ? "var(--foreground)" : "var(--text-muted)"} strokeWidth="1" />
                        </svg>
                      </div>
                      <p className={`font-['Inter:Bold',_sans-serif] font-bold leading-[normal] not-italic text-lg text-nowrap whitespace-pre`} style={{ color: (selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed ? "var(--foreground)" : "var(--text-muted)" }}>
                        Create Meeting
                      </p>
                    </div>
                    <div className="absolute right-[15px] rounded-[2px] size-[9px]">
                      <div className={`border ${(selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed ? 'border-foreground' : 'border-text-muted'} border-solid inset-0 rounded-[2px]`}>
                        {(selectedNodeData.reviewConfig as ReviewConfig).meetingConfirmed && (
                          <svg className="block size-full" fill="none" viewBox="0 0 7 6" style={{ transform: 'translate(1px, 2px) scale(0.8)' }}>
                            <line stroke="var(--foreground)" x1="0.299998" x2="2.96666" y1="3.6" y2="5.59997" />
                            <line stroke="var(--foreground)" x1="2.2719" x2="6.16078" y1="5.693" y2="0.693011" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isIntegration(selectedNodeData.type) ? (
            <IntegrationConfigForm
              integrationId={selectedNodeData.type}
              config={(() => {
                const configKey = getIntegrationConfigKey(selectedNodeData.type);
                return configKey ? (selectedNodeData[configKey] as Record<string, unknown>) || {} : {};
              })()}
              onChange={(newConfig) => {
                const configKey = getIntegrationConfigKey(selectedNodeData.type);
                if (configKey) {
                  updateNodeConfig(configKey as NodeConfigKey, newConfig);
                }
              }}
              variableSuggestions={getFieldSuggestions(selectedNode!)}
              serverData={{ slackBots }}
            />
          ) : !selectedNodeData && (
             <div className="mt-[20px] px-[20px] pb-[20px]">
               <p className="text-text-muted text-sm">Select a node to configure its properties</p>
             </div>
          )}
        </div>
      </div>
      ) : null}

      {/* Execute Workflow Modal */}
      {workflowId && executeModalOpen && getEntryNodeForModal() && (
        <ExecuteWorkflowModal
          isOpen={executeModalOpen}
          onClose={() => {
            setExecuteModalOpen(false);
            setExecuteEntryNodeId(null);
          }}
          workflowId={workflowId}
          workflowName={workflowName || 'Workflow'}
          entryNode={getEntryNodeForModal()!}
        />
      )}
    </div>
  );
});

WorkflowBuilderInner.displayName = 'WorkflowBuilderInner';

const WorkflowBuilderReactFlow = forwardRef<WorkflowBuilderRef, WorkflowBuilderProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} ref={ref} />
      <ToastContainer position="bottom-right" />
    </ReactFlowProvider>
  );
});

WorkflowBuilderReactFlow.displayName = 'WorkflowBuilderReactFlow';
export default WorkflowBuilderReactFlow;
