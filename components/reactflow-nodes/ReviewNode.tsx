import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface ReviewNodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const ReviewNode = memo(({ data, selected }: ReviewNodeProps) => {
  const color = selected ? 'var(--accent)' : 'var(--foreground)';
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;

  return (
    <div className={`px-3 py-2 bg-background-light border rounded-lg ${selected ? 'border-accent' : 'border-border'} min-w-[89px] ${hasInvalidVars ? 'border-yellow-500/50' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="flex items-center justify-center">
        <div className="absolute left-2.5 top-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 15">
            <circle cx="7" cy="8" r="6.75" stroke={color} strokeWidth="0.5" />
            <line stroke={color} x1="4.35355" x2="7.35355" y1="6.64645" y2="9.64645" />
            <line stroke={color} x1="6.60532" x2="13.6053" y1="9.69303" y2="0.69303" />
          </svg>
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

ReviewNode.displayName = 'ReviewNode';
export default ReviewNode;
