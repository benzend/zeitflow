import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { AlertTriangle, Bot } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface AgentNodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const AgentNode = memo(({ data, selected }: AgentNodeProps) => {
  const color = selected ? 'var(--accent)' : 'var(--foreground)';
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;
  const toolCount = (data.agentConfig as { tools?: unknown[] } | undefined)?.tools?.length || 0;

  return (
    <div className={`px-3 py-2 bg-background-light border rounded-lg ${selected ? 'border-accent' : 'border-border'} min-w-[89px] ${hasInvalidVars ? 'border-yellow-500/50' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center justify-center">
        <div className="absolute left-3 top-2">
          <Bot className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-xs text-foreground ml-5 whitespace-nowrap">{data.label}</span>
        {toolCount > 0 && (
          <span className="ml-1.5 text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
            {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
          </span>
        )}
        {hasInvalidVars && (
          <Tooltip title={`Invalid variables: ${invalidVariables.map(v => `{{${v}}}`).join(', ')}`} position="top" theme="dark" size="small">
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center cursor-help">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
});

AgentNode.displayName = 'AgentNode';
export default AgentNode;
