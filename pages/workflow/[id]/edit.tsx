import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import WorkflowBuilderReactFlow, { WorkflowBuilderRef } from "@/components/WorkflowBuilderReactFlow";
import { NodeData, Connection } from '@/lib/workflow-types';

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
          let config: {
            fields?: unknown[];
            aiConfig?: unknown;
            schedulerConfig?: unknown;
            reviewConfig?: unknown;
          } = {};
          try {
            config = JSON.parse(node.config || '{}');
          } catch (error) {
            console.error('Failed to parse node config:', error, node.config);
            config = {};
          }
           return {
             id: node.id,
             type: node.type as 'entry' | 'ai' | 'scheduler' | 'review' | 'slack',
             x: node.positionX,
             y: node.positionY,
             label: node.label,
             fields: config.fields,
             aiConfig: config.aiConfig,
             schedulerConfig: config.schedulerConfig,
             reviewConfig: config.reviewConfig,
             entryType: node.entryType
           };
        });

        // Parse connections from database format
        const parsedConnections = data.connections.map((conn: {
          fromNodeId: string;
          toNodeId: string;
        }) => ({
          from: conn.fromNodeId,
          to: conn.toNodeId,
        }));

        setNodes(parsedNodes);
        setConnections(parsedConnections);
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

      // Create serializable copies to avoid circular references
      const serializableNodes = updatedNodes.map(node => ({
        id: node.id,
        type: node.type,
        x: node.x,
        y: node.y,
        label: node.label,
        fields: node.fields,
        entryType: node.entryType,
        aiConfig: node.aiConfig,
        schedulerConfig: node.schedulerConfig,
        reviewConfig: node.reviewConfig
      }));

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-lg">Loading workflow...</div>
      </div>
    );
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
        <title>{workflow?.name || "Workflow"} - jjoist</title>
        <meta name="description" content="Edit your automation workflow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 bg-background-light border-b border-border z-20 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <Button href={`/workflow/${workflow?.id}`} variant="tertiary" className="!bg-transparent !p-0">
            <ArrowLeft className="text-foreground hover:text-primary transition-colors p-1" />
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-foreground font-semibold">{workflow?.name}</h1>
            {workflow?.description && (
              <p className="text-sm text-text-muted">{workflow.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {lastSaved && (
              <span className="text-sm text-text-muted">
                Saved at {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {error && (
              <span className="text-sm text-error">
                {error}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${saving ? 'bg-warning' : 'bg-success'}`} />
              <span className="text-sm text-foreground">
                {saving ? 'Saving...' : 'Saved'}
              </span>
            </div>

            <Button
              onClick={triggerSave}
              variant="primary"
              size="sm"
              className="text-xs"
            >
              Save
            </Button>

          </div>
        </div>
      </div>

      {/* Workflow Builder */}
      <div className="pt-16">
        <WorkflowBuilderReactFlow
          ref={workflowBuilderRef}
          initialNodes={nodes}
          initialConnections={connections}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}