import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { formatConditionCompact } from '@/lib/integrations/condition-helpers';
import { ConditionConfig } from '@/lib/integrations/definitions/condition';
import { AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface ConditionNodeProps extends NodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

/**
 * ConditionNode - Diamond-shaped node with two output handles
 *
 * This node has:
 * - One input handle (left)
 * - Two output handles (right side):
 *   - "true" handle on top-right
 *   - "false" handle on bottom-right
 */
const ConditionNode = memo(({ data, selected }: ConditionNodeProps) => {
  const color = selected ? 'var(--accent)' : 'var(--foreground)';
  const borderColor = selected ? 'var(--accent)' : 'var(--border)';
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;

  // Extract condition config from node data
  const conditionConfig = data.conditionConfig as ConditionConfig | undefined;
  const conditionPreview = conditionConfig ? formatConditionCompact(conditionConfig) : 'Configure...';

  return (
    <div
      className="relative bg-background-light border rounded-lg px-4 py-3 min-w-[160px]"
      style={{
        borderColor,
      }}
    >
      {hasInvalidVars && (
        <Tooltip title={`Invalid variables: ${invalidVariables.map(v => `{{${v}}}`).join(', ')}`} position="top" theme="dark" size="small">
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center cursor-help z-10">
            <AlertTriangle className="w-3 h-3 text-white" />
          </div>
        </Tooltip>
      )}
      {/* Input handle on left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ left: '-4px', top: '50%' }}
      />

      {/* True output handle on top-right with label */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{
          top: '30%',
          background: '#4CAF50',
        }}
      />
      <span
        className="absolute text-[10px] font-bold pointer-events-none select-none"
        style={{ top: 'calc(30% - 6px)', right: '-20px', color: '#4CAF50' }}
      >
        T
      </span>

      {/* False output handle on bottom-right with label */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{
          top: '70%',
          background: '#F44336',
        }}
      />
      <span
        className="absolute text-[10px] font-bold pointer-events-none select-none"
        style={{ top: 'calc(70% - 6px)', right: '-20px', color: '#F44336' }}
      >
        F
      </span>

      {/* Node content */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 h-4 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Diamond shape */}
            <path
              d="M7 1 L13 7 L7 13 L1 7 Z"
              stroke={color}
              strokeWidth="0.5"
              fill="none"
            />
            {/* Question mark */}
            <path
              d="M5.5 5.5 Q5.5 4 7 4 Q8.5 4 8.5 5.5 Q8.5 6.5 7 6.8 L7 8"
              stroke={color}
              strokeWidth="0.5"
              fill="none"
            />
            <circle cx="7" cy="9.5" r="0.3" fill={color} />
          </svg>
        </div>
        <span className="text-xs text-foreground font-medium">{data.label}</span>
      </div>

      {/* Condition preview */}
      <div
        className={`text-[10px] ${
          conditionConfig ? 'text-foreground' : 'text-text-muted'
        }`}
        style={{
          wordBreak: 'break-word',
          lineHeight: '1.3',
        }}
      >
        {conditionPreview}
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
export default ConditionNode;
