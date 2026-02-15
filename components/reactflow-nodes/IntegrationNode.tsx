/**
 * IntegrationNode
 *
 * Generic React Flow node component that renders any integration
 * using metadata from the integration registry.
 *
 * This provides a unified node appearance while maintaining
 * integration-specific icons and colors.
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { getIntegrationUIMetadata } from '@/lib/integrations/registry';
import { AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface IntegrationNodeProps extends NodeProps {
  data: ReactFlowNodeData & { integrationId?: string };
  selected: boolean;
}

/**
 * IntegrationNode component
 *
 * Renders a workflow node for any registered integration.
 * Falls back to a generic appearance if integration is not found.
 */
const IntegrationNode = memo(({ data, selected }: IntegrationNodeProps) => {
  // Get integration metadata - use data.type as integrationId
  const integrationId = data.integrationId || data.type;
  const metadata = getIntegrationUIMetadata(integrationId);

  // Determine colors
  const borderColor = selected ? 'var(--success)' : 'var(--border)';
  const iconColor = selected ? 'var(--success)' : 'var(--foreground)';
  
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;

  // Render icon from metadata or fallback
  const renderIcon = () => {
    if (metadata?.icon) {
      return metadata.icon({ className: 'w-4 h-3 flex-shrink-0', color: iconColor });
    }

    // Fallback generic icon (puzzle piece)
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-3 flex-shrink-0"
      >
        <rect
          x="0.5"
          y="0.5"
          width="13"
          height="13"
          rx="2"
          stroke={iconColor}
          strokeWidth="0.5"
          fill="none"
        />
        <circle cx="7" cy="7" r="3" stroke={iconColor} strokeWidth="0.5" fill="none" />
      </svg>
    );
  };

  return (
    <div
      className={`px-3 py-2 bg-background-light border rounded-lg min-w-[95px] ${hasInvalidVars ? 'border-yellow-500/50' : ''}`}
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-2">
        <div className="w-4 h-3 flex-shrink-0">{renderIcon()}</div>
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

IntegrationNode.displayName = 'IntegrationNode';
export default IntegrationNode;

/**
 * Factory function to create node types mapping for React Flow
 *
 * Usage:
 * ```typescript
 * const nodeTypes = {
 *   ...createIntegrationNodeTypes(['email', 'slack', 'sms']),
 *   entry: EntryNode,
 *   ai: AINode,
 *   // etc.
 * };
 * ```
 */
export function createIntegrationNodeTypes(integrationIds: string[]): Record<string, typeof IntegrationNode> {
  return integrationIds.reduce(
    (acc, id) => {
      acc[id] = IntegrationNode;
      return acc;
    },
    {} as Record<string, typeof IntegrationNode>
  );
}
