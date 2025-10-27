import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';

interface EndpointNodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const EndpointNode = memo(({ data, selected }: EndpointNodeProps) => {
  const color = selected ? '#11FF00' : '#FFFFFF';

  return (
    <div className={`px-3 py-2 bg-[#424242] border rounded-lg ${selected ? 'border-green-400' : 'border-gray-200'} min-w-[98px]`}>
      <Handle type="source" position={Position.Right} />
      
      <div className="flex items-center justify-between">
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
        <span className="text-xs text-white whitespace-nowrap">{data.label}</span>
      </div>
      
      <div className="text-xs text-gray-400 mt-1 text-center">Entry</div>
    </div>
  );
});

EndpointNode.displayName = 'EndpointNode';
export default EndpointNode;