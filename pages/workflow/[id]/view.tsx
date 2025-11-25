import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { NodeData } from '@/lib/workflow-types';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = {
    'Content-Type': 'application/json',
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
          };
        });

        setNodes(parsedNodes);
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

  const entryNode = nodes.find(n => n.type === 'entry');



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
        <meta name="description" content="View your automation workflow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex justify-center items-center min-h-screen">
        {entryNode ? (
          <div className="flex justify-center items-center min-h-screen">
          {entryNode.type === 'entry' ? (
            <div className="flex justify-center items-center min-h-screen">
              <div className="max-w-md w-full">
                <p>
                  URL: {window.location.origin}/api/workflow/{workflow.id}/execute
                </p>
                <p>
                  Method: &apos;POST&apos;
                </p>
                <p>
                  Headers: {JSON.stringify(authHeaders)}
                </p>
                <p>
                  Params: {JSON.stringify(entryNode.fields)}
                </p>
              </div>
            </div>
          ) : entryNode.type === 'webhook' ? (
            <div className="flex justify-center items-center min-h-screen">
              <div className="text-center">
                Webhook URL: {router.query.url}
              </div>
            </div>
          ): null}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-red-400 text-lg mb-4">No entry node found</div>
            {JSON.stringify(nodes)}
            <Link
              href="/workflows"
              className="text-primary underline hover:text-primary-light transition duration-200"
            >
              Back to Workflows
            </Link>
          </div>
        )
        }
      </div>
    </div>
  );
}
