import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface TelegramNodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const TelegramNode = memo(({ data, selected }: TelegramNodeProps) => {
  const color = selected ? 'var(--accent)' : 'var(--foreground)';
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;

  return (
    <div className={`px-3 py-2 bg-background-light border rounded-lg ${selected ? 'border-accent' : 'border-border'} min-w-[95px] ${hasInvalidVars ? 'border-yellow-500/50' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.84 14.22 15.51 15.99C15.37 16.74 15.09 16.99 14.83 17.02C14.25 17.07 13.81 16.64 13.25 16.27C12.37 15.69 11.87 15.33 11.02 14.77C10.03 14.12 10.67 13.76 11.24 13.18C11.39 13.03 13.95 10.7 14 10.49C14.0069 10.4582 14.0054 10.4252 13.9958 10.3941C13.9861 10.363 13.9687 10.3349 13.945 10.3122C13.9214 10.2895 13.8923 10.273 13.8603 10.2641C13.8284 10.2553 13.7947 10.2543 13.7623 10.2612C13.67 10.28 12.03 11.38 8.84 13.55C8.44 13.82 8.08 13.95 7.76 13.95C7.41 13.95 6.74 13.75 6.24 13.59C5.62 13.4 5.13 13.3 5.18 12.96C5.2 12.79 5.44 12.61 5.89 12.43C9.3 10.94 11.57 9.94 12.69 9.44C15.93 8.05 16.55 7.83 16.96 7.83C17.04 7.83 17.23 7.85 17.35 7.95C17.45 8.03 17.48 8.14 17.49 8.22C17.48 8.28 17.5 8.45 17.49 8.8H16.64Z"
              fill={color}
            />
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

TelegramNode.displayName = 'TelegramNode';
export default TelegramNode;
