import { History, Play, Trash2 } from 'lucide-react';
import { Button } from "@/components/Button";

export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowCardProps {
  workflow: Workflow;
  onDelete: (id: number) => void;
}

export function WorkflowCard({ workflow, onDelete }: WorkflowCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden">
      <div
        className="p-4 cursor-pointer h-full hover:bg-background-extra-light transition-colors"
        onClick={() => window.location.href = `/workflow/${workflow.id}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-md text-foreground font-semibold mb-2">{workflow.name}</h3>
            {workflow.description && (
              <p className="text-sm text-foreground-light mb-3">{workflow.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                workflow.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : workflow.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {workflow.status}
              </span>
              <span className="text-xs text-gray-500">
                Updated {new Date(workflow.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center p-4 border-t border-primary/10">
        <div className="flex gap-2">
          <Button
            href={`/workflow/${workflow.id}/history`}
            variant="tertiary"
            size="sm"
          >
            <History size={14} />
            History
          </Button>
          <Button variant="primary" size="sm" href={`/workflow/${workflow.id}/execution`}>
            <Play size={14} />
            Run
          </Button>
        </div>
        <Button
          onClick={() => onDelete(workflow.id)}
          variant="tertiary"
          className="!bg-transparent !p-1 text-red-500 hover:text-red-700"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}

export function WorkflowSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden animate-pulse">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-5 w-40 bg-primary/20 rounded mb-2"></div>
            <div className="h-4 w-56 bg-primary/20 rounded mb-3"></div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 bg-primary/20 rounded"></div>
              <div className="h-4 w-24 bg-primary/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center p-4 border-t border-primary/10">
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-primary/20 rounded"></div>
          <div className="h-8 w-14 bg-primary/20 rounded"></div>
          <div className="h-8 w-16 bg-primary/20 rounded"></div>
        </div>
        <div className="h-8 w-8 bg-primary/20 rounded"></div>
      </div>
    </div>
  );
}
