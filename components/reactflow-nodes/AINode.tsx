import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface AINodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const AINode = memo(({ data, selected }: AINodeProps) => {
  const color = selected ? 'var(--success)' : 'var(--foreground)';
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;

  return (
    <div className={`px-3 py-2 bg-background-light border rounded-lg ${selected ? 'border-success' : 'border-border'} min-w-[89px] ${hasInvalidVars ? 'border-yellow-500/50' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center justify-center">
        <div className="absolute left-3 top-2">
          <p className="text-xs" style={{ color }}>AI</p>
          <div className="h-0 mt-0.5 w-1">
            <svg className="block w-full h-full" fill="none" viewBox="0 0 4 1">
              <line stroke={color} strokeWidth="0.5" x2="4" y1="0.75" y2="0.75" />
            </svg>
          </div>
        </div>
        <span className="text-xs text-foreground ml-5 whitespace-nowrap">{data.label}</span>
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

AINode.displayName = 'AINode';
export default AINode;
