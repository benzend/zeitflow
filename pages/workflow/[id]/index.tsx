import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/Button";
import { ButtonGroup } from "@/components/ButtonGroup";
import ThemeToggle from "@/components/ThemeToggle";
import WorkflowBuilderReactFlow, { WorkflowBuilderRef } from "@/components/WorkflowBuilderReactFlow";
import { NodeData, Connection } from '@/lib/workflow-types';
import { areWorkflowStatesEqual } from '@/lib/workflow-comparison';
import WorkflowEditSkeleton from "@/components/WorkflowEditSkeleton";
import { parseNodeConfigsFromJSON, serializeNode } from '@/lib/node-utils';
import { NodeType } from '@/lib/node-registry';
import SaveAsTemplateModal from "@/components/SaveAsTemplateModal";

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const workflowBuilderRef = useRef<WorkflowBuilderRef>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const originalNodes = useRef<NodeData[]>([]);
  const originalConnections = useRef<Connection[]>([]);
  const currentNodes = useRef<NodeData[]>([]);
  const currentConnections = useRef<Connection[]>([]);

  const fetchWorkflow = async (workflowId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/${workflowId}`);
      const data = await response.json();

      if (data.success) {
        setWorkflow(data.workflow);

        // Parse nodes from database format
        const parsedNodes = data.nodes.map((node: {
          id: string;
          type: string;
          positionX: number;
          positionY: number;
          label: string;
          config: string;
          entryType?: string;
        }) => {
          // Use utility function to parse all configs automatically
          const configs = parseNodeConfigsFromJSON(node.config);

          const parsedNode = {
            id: node.id,
            type: node.type as NodeType,
            x: node.positionX,
            y: node.positionY,
            label: node.label,
            entryType: node.entryType,
            ...configs // Spread all configs (fields, aiConfig, schedulerConfig, etc.)
          };

          return parsedNode;
        });

        // Parse connections from database format
        const parsedConnections = data.connections.map((conn: {
          fromNodeId: string;
          toNodeId: string;
          sourceHandle?: string;
          targetHandle?: string;
        }) => ({
          from: conn.fromNodeId,
          to: conn.toNodeId,
          sourceHandle: conn.sourceHandle,
          targetHandle: conn.targetHandle,
        }));

        setNodes(parsedNodes);
        setConnections(parsedConnections);

        // Store original and current state for change detection
        originalNodes.current = [...parsedNodes];
        originalConnections.current = [...parsedConnections];
        currentNodes.current = [...parsedNodes];
        currentConnections.current = [...parsedConnections];
        setHasUnsavedChanges(false);
      } else {
        setError(data.message || "Failed to fetch workflow");
      }
    } catch (err) {
      setError("An error occurred while fetching the workflow");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedNodes: NodeData[], updatedConnections: Connection[]) => {
    if (!workflow) return;

    try {
      setSaving(true);

      // Use utility function to serialize nodes - handles all configs automatically
      const serializableNodes = updatedNodes.map(node => serializeNode(node));

      const response = await fetch(`/api/workflow/${workflow.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: serializableNodes,
          connections: updatedConnections,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNodes(updatedNodes);
        setConnections(updatedConnections);
        setLastSaved(new Date());

        // Update original and current state to reflect saved changes
        originalNodes.current = [...updatedNodes];
        originalConnections.current = [...updatedConnections];
        currentNodes.current = [...updatedNodes];
        currentConnections.current = [...updatedConnections];
        setHasUnsavedChanges(false);
        setError("");
      } else {
        setError(data.message || "Failed to save workflow");
      }
    } catch (err) {
      setError("An error occurred while saving the workflow");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const triggerSave = () => {
    if (workflowBuilderRef.current) {
      workflowBuilderRef.current.save();
    }
  };

  // Check for changes using debounced comparison
  const checkForChanges = useCallback(() => {
    if (originalNodes.current.length === 0) return;

    const hasChanges = !areWorkflowStatesEqual(
      originalNodes.current,
      originalConnections.current,
      currentNodes.current,
      currentConnections.current
    );

    setHasUnsavedChanges(hasChanges);
    if (hasChanges) {
      triggerSave();
    }
  }, []);

  // Debounced change detection
  const debouncedCheckForChanges = useRef<NodeJS.Timeout | null>(null);

  const triggerChangeCheck = useCallback(() => {
    if (debouncedCheckForChanges.current) {
      clearTimeout(debouncedCheckForChanges.current);
    }
    debouncedCheckForChanges.current = setTimeout(checkForChanges, 500);
  }, [checkForChanges]);

  // Handle workflow changes from WorkflowBuilder
  const handleWorkflowChange = useCallback((updatedNodes: NodeData[], updatedConnections: Connection[]) => {
    // Store current state for comparison
    currentNodes.current = updatedNodes;
    currentConnections.current = updatedConnections;

    // Trigger debounced change detection
    triggerChangeCheck();
  }, [triggerChangeCheck]);

  // Handle saving workflow as template
  const handleSaveAsTemplate = async (templateData: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    icon: string;
    visibility: 'private' | 'public';
    instructions: string;
  }) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...templateData,
          sourceWorkflowId: workflow?.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to save template');
      }

      // Success - modal will close automatically
    } catch (err: any) {
      throw new Error(err.message || 'Failed to save template');
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (id && !Array.isArray(id)) {
      fetchWorkflow(parseInt(id, 10));
    }
  }, [session, status, router, id]);

  // Navigation protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handleRouteChange = () => {
      if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.events.emit('routeChangeError');
        throw 'Route change aborted';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
      if (debouncedCheckForChanges.current) {
        clearTimeout(debouncedCheckForChanges.current);
      }
    };
  }, [hasUnsavedChanges, router]);



  if (status === "loading" || loading) {
    return <WorkflowEditSkeleton />;
  }

  if (error && !workflow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-error text-lg mb-4">{error}</div>
          <Button
            href="/workflows"
            variant="tertiary"
            className="!bg-transparent !p-0 underline hover:text-primary-light"
          >
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>{workflow?.name || "Workflow"} - ZeitFlow</title>
        <meta name="description" content="Edit your automation workflow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 bg-background-light border-b border-border z-20 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => {
              if (hasUnsavedChanges) {
                if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                  router.push('/workflows');
                }
              } else {
                router.push('/workflows');
              }
            }}
            className="!bg-transparent !p-0 hover:text-primary transition-colors"
          >
            <ArrowLeft className="text-foreground p-1" />
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-foreground font-semibold">{workflow?.name}</h1>
            {workflow?.description && (
              <p className="text-sm text-text-muted">{workflow.description}</p>
            )}
          </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />

              <ButtonGroup>
              <Button
                variant="secondary"
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                      router.push(`/workflow/${workflow?.id}/history`);
                    }
                  } else {
                    router.push(`/workflow/${workflow?.id}/history`);
                  }
                }}
              >
                History
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                      router.push(`/workflow/${workflow?.id}/execution`);
                    }
                  } else {
                    router.push(`/workflow/${workflow?.id}/execution`);
                  }
                }}
              >
                Run
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowSaveAsTemplateModal(true)}
              >
                Save as Template
              </Button>
            </ButtonGroup>

            {error && (
              <span className="text-sm text-error">
                {error}
              </span>
            )}
            <div className="flex items-center gap-2 w-20">
              <div className={`w-2 h-2 rounded-full ${
                saving ? 'bg-warning' :
                hasUnsavedChanges ? 'bg-warning' :
                'bg-success'
              }`} />
              <span className="text-sm text-foreground">
                {saving ? 'Saving...' :
                 hasUnsavedChanges ? 'Unsaved' :
                 'Saved'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Workflow Builder */}
      <div className="pt-16">
        <WorkflowBuilderReactFlow
          ref={workflowBuilderRef}
          workflowId={id ? parseInt(id as string, 10) : undefined}
          workflowName={workflow?.name}
          initialNodes={nodes}
          initialConnections={connections}
          onSave={handleSave}
          onChange={handleWorkflowChange}
        />
      </div>

      {/* Save as Template Modal */}
      <SaveAsTemplateModal
        isOpen={showSaveAsTemplateModal}
        onClose={() => setShowSaveAsTemplateModal(false)}
        workflowId={workflow?.id || 0}
        workflowName={workflow?.name || ''}
        onSave={handleSaveAsTemplate}
      />
    </div>
  );
}
