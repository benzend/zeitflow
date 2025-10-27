import { useState, useRef, useEffect } from 'react';
import { Plus, Workflow as WorkflowIcon, User, Trash2 } from 'lucide-react';
import { svgPaths, schedulerSvg } from '@/lib/svg-assets';
import { NodeData, Connection, Field, AINodeConfig, SchedulerConfig } from '@/lib/workflow-types';
import { generateNodeId, generateFieldId } from '@/lib/workflow-utils';

interface WorkflowBuilderProps {
  initialNodes?: NodeData[];
  initialConnections?: Connection[];
  onSave?: (nodes: NodeData[], connections: Connection[]) => void;
}

export default function WorkflowBuilder({
  initialNodes = [],
  initialConnections = [],
  onSave
}: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes.length > 0 ? initialNodes : [
    { 
      id: '1', 
      type: 'endpoint', 
      x: 314, 
      y: 322, 
      label: 'Endpoint',
      fields: [
        { id: '1', key: 'Notes', type: 'textarea' },
        { id: '2', key: 'Previous Meeting', type: 'calendar slot' }
      ]
    },
    { 
      id: '2', 
      type: 'ai', 
      x: 433, 
      y: 322, 
      label: 'gpt-4o',
      aiConfig: {
        systemPrompt: 'You are an expert PM that has the technical experience to estimate tasks. Take what the notes from the meeting the user gives you and turn it into a list of takeaways and next steps, with estimates attached to the next steps.',
        userPrompt: '{{ entry.fields.notes }}',
        outputType: 'JSON',
        outputStructure: `{
  "total_estimate": "time",
  "takeaways": [{ "text": "string" }],
  "next_steps": [{ "text": "string", "estimate": "time" }]
}`
      }
    },
    { 
      id: '3', 
      type: 'scheduler', 
      x: 543, 
      y: 322, 
      label: 'Scheduler',
      schedulerConfig: {
        people: ['Bryan', 'Morgan', 'Eric', 'Me'],
        minTimeRequirement: '{{ ai.total_estimate }}',
        calendar: 'Work Calendar'
      }
    },
    { 
      id: '4', 
      type: 'ai', 
      x: 667, 
      y: 322, 
      label: 'gpt-4o',
      aiConfig: {
        systemPrompt: 'You are an expert PM great at communicating takeaways. The format you follow goes like this:',
        userPrompt: `# takeaways
{{ takeaways }}

# next steps
{{ next_steps }}

# next call
{{ schedular.next_meeting.time }}`,
        outputType: 'JSON',
        outputStructure: `{
  "total_estimate": "time",
  "takeaways": [{ "text": "string" }],
  "next_steps": [{ "text": "string", "estimate": "time" }]
}`,
        hasTemplate: true,
        templateText: `[meeting title] | Takeaways

Here's what we heard:
[list of items that were said. goal here is to let people know what happened in the call]

Next steps:
[list of actionables that were agreed upon on the call]

[some nice-ities about the meeting that happened. "thanks for the feedback team]

[set up and outline a next time (aka a jump) on the calendar based on the next steps]`
      }
    },
     {
       id: '5',
       type: 'review',
       x: 777,
       y: 322,
       label: 'Review',
        reviewConfig: {
          validationSteps: [], // Will be populated dynamically
          meetingConfirmed: false
        }
     }
  ]);
  
  const [connections, setConnections] = useState<Connection[]>(initialConnections.length > 0 ? initialConnections : [
    { from: '1', to: '2' },
    { from: '2', to: '3' },
    { from: '3', to: '4' },
    { from: '4', to: '5' }
  ]);
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newPersonName, setNewPersonName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  // Update review node validation steps when nodes change
  useEffect(() => {
    const reviewNode = nodes.find(n => n.type === 'review');
    if (reviewNode && reviewNode.reviewConfig) {
      const nonReviewNodes = nodes.filter(n => n.type !== 'review');
      const currentValidationSteps = reviewNode.reviewConfig.validationSteps;

      // Create validation steps for all non-review nodes
      const updatedValidationSteps = nonReviewNodes.map(node => {
        const existingStep = currentValidationSteps.find(step => step.nodeId === node.id);
        return existingStep || { nodeId: node.id, validated: false };
      });

      // Remove steps for nodes that no longer exist
      const filteredSteps = updatedValidationSteps.filter(step =>
        nonReviewNodes.some(node => node.id === step.nodeId)
      );

      if (JSON.stringify(filteredSteps) !== JSON.stringify(currentValidationSteps)) {
        setNodes(nodes.map(node =>
          node.id === reviewNode.id
            ? {
                ...node,
                reviewConfig: {
                  ...node.reviewConfig!,
                  validationSteps: filteredSteps
                }
              }
            : node
        ));
      }
    }
  }, [nodes]); // Re-run when nodes change

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDraggingNode(nodeId);
    setSelectedNode(nodeId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  };

  const snapToGrid = (value: number, gridSize: number = 20) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Add bounds checking to prevent nodes from being dragged off-screen
      const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 200)); // Keep some margin
      const boundedY = Math.max(50, Math.min(newY, window.innerHeight - 100)); // Account for header

      setNodes(nodes.map(node =>
        node.id === draggingNode
          ? {
              ...node,
              x: snapToGrid(boundedX),
              y: snapToGrid(boundedY)
            }
          : node
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const addField = () => {
    if (!selectedNode) return;
    const newField: Field = {
      id: generateFieldId(),
      key: 'New Field',
      type: 'text'
    };
    setNodes(nodes.map(node => 
      node.id === selectedNode && node.type === 'endpoint'
        ? { ...node, fields: [...(node.fields || []), newField] }
        : node
    ));
  };

  const removeField = (fieldId: string) => {
    if (!selectedNode) return;
    setNodes(nodes.map(node => 
      node.id === selectedNode && node.type === 'endpoint'
        ? { ...node, fields: (node.fields || []).filter(f => f.id !== fieldId) }
        : node
    ));
  };

  const updateField = (fieldId: string, updates: Partial<Field>) => {
    if (!selectedNode) return;
    setNodes(nodes.map(node => 
      node.id === selectedNode && node.type === 'endpoint'
        ? { ...node, fields: (node.fields || []).map(f => f.id === fieldId ? { ...f, ...updates } : f) }
        : node
    ));
  };

  const updateAIConfig = (updates: Partial<AINodeConfig>) => {
    if (!selectedNode) return;
    setNodes(nodes.map(node => 
      node.id === selectedNode && node.type === 'ai'
        ? { ...node, aiConfig: { ...node.aiConfig!, ...updates } }
        : node
    ));
  };

  const updateSchedulerConfig = (updates: Partial<SchedulerConfig>) => {
    if (!selectedNode) return;
    setNodes(nodes.map(node => 
      node.id === selectedNode && node.type === 'scheduler'
        ? { ...node, schedulerConfig: { ...node.schedulerConfig!, ...updates } }
        : node
    ));
  };

  const toggleValidation = (nodeId: string) => {
    if (!selectedNode) return;
    setNodes(nodes.map(node =>
      node.id === selectedNode && node.type === 'review'
        ? {
            ...node,
            reviewConfig: {
              ...node.reviewConfig!,
              validationSteps: node.reviewConfig!.validationSteps.map(step =>
                step.nodeId === nodeId ? { ...step, validated: !step.validated } : step
              )
            }
          }
        : node
    ));
  };

  const toggleMeetingConfirmation = () => {
    if (!selectedNode) return;
    setNodes(nodes.map(node =>
      node.id === selectedNode && node.type === 'review'
        ? {
            ...node,
            reviewConfig: {
              ...node.reviewConfig!,
              meetingConfirmed: !node.reviewConfig!.meetingConfirmed
            }
          }
        : node
    ));
  };

  const addPerson = () => {
    if (!selectedNode || !newPersonName.trim()) return;
    setNodes(nodes.map(node => 
      node.id === selectedNode && node.type === 'scheduler'
        ? { 
            ...node, 
            schedulerConfig: { 
              ...node.schedulerConfig!, 
              people: [...node.schedulerConfig!.people, newPersonName.trim()] 
            } 
          }
        : node
    ));
    setNewPersonName('');
  };

  const removePerson = (personName: string) => {
    if (!selectedNode) return;
    setNodes(nodes.map(node => 
      node.id === selectedNode && node.type === 'scheduler'
        ? { 
            ...node, 
            schedulerConfig: { 
              ...node.schedulerConfig!, 
              people: node.schedulerConfig!.people.filter(p => p !== personName) 
            } 
          }
        : node
    ));
  };

  const toggleTemplate = () => {
    if (!selectedNode) return;
    setNodes(nodes.map(node =>
      node.id === selectedNode && node.type === 'ai'
        ? {
            ...node,
            aiConfig: {
              ...node.aiConfig!,
              hasTemplate: !node.aiConfig!.hasTemplate,
              // Preserve template text when toggling, ensure it has a value when enabling
              templateText: node.aiConfig!.hasTemplate
                ? node.aiConfig!.templateText // Keep existing text when disabling
                : (node.aiConfig!.templateText || '[meeting title] | Takeaways\n\nHere\'s what we heard:\n[list of items that were said]\n\nNext steps:\n[list of actionables]\n\n[some nice-ities about the meeting]') // Default when enabling
            }
          }
        : node
    ));
  };

  const addNode = (type: 'endpoint' | 'ai' | 'scheduler' | 'review') => {
    const newNode: NodeData = {
      id: generateNodeId(),
      type,
      x: snapToGrid(400),
      y: snapToGrid(200),
      label: type === 'endpoint' ? 'Endpoint' : type === 'ai' ? 'AI Model' : type === 'scheduler' ? 'Scheduler' : 'Review',
      ...(type === 'endpoint' ? { fields: [] } : 
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
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
  };

  const removeNode = (nodeId: string) => {
    const nodeToRemove = nodes.find(n => n.id === nodeId);
    if (!nodeToRemove) return;

    // Check if this is the only node of its type and if it's connected
    const nodesOfSameType = nodes.filter(n => n.type === nodeToRemove.type && n.id !== nodeId);
    const connectedToThisNode = connections.filter(c => c.from === nodeId || c.to === nodeId);

    // For endpoint nodes, warn if they're connected (as they provide data)
    if (nodeToRemove.type === 'endpoint' && connectedToThisNode.length > 0 && nodesOfSameType.length === 0) {
      // Could add a confirmation dialog here in the future
      console.warn('Removing the only endpoint node that has connections. This may break the workflow.');
    }

    // For review nodes, they should be removable but validation steps need updating
    if (nodeToRemove.type === 'review') {
      // The useEffect will handle updating validation steps
    }

    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, connections);
    }
  };

  const getNodeWidth = (type: string) => {
    if (type === 'endpoint') return 98;
    if (type === 'ai') return 89;
    if (type === 'scheduler') return 103;
    return 89; // review
  };

  const getNodeIcon = (node: NodeData) => {
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

  return (
    <div className="bg-gradient-to-b from-[#2b2b2b] flex h-screen relative to-[#3c3c3c] w-full">
      {/* Left Sidebar */}
      <div className="absolute h-[409px] left-[16px] top-[82px] w-[58px] z-10 pointer-events-auto">
        <div className="bg-[#424242] border-[#535353] border flex flex-col gap-2 h-full items-center p-2 rounded-[10px]">
          <button
            onClick={() => addNode('endpoint')}
            className="flex h-[40px] hover:bg-[#535353] items-center justify-center rounded transition-colors w-full"
            title="Add Endpoint"
          >
            <Plus className="text-white" size={20} />
          </button>
          <button
            onClick={() => addNode('ai')}
            className="flex h-[40px] hover:bg-[#535353] items-center justify-center rounded transition-colors w-full"
            title="Add AI Model"
          >
            <WorkflowIcon className="text-white" size={20} />
          </button>
          <button
            onClick={() => addNode('scheduler')}
            className="flex h-[40px] hover:bg-[#535353] items-center justify-center rounded transition-colors w-full"
            title="Add Scheduler"
          >
            <User className="text-white" size={20} />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => addNode('review')}
            className="flex h-[40px] hover:bg-[#535353] items-center justify-center rounded transition-colors w-full"
            title="Add Review Node"
          >
            <svg className="text-white" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="0.8" fill="none" />
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="0.8" fill="none" />
            </svg>
          </button>
          <div className="flex gap-1 items-center">
            <svg className="text-white" width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d={svgPaths.p17fb1d00} fill="currentColor" transform="scale(0.267) translate(-21, -331)" />
            </svg>
            <svg className="text-white" width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d={svgPaths.p305c9380} fill="currentColor" transform="scale(0.267) translate(-21, -336)" />
            </svg>
          </div>
          {onSave && (
            <button
              onClick={handleSave}
              className="bg-[#a3e635] text-[#18181b] px-2 py-1 rounded text-xs hover:bg-[#8bc329] transition-colors w-full"
              title="Save Workflow"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className={`absolute inset-0 ${draggingNode ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Title */}
        <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[normal] left-[23px] not-italic text-[32px] text-nowrap text-white top-[19px] whitespace-pre">
          Automatic Jump Scheduler
        </p>

        {/* Connection Lines */}
        {connections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          const fromX = fromNode.x + getNodeWidth(fromNode.type);
          const fromY = fromNode.y + 15;
          const toX = toNode.x;
          const toY = toNode.y + 15;

          // Calculate the bounding box for the connection
          const minX = Math.min(fromX, toX);
          const minY = Math.min(fromY, toY);
          const width = Math.abs(toX - fromX);
          const height = Math.abs(toY - fromY);

          // Calculate relative positions within the SVG
          const relFromX = fromX - minX;
          const relFromY = fromY - minY;
          const relToX = toX - minX;
          const relToY = toY - minY;

          // Create a curved path that works in any direction
          const dx = relToX - relFromX;
          const dy = relToY - relFromY;

          // Control points for the curve
          const cp1x = relFromX + dx * 0.4;
          const cp1y = relFromY + dy * 0.2;
          const cp2x = relToX - dx * 0.4;
          const cp2y = relToY - dy * 0.2;

          // Arrow direction calculation
          const angle = Math.atan2(dy, dx);
          const arrowLength = 8;

          const arrowX = relToX - Math.cos(angle) * 6;
          const arrowY = relToY - Math.sin(angle) * 6;

          const arrowP1X = arrowX - Math.cos(angle - Math.PI/6) * arrowLength;
          const arrowP1Y = arrowY - Math.sin(angle - Math.PI/6) * arrowLength;
          const arrowP2X = arrowX - Math.cos(angle + Math.PI/6) * arrowLength;
          const arrowP2Y = arrowY - Math.sin(angle + Math.PI/6) * arrowLength;

          return (
            <svg
              key={idx}
              className="absolute pointer-events-none z-0"
              style={{
                left: minX,
                top: minY,
                width: Math.max(width, 20),
                height: Math.max(height, 20)
              }}
            >
              {/* Connection path with curve */}
              <path
                d={`M ${relFromX} ${relFromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${relToX} ${relToY}`}
                stroke="#6B7280"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />

              {/* Arrow head */}
              <polygon
                points={`${arrowX},${arrowY} ${arrowP1X},${arrowP1Y} ${arrowP2X},${arrowP2Y}`}
                fill="#6B7280"
              />

              {/* Connection points */}
              <circle
                cx={relFromX}
                cy={relFromY}
                r="3"
                fill="#424242"
                stroke="#6B7280"
                strokeWidth="1"
              />
              <circle
                cx={relToX}
                cy={relToY}
                r="3"
                fill="#424242"
                stroke="#6B7280"
                strokeWidth="1"
              />
            </svg>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = selectedNode === node.id;
          const twTextColor = isSelected ? 'green-100' : 'white';
          const twBorderColor = isSelected ? 'green-100' : 'gray-200';
          const color = isSelected ? '#11FF00' : '#FFFFFF';
          
          return (
            <div
              key={node.id}
              className="absolute cursor-move pointer-events-auto"
              style={{ left: node.x, top: node.y }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={() => setSelectedNode(node.id)}
            >
              {node.type === 'endpoint' ? (
                <div className={`bg-[#424242] border-${twBorderColor} border h-[31px] overflow-clip rounded-[10px] w-[98px]`}>
                  <div className="flex h-full items-center justify-between px-[11px] relative">
                    <div className="h-[13px] w-[15px]">
                      <svg className="block size-full" fill="none" viewBox="0 0 15 13">
                        <circle cx="13" cy="2" r="1.75" stroke={color} strokeWidth="0.5" />
                        <circle cx="10" cy="10" r="1.75" stroke={color} strokeWidth="0.5" />
                        <circle cx="5" cy="3" r="1.75" stroke={color} strokeWidth="0.5" />
                        <circle cx="2" cy="11" r="1.75" stroke={color} strokeWidth="0.5" />
                        <line stroke={color} strokeWidth="0.5" x1="2.76788" x2="4.76788" y1="9.90715" y2="4.90715" />
                        <line stroke={color} strokeWidth="0.5" x1="10.7679" x2="12.7679" y1="8.90715" y2="3.90715" />
                        <line stroke={color} strokeWidth="0.5" x1="9.13017" x2="6.43759" y1="8.96121" y2="4.29752" />
                      </svg>
                    </div>
                    <p className={`font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[12px] text-nowrap whitespace-pre`} style={{ color }}>
                      {node.label}
                    </p>
                  </div>
                </div>
              ) : node.type === 'ai' ? (
                <div className="bg-[#424242] h-[31px] overflow-clip rounded-[10px] relative w-[89px]">
                  <div className="flex h-full items-center justify-center px-[12px] relative">
                    <div className="absolute left-[12px] top-[11px]">
                      <p className={`font-['Inter:Regular',_sans-serif] font-normal h-[9px] leading-[normal] not-italic text-[8px] w-[10px]`} style={{ color }}>
                        AI
                      </p>
                      <div className="h-0 mt-[2px] w-[4px]">
                        <svg className="block size-full" fill="none" viewBox="0 0 4 1">
                          <line stroke={color} strokeWidth="0.5" x2="4" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                    </div>
                    <p className={`font-['Inter:Regular',_sans-serif] font-normal leading-[normal] ml-[21px] not-italic text-[12px] text-nowrap whitespace-pre`} style={{ color }}>
                      {node.label}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute border border-[#11ff00] border-solid inset-0 pointer-events-none rounded-[10px]" />
                  )}
                </div>
              ) : node.type === 'scheduler' ? (
                <div className="bg-[#424242] h-[31px] overflow-clip rounded-[10px] relative w-[103px]">
                  <div className="flex h-full items-center justify-center px-[12px] relative">
                    <div className="absolute left-[12px] top-[10px]">
                      <div className="h-[3px] relative w-[12px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 4">
                          <line stroke={color} strokeWidth="0.5" x2="12" y1="3.75" y2="3.75" />
                          <line stroke={color} strokeWidth="0.5" x2="12" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                    </div>
                    <p className={`font-['Inter:Regular',_sans-serif] font-normal leading-[normal] ml-[21px] not-italic text-[12px] text-nowrap whitespace-pre`} style={{ color }}>
                      {node.label}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute border border-[#11ff00] border-solid inset-0 pointer-events-none rounded-[10px]" />
                  )}
                </div>
              ) : (
                <div className="bg-[#424242] h-[31px] overflow-clip rounded-[10px] relative w-[89px]">
                  <div className="flex h-full items-center justify-center px-[12px] relative">
                    <div className="absolute left-[10px] top-[9px]">
                      <svg className="block size-full" width="14" height="14" fill="none" viewBox="0 0 14 15">
                        <circle cx="7" cy="8" r="6.75" stroke="#11FF00" strokeWidth="0.5" />
                        <line stroke="#11FF00" x1="4.35355" x2="7.35355" y1="6.64645" y2="9.64645" />
                        <line stroke="#11FF00" x1="6.60532" x2="13.6053" y1="9.69303" y2="0.69303" />
                      </svg>
                    </div>
                    <p className={`font-['Inter:Regular',_sans-serif] font-normal leading-[normal] ml-[21px] not-italic text-${twTextColor} text-[12px] text-nowrap whitespace-pre`}>
                      {node.label}
                    </p>
                  </div>
                  <div className="absolute border border-[#11ff00] border-solid inset-0 pointer-events-none rounded-[10px]" />
                </div>
              )}
              <p className={`font-['Inter:Regular',_sans-serif] font-normal leading-[normal] mt-1 not-italic text-[8px] text-nowrap text-white text-${twTextColor} whitespace-pre`}>
                Entry
              </p>
            </div>
          );
        })}

        {/* Expand Button */}
        <div className="absolute left-[65px] size-[15px] top-[279px]">
          <div className="bg-[#424242] border-[#535353] border-[0.5px] cursor-pointer flex h-full hover:bg-[#535353] items-center justify-center rounded-full transition-colors w-full">
            <svg className="text-[#D9D9D9]" width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d={svgPaths.p6c6e700} fill="currentColor" transform="scale(0.533) translate(-7, -4)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="absolute bg-[#424242] border-[#535353] border-[0.5px] h-screen overflow-y-auto right-0 top-0 w-[356px]">
        <div className="h-full overflow-clip relative w-[356px]">
          {/* Header */}
          <div className="absolute border-[#535353] border-b-[0.5px] h-[49px] left-0 top-0 w-[356px] z-10">
            <div className="flex h-[49px] items-center justify-between overflow-clip px-[16px] relative w-[356px]">
              <div className="flex gap-2 items-center">
                {selectedNodeData?.type === 'endpoint' ? (
                  <>
                    <div className="border-[0.5px] border-solid border-white h-[18px] w-[15px]">
                      <div className="flex flex-col gap-[3px] h-full items-center justify-center">
                        <div className="bg-white h-px w-[7px]" />
                        <div className="bg-white h-px w-[9px]" />
                        <div className="bg-white h-px w-[7px]" />
                      </div>
                    </div>
                    <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic text-[20px] text-nowrap text-white whitespace-pre">
                      Form
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
              </div>
              <button
                onClick={() => selectedNode && removeNode(selectedNode)}
                className="bg-[#424242] flex h-[23px] hover:bg-[#535353] items-center justify-center rounded-[10px] transition-colors w-[29px]"
              >
                <Trash2 className="text-red-500" size={13} />
              </button>
            </div>
            {selectedNodeData?.type === 'endpoint' ? (
              <>
                <div className="absolute bg-[#ffdcb8] h-[10px] left-[104px] overflow-clip rounded-[10px] top-[21px] w-[30px]">
                  <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] px-[7px] not-italic text-[6px] text-black text-nowrap whitespace-pre">
                    Entry
                  </p>
                </div>
                <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[normal] left-[50px] not-italic text-[#979797] text-[6px] text-nowrap top-[36px] whitespace-pre">
                  https://jjoist.com/47ab85qub63z28z89
                </p>
              </>
            ) : selectedNodeData?.type === 'ai' ? (
              <div className="absolute bg-[#f2ffb8] h-[10px] left-[120px] overflow-clip rounded-[10px] top-[21px] w-[49px]">
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] left-[7px] not-italic text-[6px] text-black text-nowrap top-px whitespace-pre">
                  Transformer
                </p>
              </div>
            ) : selectedNodeData?.type === 'scheduler' ? (
              <div className="absolute bg-[#b8ebff] h-[10px] left-[154px] overflow-clip rounded-[10px] top-[21px] w-[36px]">
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] left-[7px] not-italic text-[6px] text-black text-nowrap top-px whitespace-pre">
                  Planner
                </p>
              </div>
            ) : selectedNodeData?.type === 'review' ? (
              <div className="absolute bg-[#c3ffb8] h-[10px] left-[129px] overflow-clip rounded-[10px] top-[21px] w-[42px]">
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] left-[7px] not-italic text-[6px] text-black text-nowrap top-px whitespace-pre">
                  Validation
                </p>
              </div>
            ) : null}
          </div>

          {/* Content based on node type */}
          {selectedNodeData?.type === 'endpoint' ? (
            <div className="mt-[70px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-white text-[18px] font-bold mb-[4px]">
                  Form Fields
                </h2>
                <p className="text-[#959595] text-[12px] leading-relaxed">
                  Configure the input fields for this endpoint
                </p>
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
                      <div className="bg-[#484848] border-[#5a5a5a] border-[0.5px] h-[32px] rounded-[8px] overflow-hidden">
                        <input
                          type="text"
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value })}
                          placeholder="text, email, number..."
                          className="bg-transparent h-full w-full px-[12px] text-[12px] text-white placeholder-[#999] outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeField(field.id)}
                      className="flex h-[8px] hover:opacity-70 items-center justify-end transition-opacity w-full"
                    >
                      <svg className="text-[#d9d9d9]" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="0.5" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addField}
                className="border-[#f7f7f7] border-[0.5px] flex gap-3 h-[36px] hover:bg-[#535353] items-center mt-[16px] px-[16px] rounded-[8px] transition-colors w-full"
              >
                <div className="flex h-[12px] items-center justify-center w-[12px]">
                  <div className="bg-[#d9d9d9] h-[1px] w-[12px]" />
                  <div className="absolute bg-[#d9d9d9] h-[12px] w-[1px]" />
                </div>
                <p className="text-[12px] text-white font-medium">
                  Add Field
                </p>
              </button>
            </div>
          ) : selectedNodeData?.type === 'ai' && selectedNodeData.aiConfig ? (
            <div className="mt-[70px] px-[20px] pb-[20px]">
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
                <button
                  onClick={toggleTemplate}
                  className="font-['Inter:Regular',_sans-serif] font-normal hover:text-white leading-[normal] not-italic text-[8px] text-[#959595] text-nowrap transition-colors whitespace-pre"
                >
                  {selectedNodeData.aiConfig.hasTemplate ? 'Remove Template' : 'Add Template'}
                </button>
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

              <div className="flex justify-end mt-[4px]">
                <button className="hover:opacity-70 transition-opacity">
                  <svg className="text-[#d9d9d9]" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="0.5" />
                  </svg>
                </button>
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
            <div className="mt-[70px] px-[20px] pb-[20px]">
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
                      <button
                        onClick={() => removePerson(person)}
                        className="absolute hover:opacity-70 right-[7px] top-[7px] transition-opacity"
                      >
                        <div className="flex h-[calc(1px*5.488)] items-center justify-center rotate-45 w-[calc(1px*5.488)]">
                          <div className="bg-black h-[0.5px] w-[5.488px]" />
                        </div>
                        <div className="absolute flex h-[calc(1px*5.345)] items-center justify-center left-0 rotate-[135deg] top-0 w-[calc(1px*5.345)]">
                          <div className="bg-black h-[0.5px] w-[5.345px]" />
                        </div>
                      </button>
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
                    <button onClick={addPerson} className="flex h-[5px] items-center justify-center w-[5px]">
                      <div className="bg-[#d9d9d9] h-px rotate-90 w-[5px]" />
                      <div className="absolute bg-[#d9d9d9] h-px w-[5px]" />
                    </button>
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

              <div className="flex items-center justify-end mt-[4px]">
                <div className="border border-[#d6d6d6] border-solid h-[8px] relative w-[8px]">
                  <div className="absolute flex h-[calc(1px*5.656)] items-center justify-center left-[1px] rotate-[315deg] top-[-3px] w-[calc(1px*5.656)]">
                    <svg className="text-[#d6d6d6]" width="9" height="8" viewBox="0 0 9 8" fill="none">
                      <path d={schedulerSvg.p3eb57e80} fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedNodeData?.type === 'review' && selectedNodeData.reviewConfig ? (
            <div className="mt-[70px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <h2 className="text-white text-[18px] font-bold mb-[4px]">
                  Review Checklist
                </h2>
                <p className="text-[#959595] text-[12px] leading-relaxed">
                  Mark validation steps for workflow nodes
                </p>
              </div>
              <div className="space-y-[8px]">
              {nodes.filter(n => n.type !== 'review').map((node) => {
                const validationStep = selectedNodeData.reviewConfig!.validationSteps.find(s => s.nodeId === node.id);
                const isValidated = validationStep?.validated || false;
                
                return (
                  <div 
                    key={node.id} 
                    className={`${isValidated ? 'bg-[#494949]' : 'bg-[#3d3d3d]'} cursor-pointer h-[37px] overflow-clip relative rounded-[10px] transition-colors hover:bg-[#4a4a4a]`}
                    onClick={() => toggleValidation(node.id)}
                  >
                    <div className="flex h-full items-center px-[15px] relative">
                      <div className="flex items-center">
                        {node.type === 'endpoint' ? (
                          <div className="h-[18px] mr-[13px] w-[15px]">
                            <svg className="block size-full" fill="none" viewBox="0 0 15 18">
                              <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x1="10.4614" x2="3.18514" y1="4.25" y2="4.25" />
                              <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x1="12" x2="3" y1="8.0968" y2="8.0968" />
                              <line stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" x1="10.2764" x2="3.00008" y1="12.0968" y2="12.0968" />
                              <rect height="17.5" stroke={isValidated ? "white" : "#999999"} strokeWidth="0.5" width="14.5" x="0.25" y="0.25" />
                            </svg>
                          </div>
                        ) : node.type === 'ai' ? (
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
                        ) : node.type === 'scheduler' ? (
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
                          {getNodeIcon(node) === 'Form' ? 'Form' : node.label}
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
                   onClick={toggleMeetingConfirmation}
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
