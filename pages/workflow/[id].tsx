import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ArrowLeft } from 'lucide-react';
import Link from "next/link";
import WorkflowBuilderReactFlow from "@/components/WorkflowBuilderReactFlow";
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
          const config = JSON.parse(node.config || '{}');
          return {
            id: node.id,
            type: node.type,
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
      const response = await fetch(`/api/workflow/${workflow.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: updatedNodes,
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2b2b2b] to-[#3c3c3c] flex items-center justify-center">
        <div className="text-white text-lg">Loading workflow...</div>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2b2b2b] to-[#3c3c3c] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <Link
            href="/workflows"
            className="text-primary underline hover:text-primary-light transition duration-200"
          >
            Back to Workflows
          </Link>
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
      <div className="absolute top-0 left-0 right-0 bg-[#424242] border-b border-[#535353] z-20 h-16">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/workflows"
              className="text-white hover:text-[#a3e635] transition-colors p-1"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-white font-semibold">{workflow?.name}</h1>
              {workflow?.description && (
                <p className="text-sm text-gray-400">{workflow.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-sm text-gray-400">
                Saved at {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {error && (
              <span className="text-sm text-red-400">
                {error}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${saving ? 'bg-yellow-400' : 'bg-green-400'}`} />
              <span className="text-sm text-white">
                {saving ? 'Saving...' : 'Saved'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Builder */}
      <div className="pt-16">
        <WorkflowBuilderReactFlow
          initialNodes={nodes}
          initialConnections={connections}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
