import { useState } from 'react';
import WorkflowBuilderReactFlow from '@/components/WorkflowBuilderReactFlow';
import { NodeData, Connection } from '@/lib/workflow-types';

// Sample workflow data for testing
const sampleNodes: NodeData[] = [
  {
    id: '1',
    type: 'entry',
    x: 100,
    y: 100,
    label: 'Meeting Notes',
    fields: [
      { id: 'f1', key: 'Notes', type: 'textarea' },
      { id: 'f2', key: 'Attendees', type: 'text' }
    ]
  },
  {
    id: '2',
    type: 'ai',
    x: 300,
    y: 100,
    label: 'gpt-4o',
    aiConfig: {
      systemPrompt: 'You are an expert PM that analyzes meeting notes.',
      userPrompt: '{{ entry.fields.notes }}',
      outputType: 'JSON',
      outputStructure: '{"takeaways": [{"text": "string"}], "next_steps": [{"text": "string"}]}'
    }
  },
  {
    id: '3',
    type: 'review',
    x: 500,
    y: 100,
    label: 'Review',
    reviewConfig: {
      validationSteps: [
        { nodeId: '1', validated: false },
        { nodeId: '2', validated: false }
      ],
      meetingConfirmed: false
    }
  }
];

const sampleConnections: Connection[] = [
  { from: '1', to: '2' },
  { from: '2', to: '3' }
];

export default function TestWorkflowPage() {
  const [savedData, setSavedData] = useState<{ nodes: NodeData[], connections: Connection[] } | null>(null);

  const handleSave = (nodes: NodeData[], connections: Connection[]) => {
    console.log('Saving workflow:', { nodes, connections });
    setSavedData({ nodes, connections });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-xl font-bold">Workflow Builder Test</h1>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="text-white font-semibold mb-2">React Flow Benefits</h3>
              <ul className="text-gray-300 space-y-1">
                <li>✅ Built-in drag & drop</li>
                <li>✅ Smooth zoom & pan</li>
                <li>✅ Auto connection routing</li>
                <li>✅ Minimap & controls</li>
                <li>✅ ~400 lines less code</li>
              </ul>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="text-white font-semibold mb-2">Features</h3>
              <ul className="text-gray-300 space-y-1">
                <li>✅ Custom node components</li>
                <li>✅ Properties panel</li>
                <li>✅ Field type dropdown</li>
                <li>✅ Add button functionality</li>
                <li>✅ Reusable components</li>
              </ul>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="text-white font-semibold mb-2">Save Data</h3>
              {savedData ? (
                <div className="text-gray-300">
                  <p>Nodes: {savedData.nodes.length}</p>
                  <p>Connections: {savedData.connections.length}</p>
                  <p className="text-green-400 mt-1">✅ Saved successfully</p>
                </div>
              ) : (
                <p className="text-gray-400">Click &quot;Save&quot; to test data persistence</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-screen">
        <WorkflowBuilderReactFlow 
          initialNodes={sampleNodes}
          initialConnections={sampleConnections}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}