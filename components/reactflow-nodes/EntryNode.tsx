import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';
import { AlertTriangle } from 'lucide-react';
import { Tooltip } from 'react-tippy';

interface EntryNodeProps {
  data: ReactFlowNodeData & {
    onRunClick?: (nodeId: string) => void;
  };
  selected: boolean;
}

const getEntryTypeLabel = (entryType: string) => {
  switch (entryType) {
    case 'endpoint':
      return 'Endpoint';
    case 'webhook':
      return 'Webhook';
    case 'api':
      return 'API';
    case 'form':
      return 'Form';
    case 'trigger':
      return 'Trigger';
    default:
      return 'Entry';
  }
};

const EntryNode = memo(({ data, selected }: EntryNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const color = selected ? 'var(--accent)' : 'var(--foreground)';
  const invalidVariables = data.invalidVariables as string[] | undefined;
  const hasInvalidVars = invalidVariables && invalidVariables.length > 0;

  return (
    <div
      className={`px-3 py-2 bg-background-light border rounded-lg ${selected ? 'border-accent' : 'border-border'} min-w-[98px] relative ${hasInvalidVars ? 'border-yellow-500/50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && data.onRunClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onRunClick!(data.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full
                     flex items-center justify-center shadow-md
                     hover:bg-success/80 transition-colors z-10"
          title="Run workflow from this entry point"
        >
          <Play size={12} fill="currentColor" className="text-background ml-0.5" />
        </button>
      )}
      {hasInvalidVars && (
        <Tooltip title={`Invalid variables: ${invalidVariables.map(v => `{{${v}}}`).join(', ')}`} position="top" theme="dark" size="small">
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center cursor-help">
            <AlertTriangle className="w-3 h-3 text-white" />
          </div>
        </Tooltip>
      )}
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-2">
        <div className="w-4 h-3">
          <svg className="w-full h-full" fill="none" viewBox="0 0 15 13">
            <circle cx="13" cy="2" r="1.75" stroke={color} strokeWidth="0.5" />
            <circle cx="10" cy="10" r="1.75" stroke={color} strokeWidth="0.5" />
            <circle cx="5" cy="3" r="1.75" stroke={color} strokeWidth="0.5" />
            <circle cx="2" cy="11" r="1.75" stroke={color} strokeWidth="0.5" />
            <line stroke={color} strokeWidth="0.5" x1="2.76788" x2="4.76788" y1="9.90715" y2="4.90715" />
            <line stroke={color} strokeWidth="0.5" x1="10.7679" x2="12.7679" y1="8.90715" y2="3.90715" />
            <line stroke={color} strokeWidth="0.5" x1="9.13017" x2="6.43759" y1="8.96121" y2="4.29752" />
          </svg>
        </div>
        <span className="text-xs text-foreground whitespace-nowrap">{data.label}</span>
      </div>

        <div className="text-xs text-text-muted mt-1 text-center">
          {getEntryTypeLabel(data.entryType || 'entry')}
        </div>
    </div>
  );
});

EntryNode.displayName = 'EntryNode';
export default EntryNode;
