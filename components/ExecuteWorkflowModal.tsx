import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { Button } from "./Button";
import { Field } from '@/lib/workflow-types';

interface EntryNodeData {
  id: string;
  label: string;
  entryType?: string;
  fields?: Field[];
}

interface RecentInput {
  executionId: number;
  inputData: Record<string, string>;
  startedAt: string;
  status: string;
}

interface ExecuteWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: number;
  workflowName: string;
  entryNode: EntryNodeData;
}

export default function ExecuteWorkflowModal({
  isOpen,
  onClose,
  workflowId,
  workflowName,
  entryNode,
}: ExecuteWorkflowModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{success: boolean, executionId?: number, error?: string} | null>(null);
  const [recentInputs, setRecentInputs] = useState<RecentInput[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft from localStorage when modal opens
  useEffect(() => {
    if (!isOpen || !workflowId || !entryNode.id) return;
    const key = `workflow-draft-${workflowId}-${entryNode.id}`;
    const draft = localStorage.getItem(key);
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [isOpen, workflowId, entryNode.id]);

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    if (!isOpen || !workflowId || !entryNode.id || Object.keys(formData).length === 0) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const key = `workflow-draft-${workflowId}-${entryNode.id}`;
      localStorage.setItem(key, JSON.stringify(formData));
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, workflowId, entryNode.id, isOpen]);

  // Fetch recent inputs when modal opens
  const fetchRecentInputs = useCallback(async () => {
    if (!workflowId) return;
    try {
      const response = await fetch(`/api/workflow/${workflowId}/recent-inputs`);
      const data = await response.json();
      if (data.success) {
        setRecentInputs(data.recentInputs);
      }
    } catch (error) {
      console.error('Failed to fetch recent inputs:', error);
    }
  }, [workflowId]);

  useEffect(() => {
    if (isOpen && workflowId) {
      fetchRecentInputs();
    }
  }, [isOpen, workflowId, fetchRecentInputs]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExecutionResult(null);
    }
  }, [isOpen]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowId) return;

    setExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch(`/api/workflow/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputData: formData, entryNodeId: entryNode.id }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Clear localStorage draft after successful execution
        localStorage.removeItem(`workflow-draft-${workflowId}-${entryNode.id}`);
        setExecutionResult({ success: true, executionId: result.executionId });
      } else {
        setExecutionResult({ success: false, error: result.error || 'Failed to execute workflow' });
      }
    } catch {
      setExecutionResult({ success: false, error: 'An error occurred while executing the workflow' });
    } finally {
      setExecuting(false);
    }
  };

  const handleViewExecution = () => {
    if (executionResult?.executionId) {
      router.push(`/workflow/execution/${executionResult.executionId}`);
    }
  };

  const renderFieldInput = (field: Field) => {
    const value = formData[field.key] || '';

    switch (field.type) {
      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            placeholder={field.key}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            placeholder={field.key}
          />
        );
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            placeholder={field.key}
            rows={4}
          />
        );
      default:
        return (
          <input
            type="text"
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            placeholder={field.key}
          />
        );
    }
  };

  if (!isOpen) return null;

  const isFormEntry = entryNode.entryType === 'form';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-light rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Execute Workflow
              </h2>
              <p className="text-sm text-foreground-light mt-1">{workflowName}</p>
            </div>
            <Button
              onClick={onClose}
              variant="tertiary"
              className="!p-2 !bg-transparent hover:!bg-surface-hover"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </Button>
          </div>

          {executionResult?.success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Workflow Started</h3>
              <p className="text-foreground-light text-sm mb-4">
                Execution ID: {executionResult.executionId}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleViewExecution}
                  variant="primary"
                  className="flex-1"
                >
                  View Execution
                </Button>
              </div>
            </div>
          ) : isFormEntry ? (
            <div>
              {recentInputs.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground-light mb-1">
                    Load from recent execution
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const input = recentInputs.find(r => r.executionId.toString() === e.target.value);
                      if (input?.inputData) {
                        setFormData(input.inputData);
                      }
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  >
                    <option value="">Select a previous run...</option>
                    {recentInputs.map(input => (
                      <option key={input.executionId} value={input.executionId}>
                        {new Date(input.startedAt).toLocaleString()} - {input.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {entryNode.fields?.map((field: Field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="block text-sm font-medium text-foreground-light mb-1">
                      {field.key}
                    </label>
                    {renderFieldInput(field)}
                  </div>
                ))}

                {executionResult?.error && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-md">
                    <p className="text-sm text-error">{executionResult.error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={executing}
                    className="flex-1"
                  >
                    {executing ? 'Executing...' : 'Execute'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-foreground-light mb-4">
                This entry node is configured for API/Webhook access.
              </p>
              <Button
                onClick={() => router.push(`/workflow/${workflowId}/execution`)}
                variant="primary"
              >
                View API Details
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
