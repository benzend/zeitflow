import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ReactFlowNodeData } from '@/lib/reactflow-types';

interface ReviewNodeProps {
  data: ReactFlowNodeData;
  selected: boolean;
}

const ReviewNode = memo(({ data, selected }: ReviewNodeProps) => {
  return (
    <div className={`px-3 py-2 bg-[#424242] rounded-lg relative min-w-[89px] ${selected ? 'ring-2 ring-green-400' : ''}`}>
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center justify-center">
        <div className="absolute left-2.5 top-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 15">
            <circle cx="7" cy="8" r="6.75" stroke="#11FF00" strokeWidth="0.5" />
            <line stroke="#11FF00" x1="4.35355" x2="7.35355" y1="6.64645" y2="9.64645" />
            <line stroke="#11FF00" x1="6.60532" x2="13.6053" y1="9.69303" y2="0.69303" />
          </svg>
        </div>
        <span className="text-xs text-white ml-5 whitespace-nowrap">{data.label}</span>
      </div>
    </div>
  );
});

ReviewNode.displayName = 'ReviewNode';
export default ReviewNode;