import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface SlackNodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const SlackNode = memo(({ data, selected }: SlackNodeProps) => {
  const color = selected ? 'var(--accent)' : 'var(--foreground)';
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;

  return (
    <div className={`px-3 py-2 bg-background-light border rounded-lg ${selected ? 'border-accent' : 'border-border'} min-w-[92px] ${hasInvalidVars ? 'border-yellow-500/50' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-2">
        <div className="w-4 h-3 flex-shrink-0">
          <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="5.5" width="2" height="6" rx="0.5" fill={color} />
            <rect x="5" y="2.5" width="2" height="9" rx="0.5" fill={color} />
            <rect x="8" y="4" width="2" height="7.5" rx="0.5" fill={color} />
            <rect x="11" y="6.5" width="1.5" height="5" rx="0.5" fill={color} />
          </svg>
        </div>
        <span className="text-xs text-foreground whitespace-nowrap">{data.label}</span>
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

SlackNode.displayName = 'SlackNode';
export default SlackNode;