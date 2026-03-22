import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface SMSNodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const SMSNode = memo(({ data, selected }: SMSNodeProps) => {
  const color = selected ? 'var(--accent)' : 'var(--foreground)';
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;

  return (
    <div className={`px-3 py-2 bg-background-light border rounded-lg ${selected ? 'border-accent' : 'border-border'} min-w-[95px] ${hasInvalidVars ? 'border-yellow-500/50' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Message bubble */}
            <rect x="0.5" y="0.5" width="13" height="9" rx="1.5" stroke={color} strokeWidth="0.5" fill="none" />
            {/* Message lines */}
            <line x1="2.5" y1="3" x2="11.5" y2="3" stroke={color} strokeWidth="0.5" />
            <line x1="2.5" y1="5" x2="9.5" y2="5" stroke={color} strokeWidth="0.5" />
            {/* Tail of message bubble */}
            <path d="M4 9.5 L3 12 L5.5 9.5" stroke={color} strokeWidth="0.5" fill="none" />
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

SMSNode.displayName = 'SMSNode';
export default SMSNode;
