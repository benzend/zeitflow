import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
  Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { NodeData, Connection as WorkflowConnection } from '@/lib/workflow-types';
import { generateNodeId } from '@/lib/workflow-utils';
import { convertToReactFlow, convertFromReactFlow, ReactFlowNodeData } from '@/lib/reactflow-types';

import EntryNode from './reactflow-nodes/EntryNode';
import AINode from './reactflow-nodes/AINode';
import SchedulerNode from './reactflow-nodes/SchedulerNode';
import ReviewNode from './reactflow-nodes/ReviewNode';
import Dropdown, { DropdownOption } from './Dropdown';

interface WorkflowBuilderProps {
  initialNodes?: NodeData[];
  initialConnections?: WorkflowConnection[];
  onSave?: (nodes: NodeData[], connections: WorkflowConnection[]) => void;
}

const nodeTypes: NodeTypes = {
  entry: EntryNode,
  ai: AINode,
  scheduler: SchedulerNode,
  review: ReviewNode,
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

const ENTRY_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'endpoint', label: 'Endpoint' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'api', label: 'API' },
  { value: 'form', label: 'Form' },
  { value: 'trigger', label: 'Trigger' },
];

const NODE_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'entry', label: 'Entry' },
  { value: 'ai', label: 'AI Model' },
  { value: 'scheduler', label: 'Scheduler' },
];

export default function WorkflowBuilderReactFlow({
  initialNodes = [],
  initialConnections = [],
  onSave
}: WorkflowBuilderProps) {
  // Convert initial data to React Flow format
  const initialFlowData = useMemo(() => 
    convertToReactFlow(initialNodes, initialConnections),
    [initialNodes, initialConnections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowData.edges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: { id: string }) => {
    setSelectedNode(node.id);
  }, []);

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowAddDropdown(false);
  }, []);

  // Add new node
  const addNode = useCallback((type: 'entry' | 'ai' | 'scheduler' | 'review') => {
    const newNode = {
      id: generateNodeId(),
      type,
      position: { 
        x: Math.random() * 400 + 100, // Random position with some margin
        y: Math.random() * 300 + 100 
      },
      data: {
        id: generateNodeId(),
        type,
        label: type === 'entry' ? 'Entry' : type === 'ai' ? 'AI Model' : type === 'scheduler' ? 'Scheduler' : 'Review',
        ...(type === 'entry' ? { fields: [], entryType: 'endpoint' } :
          type === 'ai' ? {
            aiConfig: {
              systemPrompt: '',
              userPrompt: '',
              outputType: 'JSON',
              outputStructure: '',
              hasTemplate: false,
              templateText: ''
            }
          } : type === 'scheduler' ? {
            schedulerConfig: {
              people: [],
              minTimeRequirement: '',
              calendar: ''
            }
          } : {
            reviewConfig: {
              validationSteps: [],
              meetingConfirmed: false
            }
          })
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode.id);
  }, [setNodes]);

  // Remove selected node
  const removeSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== selectedNode && edge.target !== selectedNode
    ));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

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

      onSave(workflowNodes, validConnections);
    }
  }, [nodes, edges, onSave]);

  // Helper functions for updating node data
  const updateNodeData = useCallback((nodeId: string, updates: Partial<ReactFlowNodeData>) => {
    setNodes((nds) => nds.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));
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
    if (currentNode?.data.fields) {
      updateNodeData(selectedNode, { fields: [...currentNode.data.fields, newField] });
    }
  }, [selectedNode, nodes, updateNodeData]);

  const removeField = useCallback((fieldId: string) => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.fields) {
      updateNodeData(selectedNode, { 
        fields: currentNode.data.fields.filter(f => f.id !== fieldId) 
      });
    }
  }, [selectedNode, nodes, updateNodeData]);

  const updateField = useCallback((fieldId: string, updates: { key?: string; type?: string }) => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.fields) {
      updateNodeData(selectedNode, { 
        fields: currentNode.data.fields.map(f => 
          f.id === fieldId ? { ...f, ...updates } : f
        ) 
      });
    }
  }, [selectedNode, nodes, updateNodeData]);

  const updateAIConfig = useCallback((updates: { 
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

  const addPerson = useCallback(() => {
    if (!selectedNode || !newPersonName.trim()) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.schedulerConfig) {
      updateSchedulerConfig({
        people: [...currentNode.data.schedulerConfig.people, newPersonName.trim()]
      });
    }
    setNewPersonName('');
  }, [selectedNode, newPersonName, nodes, updateSchedulerConfig]);

  const removePerson = useCallback((personName: string) => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.schedulerConfig) {
      updateSchedulerConfig({
        people: currentNode.data.schedulerConfig.people.filter(p => p !== personName)
      });
    }
  }, [selectedNode, nodes, updateSchedulerConfig]);

  const toggleTemplate = useCallback(() => {
    if (!selectedNode) return;
    const currentNode = nodes.find(n => n.id === selectedNode);
    if (currentNode?.data.aiConfig) {
      updateAIConfig({
        hasTemplate: !currentNode.data.aiConfig.hasTemplate,
        templateText: currentNode.data.aiConfig.hasTemplate
          ? currentNode.data.aiConfig.templateText
          : (currentNode.data.aiConfig.templateText || '[meeting title] | Takeaways\n\nHere\'s what we heard:\n[list of items that were said]\n\nNext steps:\n[list of actionables]\n\n[some nice-ities about the meeting]')
      });
    }
  }, [selectedNode, nodes, updateAIConfig]);

  const selectedNodeData = nodes.find(n => n.id === selectedNode)?.data;

  return (
    <div className="bg-gradient-to-b from-[#2b2b2b] to-[#3c3c3c] h-[calc(100vh-64px)] flex">
      {/* Left Sidebar - Node Palette */}
      <div className="w-16 bg-[#424242] border-r border-[#535353] flex flex-col gap-2 p-2 z-10">
        <div className="relative">
          <Button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            variant="tertiary"
            className="!bg-transparent h-10 w-full hover:!bg-[#535353] flex items-center justify-center rounded transition-colors"
          >
            <Plus className="text-white" size={20} />
          </Button>
          {showAddDropdown && (
            <div className="absolute left-full top-0 ml-2 bg-[#424242] border border-[#535353] rounded shadow-lg z-100 min-w-[120px]">
              {NODE_TYPE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => {
                    addNode(option.value as 'entry' | 'ai' | 'scheduler');
                    setShowAddDropdown(false);
                  }}
                  variant="tertiary"
                  className="!bg-transparent w-full !p-2 text-white hover:!bg-[#535353] text-sm transition-colors first:rounded-t last:rounded-b text-left"
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
          className="!bg-transparent h-10 hover:!bg-[#535353] flex items-center justify-center rounded transition-colors"
        >
          <svg className="text-white" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="0.8" fill="none" />
          </svg>
        </Button>
        {onSave && (
          <Button
            onClick={handleSave}
            variant="primary"
            size="sm"
            className="text-xs"
          >
            Save
          </Button>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: 'transparent' }}
        >
          <Controls
            className="bg-[#424242] border border-[#535353]"
            showInteractive={false}
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            color="#535353"
          />
        </ReactFlow>
      </div>

      {/* Right Sidebar - Properties Panel */}
      { selectedNodeData ? (
      <div className="w-80 bg-[#424242] border-l border-[#535353] overflow-y-auto">
        <div className="h-full overflow-clip relative w-80">
          {/* Header */}
          <div className="border-[#535353] border-b-[0.5px] h-[49px] left-0 top-0 w-80 z-10">
            <div className="flex h-[49px] items-center justify-between overflow-clip px-[16px] relative w-80">
              <div className="flex gap-2 items-center">
                {selectedNodeData?.type === 'entry' ? (
                  <>
                    <div className="w-4 h-3">
                      <svg className="w-full h-full" fill="none" viewBox="0 0 15 13">
                        <circle cx="13" cy="2" r="1.75" stroke="white" strokeWidth="0.5" />
                        <circle cx="10" cy="10" r="1.75" stroke="white" strokeWidth="0.5" />
                        <circle cx="5" cy="3" r="1.75" stroke="white" strokeWidth="0.5" />
                        <circle cx="2" cy="11" r="1.75" stroke="white" strokeWidth="0.5" />
                        <line stroke="white" strokeWidth="0.5" x1="2.76788" x2="4.76788" y1="9.90715" y2="4.90715" />
                        <line stroke="white" strokeWidth="0.5" x1="10.7679" x2="12.7679" y1="8.90715" y2="3.90715" />
                        <line stroke="white" strokeWidth="0.5" x1="9.13017" x2="6.43759" y1="8.96121" y2="4.29752" />
                      </svg>
                    </div>
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-white whitespace-pre">
                      Entry
                    </p>
                  </>
                ) : selectedNodeData?.type === 'ai' ? (
                  <>
                    <div className="relative">
                      <p className="font-['Inter:Regular',_sans-serif] font-normal h-[16px] leading-[normal] not-italic text-[15px] text-white w-[16.667px]">
                        AI
                      </p>
                      <div className="absolute h-0 left-[14px] top-[3.56px] w-[6.667px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 1">
                          <line stroke="white" strokeWidth="0.5" x2="6.66671" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                      <div className="absolute h-0 left-[17.67px] top-0 w-[7px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 1" style={{ transform: 'rotate(90deg)', transformOrigin: '0 0', position: 'relative', left: '0', top: '7px' }}>
                          <line stroke="white" strokeWidth="0.5" x2="7" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                    </div>
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] ml-[15px] not-italic text-[20px] text-nowrap text-white whitespace-pre">
                      {selectedNodeData?.label}
                    </p>
                  </>
                ) : selectedNodeData?.type === 'scheduler' ? (
                  <>
                    <div className="h-[20px] relative w-[20px]">
                      <div className="absolute h-[5px] left-0 top-[7.5px] w-[20px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 7">
                          <line stroke="white" strokeWidth="0.5" x2="20.16" y1="5.79" y2="5.79" />
                          <line stroke="white" strokeWidth="0.5" x2="20.16" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                    </div>
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-white whitespace-pre">
                      {selectedNodeData?.label}
                    </p>
                  </>
                ) : selectedNodeData?.type === 'review' ? (
                  <>
                    <div className="relative size-[18px]">
                      <svg className="block size-full" fill="none" viewBox="0 0 18 19">
                        <circle cx="9" cy="10" r="8.75" stroke="white" strokeWidth="0.5" />
                        <line stroke="white" x1="5.49641" x2="9.35355" y1="8.36073" y2="12.2179" />
                        <line stroke="white" x1="8.60532" x2="17.6053" y1="12.2645" y2="0.69303" />
                      </svg>
                    </div>
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-white whitespace-pre">
                      Review
                    </p>
                  </>
                ) : null}
                {selectedNodeData?.type === 'entry' ? (
                  <>
                    <div className="bg-[#ffdcb8] py-[3px] overflow-clip rounded-[10px] w-auto px-[7px]">
                      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-black text-nowrap whitespace-pre">
                        {ENTRY_TYPE_OPTIONS.find(opt => opt.value === selectedNodeData.entryType)?.label || 'Entry'}
                      </p>
                    </div>
                  </>
                ) : selectedNodeData?.type === 'ai' ? (
                  <div className="bg-[#f2ffb8] py-[3px] overflow-clip rounded-[10px] w-[49px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-black text-nowrap top-px whitespace-pre">
                      Transformer
                    </p>
                  </div>
                ) : selectedNodeData?.type === 'scheduler' ? (
                  <div className="bg-[#b8ebff] py-[3px] overflow-clip rounded-[10px] w-[36px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-black text-nowrap top-px whitespace-pre">
                      Planner
                    </p>
                  </div>
                ) : selectedNodeData?.type === 'review' ? (
                  <div className="bg-[#c3ffb8] py-[3px] overflow-clip rounded-[10px] w-[42px]">
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[6px] text-black text-nowrap top-px whitespace-pre">
                      Validation
                    </p>
                  </div>
                ) : null}
              </div>
              <Button
                onClick={removeSelectedNode}
                variant="tertiary"
                className="!bg-[#424242] flex h-[23px] hover:!bg-[#535353] items-center justify-center rounded-[10px] transition-colors w-[29px]"
              >
                <Trash2 className="text-red-500" size={13} />
              </Button>
            </div>

          </div>

          {/* Content based on node type */}
          {selectedNodeData?.type === 'entry' ? (
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-white text-[18px] font-bold mb-[4px]">
                  Endpoint Configuration
                </h2>
                <p className="text-[#959595] text-[12px] leading-relaxed">
                  Configure the entry type and input fields
                </p>
              </div>

              <div className="mb-[20px]">
                <label className="block text-[#CCCCCC] text-[14px] font-medium mb-[8px]">
                  Entry Type
                </label>
                 <Dropdown
                   value={selectedNodeData.entryType || 'endpoint'}
                   onChange={(value) => updateNodeData(selectedNode!, { entryType: value })}
                   options={ENTRY_TYPE_OPTIONS}
                   className="h-[32px]"
                 />
              </div>

              <div className="mb-[12px]">
                <h3 className="text-white text-[16px] font-bold mb-[4px]">
                  Fields
                </h3>
              </div>

              <div className="space-y-[16px]">
                <div className="grid grid-cols-2 gap-4 pb-[8px] border-b border-[#535353]">
                  <p className="text-[#CCCCCC] text-[12px] font-medium">
                    Field Name
                  </p>
                  <p className="text-[#CCCCCC] text-[12px] font-medium">
                    Input Type
                  </p>
                </div>

                {(selectedNodeData.fields || []).map((field) => (
                  <div key={field.id} className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#484848] border-white border-[0.5px] h-[32px] rounded-[8px] overflow-hidden">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => updateField(field.id, { key: e.target.value })}
                          placeholder="Field name"
                          className="bg-transparent h-full w-full px-[12px] text-[12px] text-white placeholder-[#999] outline-none"
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
                      <svg className="text-[#d9d9d9]" width="10" height="10" viewBox="0 0 10 10" fill="none">
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
                className="!bg-transparent border-[#f7f7f7] border-[0.5px] flex gap-3 h-[36px] hover:!bg-[#535353] items-center mt-[16px] px-[16px] rounded-[8px] transition-colors w-full"
              >
                <div className="flex h-[12px] items-center justify-center w-[12px]">
                  <div className="bg-[#d9d9d9] h-[1px] w-[12px]" />
                  <div className="absolute bg-[#d9d9d9] h-[12px] w-[1px]" />
                </div>
                <p className="text-[12px] text-white font-medium">
                  Add Field
                </p>
              </Button>
            </div>
          ) : selectedNodeData?.type === 'ai' && selectedNodeData.aiConfig ? (
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-white text-[18px] font-bold mb-[4px]">
                  AI Configuration
                </h2>
                <p className="text-[#959595] text-[12px] leading-relaxed">
                  Configure prompts and output settings for this AI model
                </p>
              </div>

              <div className="mb-[16px]">
                <label className="block text-[#CCCCCC] text-[14px] font-medium mb-[8px]">
                  System Prompt
                </label>
              </div>

              <div className="bg-[#484848] border-white border-[0.5px] mt-[4px] overflow-clip p-[11px] rounded-[10px]" style={{ minHeight: selectedNodeData.aiConfig.hasTemplate ? '330px' : '71px' }}>
                <textarea
                  value={selectedNodeData.aiConfig.systemPrompt}
                  onChange={(e) => updateAIConfig({ systemPrompt: e.target.value })}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal leading-[normal] mb-[7px] not-italic outline-none resize-none text-[10px] text-white w-full"
                  rows={2}
                />

                {selectedNodeData.aiConfig.hasTemplate && (
                  <div className="bg-neutral-700 mt-[7px] overflow-clip p-[13px] relative rounded-[10px]">
                    <div className="absolute border-[0.5px] border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
                    <textarea
                      value={selectedNodeData.aiConfig.templateText || ''}
                      onChange={(e) => updateAIConfig({ templateText: e.target.value })}
                      className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic outline-none resize-none text-[10px] text-white w-full"
                      rows={10}
                    />
                    <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic right-[13px] text-[#959595] text-[8px] text-nowrap top-[7px] whitespace-pre">Template</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-center justify-end mt-[4px]">
                <Button
                  onClick={toggleTemplate}
                  variant="tertiary"
                  className="!bg-transparent !p-0 font-['Inter:Regular',_sans-serif] font-normal hover:text-white leading-[normal] not-italic text-[8px] text-[#959595] text-nowrap transition-colors whitespace-pre"
                >
                  {selectedNodeData.aiConfig.hasTemplate ? 'Remove Template' : 'Add Template'}
                </Button>
              </div>

              <div className="mt-[20px]">
                <label className="block text-[#CCCCCC] text-[14px] font-medium mb-[8px]">
                  User Prompt
                </label>
              </div>

              <div className="bg-[#484848] border-[#5a5a5a] border-[0.5px] mt-[4px] overflow-clip rounded-[10px]">
                <textarea
                  value={selectedNodeData.aiConfig.userPrompt}
                  onChange={(e) => updateAIConfig({ userPrompt: e.target.value })}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal h-[119px] leading-[normal] not-italic outline-none p-[11px] resize-none text-[10px] text-white w-full"
                />
              </div>

              <div className="mt-[32px] mb-[16px]">
                <h3 className="text-white text-[16px] font-bold mb-[4px]">
                  Expected Output
                </h3>
                <p className="text-[#959595] text-[11px]">
                  Define the output format and structure
                </p>
              </div>

              <div className="mb-[12px]">
                <label className="block text-[#CCCCCC] text-[13px] font-medium mb-[6px]">
                  Output Type
                </label>
              </div>

              <div className="bg-[#484848] border-[#5a5a5a] border-[0.5px] h-[27px] mt-[4px] overflow-clip rounded-[10px]">
                <input
                  type="text"
                  value={selectedNodeData.aiConfig.outputType}
                  onChange={(e) => updateAIConfig({ outputType: e.target.value })}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal h-full leading-[normal] not-italic outline-none px-[12px] text-[10px] text-nowrap text-white w-full"
                />
              </div>

              <div className="mt-[16px] mb-[6px]">
                <label className="block text-[#CCCCCC] text-[13px] font-medium">
                  JSON Structure
                </label>
              </div>

              <div className="bg-[#484848] border-[#5a5a5a] border-[0.5px] mt-[4px] overflow-clip rounded-[10px]">
                <textarea
                  value={selectedNodeData.aiConfig.outputStructure}
                  onChange={(e) => updateAIConfig({ outputStructure: e.target.value })}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-mono font-normal h-[72px] leading-[normal] not-italic outline-none p-[11px] resize-none text-[10px] text-white w-full"
                />
              </div>
            </div>
          ) : selectedNodeData?.type === 'scheduler' && selectedNodeData.schedulerConfig ? (
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-white text-[18px] font-bold mb-[4px]">
                  Scheduler Settings
                </h2>
                <p className="text-[#959595] text-[12px] leading-relaxed">
                  Configure calendar and scheduling options
                </p>
              </div>

              <div className="mb-[12px]">
                <label className="block text-[#CCCCCC] text-[14px] font-medium mb-[8px]">
                  People Involved
                </label>
              </div>

              <div className="bg-[#484848] border-white border-[0.5px] mt-[4px] min-h-[71px] overflow-clip p-[7px] rounded-[10px]">
                <div className="flex flex-wrap gap-[3px]">
                  {selectedNodeData.schedulerConfig.people.map((person, idx) => (
                    <div key={idx} className="bg-[#bdffb7] flex h-[18px] items-center overflow-clip px-[9px] relative rounded-[10px]">
                      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[8px] text-black text-nowrap whitespace-pre">
                        {person}
                      </p>
                      <Button
                        onClick={() => removePerson(person)}
                        variant="tertiary"
                        className="!bg-transparent !p-0 absolute hover:opacity-70 right-[7px] top-[7px] transition-opacity"
                      >
                        <div className="flex h-[calc(1px*5.488)] items-center justify-center rotate-45 w-[calc(1px*5.488)]">
                          <div className="bg-black h-[0.5px] w-[5.488px]" />
                        </div>
                        <div className="absolute flex h-[calc(1px*5.345)] items-center justify-center left-0 rotate-[135deg] top-0 w-[calc(1px*5.345)]">
                          <div className="bg-black h-[0.5px] w-[5.345px]" />
                        </div>
                      </Button>
                    </div>
                  ))}
                  <div className="bg-transparent border-[#f7f7f7] border-[0.5px] flex gap-1 h-[16px] items-center overflow-clip px-[8px] rounded-[10px]">
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
                      className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic outline-none text-[7px] text-white w-[30px]"
                    />
                    <Button onClick={addPerson} variant="tertiary" className="!bg-transparent !p-0 flex h-[5px] items-center justify-center w-[5px]">
                      <div className="bg-[#d9d9d9] h-px rotate-90 w-[5px]" />
                      <div className="absolute bg-[#d9d9d9] h-px w-[5px]" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-[16px] mb-[6px]">
                <label className="block text-[#CCCCCC] text-[14px] font-medium">
                  Minimum Time Required
                </label>
              </div>

              <div className="bg-[#484848] border-[#5a5a5a] border-[0.5px] h-[26px] mt-[4px] overflow-clip rounded-[10px]">
                <input
                  type="text"
                  value={selectedNodeData.schedulerConfig.minTimeRequirement}
                  onChange={(e) => updateSchedulerConfig({ minTimeRequirement: e.target.value })}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal h-full leading-[normal] not-italic outline-none px-[11px] text-[10px] text-nowrap text-white w-full"
                />
              </div>

              <div className="mt-[16px] mb-[6px]">
                <label className="block text-[#CCCCCC] text-[14px] font-medium">
                  Target Calendar
                </label>
              </div>

              <div className="bg-[#484848] border-[#5a5a5a] border-[0.5px] h-[26px] mt-[4px] overflow-clip rounded-[10px]">
                <input
                  type="text"
                  value={selectedNodeData.schedulerConfig.calendar}
                  onChange={(e) => updateSchedulerConfig({ calendar: e.target.value })}
                  className="bg-transparent font-['Inter:Regular',_sans-serif] font-normal h-full leading-[normal] not-italic outline-none px-[11px] text-[10px] text-nowrap text-white w-full"
                />
              </div>
            </div>
          ) : selectedNodeData?.type === 'review' && selectedNodeData.reviewConfig ? (
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-white text-[18px] font-bold mb-[4px]">
                  Review Checklist
                </h2>
                <p className="text-[#959595] text-[12px] leading-relaxed">
                  Mark validation steps for workflow nodes
                </p>
              </div>
              <div className="space-y-[8px]">
                {nodes.filter(n => n.data.type !== 'review').map((node) => {
                  const validationStep = selectedNodeData.reviewConfig!.validationSteps.find(s => s.nodeId === node.id);
                  const isValidated = validationStep?.validated || false;

                  return (
                    <div
                      key={node.id}
                      className={`${isValidated ? 'bg-[#494949]' : 'bg-[#3d3d3d]'} cursor-pointer h-[37px] overflow-clip relative rounded-[10px] transition-colors hover:bg-[#4a4a4a]`}
                      onClick={() => {
                        const updatedSteps = selectedNodeData.reviewConfig!.validationSteps.map(step =>
                          step.nodeId === node.id ? { ...step, validated: !step.validated } : step
                        );
                        updateNodeData(selectedNode!, { 
                          reviewConfig: { ...selectedNodeData.reviewConfig!, validationSteps: updatedSteps } 
                        });
                      }}
                    >
                      <div className="flex h-full items-center px-[15px] relative">
                        <div className="flex items-center">
                          {node.data.type === 'entry' ? (
                            <div className="h-[18px] mr-[13px] w-[15px]">
                              <svg className="block size-full" fill="none" viewBox="0 0 15 18">
                                <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x1="10.4614" x2="3.18514" y1="4.25" y2="4.25" />
                                <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x1="12" x2="3" y1="8.0968" y2="8.0968" />
                                <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x1="10.2764" x2="3.00008" y1="12.0968" y2="12.0968" />
                                <rect height="17.5" stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" width="14.5" x="0.25" y="0.25" />
                              </svg>
                            </div>
                          ) : node.data.type === 'ai' ? (
                            <div className="mr-[9px] relative size-[28px]">
                              <p className={`absolute font-['Inter:Regular',_sans-serif] font-normal h-[16px] leading-[normal] left-[9px] not-italic text-[15px] top-[11px] w-[16.667px]`} style={{ color: isValidated ? "white" : "#999999" }}>
                                AI
                              </p>
                              <div className="absolute h-0 left-[23px] top-[13.56px] w-[6.667px]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 1">
                                  <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x2="6.66671" y1="0.75" y2="0.75" />
                                </svg>
                              </div>
                              <div className="absolute h-[7px] left-[26.67px] top-[10px] w-0">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 7" style={{ transform: 'rotate(-90deg)' }}>
                                  <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x2="7" y1="0.75" y2="0.75" />
                                </svg>
                              </div>
                            </div>
                          ) : node.data.type === 'scheduler' ? (
                            <div className="mr-[9px] relative size-[28px]">
                              <div className="absolute h-[5.04px] left-[9px] top-[9px] w-[20.16px]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 7">
                                  <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x2="20.16" y1="5.79" y2="5.79" />
                                  <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x2="20.16" y1="0.75" y2="0.75" />
                                </svg>
                              </div>
                            </div>
                          ) : null}
                          <p className={`font-['Inter:Bold',_sans-serif] font-bold leading-[normal] not-italic text-[16px] text-nowrap whitespace-pre`} style={{ color: isValidated ? "white" : "#999999" }}>
                            {node.data.type === 'entry' ? 'Form' : node.data.label}
                          </p>
                        </div>
                        <div className="absolute right-[15px] rounded-[2px] size-[9px]">
                          <div className={`border ${isValidated ? 'border-white' : 'border-[#999999]'} border-solid inset-0 rounded-[2px]`}>
                            {isValidated && (
                              <svg className="block size-full" fill="none" viewBox="0 0 7 6" style={{ transform: 'translate(1px, 2px) scale(0.8)' }}>
                                <line stroke="white" x1="0.299998" x2="2.96666" y1="3.6" y2="5.59997" />
                                <line stroke="white" x1="2.2719" x2="6.16078" y1="5.693" y2="0.693011" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-[20px] pt-[16px] border-t border-[#535353]">
                <h3 className="text-white text-[14px] font-medium mb-[8px]">
                  Meeting Creation
                </h3>
                <div
                  className={`cursor-pointer h-[37px] overflow-clip relative rounded-[10px] transition-colors hover:bg-[#4a4a4a] ${selectedNodeData.reviewConfig!.meetingConfirmed ? 'bg-[#494949]' : 'bg-[#3d3d3d]'}`}
                  onClick={() => {
                    updateNodeData(selectedNode!, { 
                      reviewConfig: { 
                        ...selectedNodeData.reviewConfig!, 
                        meetingConfirmed: !selectedNodeData.reviewConfig!.meetingConfirmed 
                      } 
                    });
                  }}
                >
                  <div className="flex h-full items-center px-[15px] relative">
                    <div className="flex items-center">
                      <div className="mr-[13px] size-[18px]">
                        <svg className="block size-full" fill="none" viewBox="0 0 18 18">
                          <rect x="1" y="3" width="16" height="12" rx="2" stroke={selectedNodeData.reviewConfig!.meetingConfirmed ? "white" : "#999999"} strokeWidth="1" />
                          <line x1="1" y1="7" x2="17" y2="7" stroke={selectedNodeData.reviewConfig!.meetingConfirmed ? "white" : "#999999"} strokeWidth="1" />
                          <line x1="5" y1="11" x2="13" y2="11" stroke={selectedNodeData.reviewConfig!.meetingConfirmed ? "white" : "#999999"} strokeWidth="1" />
                          <line x1="5" y1="13" x2="11" y2="13" stroke={selectedNodeData.reviewConfig!.meetingConfirmed ? "white" : "#999999"} strokeWidth="1" />
                        </svg>
                      </div>
                      <p className={`font-['Inter:Bold',_sans-serif] font-bold leading-[normal] not-italic text-[16px] text-nowrap whitespace-pre`} style={{ color: selectedNodeData.reviewConfig!.meetingConfirmed ? "white" : "#999999" }}>
                        Create Meeting
                      </p>
                    </div>
                    <div className="absolute right-[15px] rounded-[2px] size-[9px]">
                      <div className={`border ${selectedNodeData.reviewConfig!.meetingConfirmed ? 'border-white' : 'border-[#999999]'} border-solid inset-0 rounded-[2px]`}>
                        {selectedNodeData.reviewConfig!.meetingConfirmed && (
                          <svg className="block size-full" fill="none" viewBox="0 0 7 6" style={{ transform: 'translate(1px, 2px) scale(0.8)' }}>
                            <line stroke="white" x1="0.299998" x2="2.96666" y1="3.6" y2="5.59997" />
                            <line stroke="white" x1="2.2719" x2="6.16078" y1="5.693" y2="0.693011" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : !selectedNodeData && (
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <p className="text-gray-400 text-sm">Select a node to configure its properties</p>
            </div>
          )}
        </div>
      </div>
      ) : null}
    </div>
  );
}
