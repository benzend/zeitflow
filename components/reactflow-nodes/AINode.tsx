import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';

interface AINodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const AINode = memo(({ data, selected }: AINodeProps) => {
  const color = selected ? '#11FF00' : '#FFFFFF';

  return (
    <div className={`px-3 py-2 bg-[#424242] rounded-lg relative min-w-[89px] ${selected ? 'ring-2 ring-green-400' : ''}`}>
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
        <span className="text-xs text-white ml-5 whitespace-nowrap">{data.label}</span>
      </div>
    </div>
  );
});

AINode.displayName = 'AINode';
export default AINode;