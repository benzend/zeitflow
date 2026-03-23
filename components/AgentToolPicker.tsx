/**
 * AgentToolPicker
 *
 * Tool selection UI for agent nodes.
 * Supports adding integration tools and custom API tools.
 */

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Wrench, Globe } from 'lucide-react';
import { AgentToolConfig } from '@/lib/workflow-types';
import { getAllIntegrationUIMetadata, IntegrationUIMetadata } from '@/lib/integrations/registry';

interface AgentToolPickerProps {
  tools: AgentToolConfig[];
  onChange: (tools: AgentToolConfig[]) => void;
}

let toolIdCounter = 0;
function generateToolId(): string {
  return `tool_${Date.now()}_${++toolIdCounter}`;
}

export default function AgentToolPicker({ tools, onChange }: AgentToolPickerProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMode, setAddMode] = useState<'integration' | 'custom_api' | null>(null);
  const [editingCustomTool, setEditingCustomTool] = useState<AgentToolConfig | null>(null);

  const integrations = getAllIntegrationUIMetadata();

  // Get integration IDs already added
  const addedIntegrationIds = new Set(
    tools.filter(t => t.type === 'integration').map(t => t.integrationId)
  );

  const addIntegrationTool = useCallback((integration: IntegrationUIMetadata) => {
    const newTool: AgentToolConfig = {
      id: generateToolId(),
      type: 'integration',
      integrationId: integration.id,
    };
    onChange([...tools, newTool]);
    setShowAddMenu(false);
    setAddMode(null);
  }, [tools, onChange]);

  const addCustomApiTool = useCallback((toolConfig: AgentToolConfig) => {
    onChange([...tools, { ...toolConfig, id: generateToolId() }]);
    setEditingCustomTool(null);
    setShowAddMenu(false);
    setAddMode(null);
  }, [tools, onChange]);

  const removeTool = useCallback((toolId: string) => {
    onChange(tools.filter(t => t.id !== toolId));
  }, [tools, onChange]);

  const getToolLabel = (tool: AgentToolConfig): string => {
    if (tool.type === 'integration') {
      const meta = integrations.find(i => i.id === tool.integrationId);
      return meta?.name || tool.integrationId || 'Unknown';
    }
    return tool.name || 'Custom API';
  };

  return (
    <div>
      {/* Tool list */}
      {tools.length > 0 && (
        <div className="space-y-2 mb-3">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="flex items-center justify-between bg-background-extra-light border border-border rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {tool.type === 'integration' ? (
                  <Wrench className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="text-xs text-foreground">{getToolLabel(tool)}</span>
                <span className="text-[10px] text-text-muted">
                  {tool.type === 'integration' ? 'Integration' : 'API'}
                </span>
              </div>
              <button
                onClick={() => removeTool(tool.id)}
                className="text-text-muted hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add tool button / menu */}
      {!showAddMenu ? (
        <button
          onClick={() => setShowAddMenu(true)}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tool
        </button>
      ) : addMode === null ? (
        <div className="bg-background-extra-light border border-border rounded-lg p-3 space-y-2">
          <p className="text-xs text-text-muted mb-2">Choose tool type:</p>
          <button
            onClick={() => setAddMode('integration')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground bg-background-light border border-border rounded-lg hover:border-accent transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-accent" />
            Integration Tool
            <span className="text-text-muted ml-auto">Email, Slack, HTTP, etc.</span>
          </button>
          <button
            onClick={() => {
              setAddMode('custom_api');
              setEditingCustomTool({
                id: '',
                type: 'custom_api',
                name: '',
                description: '',
                parameterSchema: '',
                endpoint: '',
                method: 'POST',
                headers: '',
              });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground bg-background-light border border-border rounded-lg hover:border-blue-400 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            Custom API Tool
            <span className="text-text-muted ml-auto">HTTP endpoint with schema</span>
          </button>
          <button
            onClick={() => { setShowAddMenu(false); setAddMode(null); }}
            className="text-xs text-text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : addMode === 'integration' ? (
        <div className="bg-background-extra-light border border-border rounded-lg p-3">
          <p className="text-xs text-text-muted mb-2">Select an integration:</p>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {integrations
              .filter(i => !addedIntegrationIds.has(i.id))
              .map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => addIntegrationTool(integration)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground bg-background-light border border-border rounded-lg hover:border-accent transition-colors"
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {integration.icon({ className: 'w-3.5 h-3.5' })}
                  </span>
                  {integration.name}
                  <span className="text-text-muted ml-auto text-[10px]">{integration.category}</span>
                </button>
              ))}
          </div>
          <button
            onClick={() => { setAddMode(null); }}
            className="mt-2 text-xs text-text-muted hover:text-foreground transition-colors"
          >
            Back
          </button>
        </div>
      ) : editingCustomTool ? (
        <div className="bg-background-extra-light border border-border rounded-lg p-3 space-y-3">
          <p className="text-xs text-text-muted mb-1">Define custom API tool:</p>

          <div>
            <label className="block text-[11px] text-foreground-light mb-1">Tool Name</label>
            <input
              type="text"
              value={editingCustomTool.name || ''}
              onChange={(e) => setEditingCustomTool({ ...editingCustomTool, name: e.target.value })}
              placeholder="e.g., search_database"
              className="w-full bg-background-light border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] text-foreground-light mb-1">Description</label>
            <input
              type="text"
              value={editingCustomTool.description || ''}
              onChange={(e) => setEditingCustomTool({ ...editingCustomTool, description: e.target.value })}
              placeholder="What this tool does (shown to the AI)"
              className="w-full bg-background-light border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] text-foreground-light mb-1">Endpoint URL</label>
            <input
              type="text"
              value={editingCustomTool.endpoint || ''}
              onChange={(e) => setEditingCustomTool({ ...editingCustomTool, endpoint: e.target.value })}
              placeholder="https://api.example.com/search"
              className="w-full bg-background-light border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-2">
            <div className="w-24">
              <label className="block text-[11px] text-foreground-light mb-1">Method</label>
              <select
                value={editingCustomTool.method || 'POST'}
                onChange={(e) => setEditingCustomTool({ ...editingCustomTool, method: e.target.value })}
                className="w-full bg-background-light border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-foreground-light mb-1">Headers (JSON)</label>
              <input
                type="text"
                value={editingCustomTool.headers || ''}
                onChange={(e) => setEditingCustomTool({ ...editingCustomTool, headers: e.target.value })}
                placeholder='{"Authorization": "Bearer ..."}'
                className="w-full bg-background-light border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-foreground-light mb-1">Parameter Schema (JSON Schema)</label>
            <textarea
              value={editingCustomTool.parameterSchema || ''}
              onChange={(e) => setEditingCustomTool({ ...editingCustomTool, parameterSchema: e.target.value })}
              placeholder={'{\n  "type": "object",\n  "properties": {\n    "query": { "type": "string" }\n  }\n}'}
              rows={4}
              className="w-full bg-background-light border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent resize-none font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (editingCustomTool.name && editingCustomTool.endpoint) {
                  addCustomApiTool(editingCustomTool);
                }
              }}
              disabled={!editingCustomTool.name || !editingCustomTool.endpoint}
              className="px-3 py-1.5 text-xs bg-accent text-white rounded-md hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Tool
            </button>
            <button
              onClick={() => { setEditingCustomTool(null); setAddMode(null); }}
              className="text-xs text-text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
