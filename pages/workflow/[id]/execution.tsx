import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { NodeData, Field } from '@/lib/workflow-types';
import ThemeToggle from '@/components/ThemeToggle';
import ProfileDropdown from "@/components/ProfileDropdown";
import WorkflowExecutionSkeleton from "@/components/WorkflowExecutionSkeleton";

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowExecutionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{success: boolean, executionId?: number, error?: string} | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [entryNodes, setEntryNodes] = useState<NodeData[]>([]);
  const [selectedEntryNodeId, setSelectedEntryNodeId] = useState<string | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': apiToken ? `Bearer ${apiToken}` : 'Bearer YOUR_API_TOKEN',
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (id && !Array.isArray(id)) {
      fetchWorkflow(parseInt(id, 10));
      fetchApiToken();
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
         }): NodeData => {
           const config = JSON.parse(node.config || '{}');
            return {
              id: node.id,
              type: node.type as 'entry' | 'ai' | 'scheduler' | 'review' | 'slack',
              x: node.positionX,
              y: node.positionY,
              label: node.label,
              fields: config.fields,
              entryType: node.entryType,
              aiConfig: config.aiConfig,
              schedulerConfig: config.schedulerConfig,
              reviewConfig: config.reviewConfig,
            };
         });

        setNodes(parsedNodes);

        // Track entry nodes for multiple entry point support
        const entryNodesList = parsedNodes.filter((n: NodeData) => n.type === 'entry');
        setEntryNodes(entryNodesList);
        if (entryNodesList.length === 1) {
          setSelectedEntryNodeId(entryNodesList[0].id);
        } else if (entryNodesList.length > 1) {
          // Default to first entry node
          setSelectedEntryNodeId(entryNodesList[0].id);
        }
      } else {
        setError(data.message || "Failed to fetch workflow");
      }
    } catch {
      setError("An error occurred while fetching the workflow");
    } finally {
      setLoading(false);
    }
  };

  const fetchApiToken = async () => {
    try {
      setLoadingToken(true);
      const response = await fetch('/api/user/api-token');
      const data = await response.json();

      if (data.success) {
        setApiToken(data.apiToken);
      }
    } catch (error) {
      console.error('Failed to fetch API token:', error);
    } finally {
      setLoadingToken(false);
    }
  };

  const generateNewApiToken = async () => {
    try {
      setLoadingToken(true);
      const response = await fetch('/api/user/api-token', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setApiToken(data.apiToken);
      }
    } catch (error) {
      console.error('Failed to generate new API token:', error);
    } finally {
      setLoadingToken(false);
    }
  };

  const selectedEntryNode = entryNodes.find(n => n.id === selectedEntryNodeId);

  const formatApiParams = (params?: Array<{ id: string, key: string, type: string }>) => {
    if (!params) return '';
    return JSON.stringify(params.reduce((acc, field) => {
      acc[field.key] = field.type;
      return acc;
    }, {} as Record<string, string>), null, 2);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;

    setExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch(`/api/workflow/${workflow.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputData: formData, entryNodeId: selectedEntryNodeId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push(`/workflow/execution/${result.executionId}`);
      } else {
        setExecutionResult({ success: false, error: result.error || 'Failed to execute workflow' });
      }
    } catch {
      setExecutionResult({ success: false, error: 'An error occurred while executing the workflow' });
    } finally {
      setExecuting(false);
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={field.key}
          />
        );
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={field.key}
          />
        );
    }
  };



  if (status === "loading" || loading) {
    return <WorkflowExecutionSkeleton />;
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
        <meta name="description" content="View your automation workflow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-6 max-w-6xl min-h-[90vh]">
        {/* Navigation */}
        <nav className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-6">
            <Button href="/dashboard" variant="tertiary" className="!bg-transparent !p-0 underline hover:text-primary-light">
              Dashboard
            </Button>
            <Button href="/workflows" variant="tertiary" className="!bg-transparent !p-0 underline hover:text-primary-light text-lg font-semibold">
              Workflows
            </Button>
          </div>

          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">{workflow?.name || "Workflow"}</h1>
            <p className="text-foreground-light">Workflow execution details</p>
          </div>
             <div className="flex gap-4">
               <Button
                 href={`/workflow/${workflow?.id}`}
                 variant="secondary"
               >
                 View Stats
               </Button>
               <Button
                 href={`/workflow/${workflow?.id}/edit`}
                 variant="primary"
               >
                 Edit Workflow
               </Button>
             </div>
        </div>

        {/* Content */}
        <div className="bg-background-light rounded-lg p-6">
          {selectedEntryNode ? (
            selectedEntryNode.type === 'entry' ? (
              <div className="max-w-md w-full">
                {/* Tabs for multiple entry nodes */}
                {entryNodes.length > 1 && (
                  <div className="flex gap-2 border-b border-border mb-6">
                    {entryNodes.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => {
                          setSelectedEntryNodeId(node.id);
                          setFormData({});
                          setExecutionResult(null);
                        }}
                        className={`px-4 py-2 text-sm font-medium ${
                          selectedEntryNodeId === node.id
                            ? 'text-primary border-b-2 border-primary -mb-[1px]'
                            : 'text-foreground-light hover:text-foreground'
                        }`}
                      >
                        {node.label}
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-background-extra-light">
                          {node.entryType === 'api' ? 'API' : 'Form'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedEntryNode.entryType === 'form' ? (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Workflow Form</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {selectedEntryNode.fields?.map((field: Field) => (
                        <div key={field.id}>
                          <label htmlFor={field.id} className="block text-sm font-medium text-foreground-light mb-1">
                            {field.key}
                          </label>
                          {renderFieldInput(field)}
                        </div>
                      ))}
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={executing}
                        className="w-full"
                      >
                        {executing ? 'Executing...' : 'Execute Workflow'}
                      </Button>
                    </form>
                     {executionResult && (
                       <div className={`mt-4 p-3 rounded ${executionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                         {executionResult.success ? (
                           <div>
                             <p className="font-medium">Workflow executed successfully!</p>
                             {executionResult.executionId && (
                               <div className="mt-2">
                                 <p className="text-sm">Execution ID: {executionResult.executionId}</p>
                                 <Button
                                   href={`/workflow/execution/${executionResult.executionId}`}
                                   variant="tertiary"
                                   className="!bg-transparent !p-0 underline hover:text-primary-light text-sm mt-1"
                                 >
                                   View Execution Details →
                                 </Button>
                               </div>
                             )}
                           </div>
                         ) : (
                           <p className="font-medium">{executionResult.error}</p>
                         )}
                       </div>
                     )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">API Endpoint</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground-light mb-1">URL</label>
                        <code className="block bg-background-extra-light p-2 rounded text-sm text-foreground font-mono">
                          {workflow ? `${window.location.origin}/api/workflow/${workflow.id}/execute` : ''}
                        </code>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground-light mb-1">Method</label>
                        <code className="block bg-background-extra-light p-2 rounded text-sm text-foreground font-mono">
                          POST
                        </code>
                      </div>
                       <div>
                         <label className="block text-sm font-medium text-foreground-light mb-1">Headers</label>
                         <pre className="block bg-background-extra-light p-2 rounded text-sm text-foreground font-mono overflow-x-auto">
                           {JSON.stringify(authHeaders, null, 2)}
                         </pre>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-foreground-light mb-1">Your API Token</label>
                         <div className="bg-background-extra-light p-3 rounded">
                           {loadingToken ? (
                             <div className="text-sm text-foreground-light">Loading API token...</div>
                           ) : apiToken ? (
                             <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <code className="text-sm text-foreground font-mono break-all">{apiToken}</code>
                                 <CopyButton text={apiToken} />
                               </div>
                               <Button
                                 onClick={generateNewApiToken}
                                 variant="secondary"
                                 size="sm"
                                 disabled={loadingToken}
                               >
                                 {loadingToken ? 'Generating...' : 'Generate New Token'}
                               </Button>
                             </div>
                           ) : (
                             <div className="space-y-2">
                               <div className="text-sm text-error">No API token found</div>
                               <Button
                                 onClick={generateNewApiToken}
                                 variant="primary"
                                 size="sm"
                                 disabled={loadingToken}
                               >
                                 {loadingToken ? 'Generating...' : 'Generate API Token'}
                               </Button>
                             </div>
                           )}
                         </div>
                       </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground-light mb-1">Parameters</label>
                          <pre className="block bg-background-extra-light p-2 rounded text-sm text-foreground font-mono overflow-x-auto">
                            {formatApiParams(selectedEntryNode.fields)}
                          </pre>
                        </div>
                        <div>
                           <div className="flex items-center justify-between mb-1">
                             <label className="block text-sm font-medium text-foreground-light">Example cURL</label>
                             <CopyButton text={`curl -X POST "${window.location.origin}/api/workflow/${workflow?.id}/execute" \\
   -H "Content-Type: application/json" \\
   -H "Authorization: Bearer ${apiToken || 'YOUR_API_TOKEN'}" \\
   -d '{"inputData": ${formatApiParams(selectedEntryNode.fields)}, "entryNodeId": "${selectedEntryNode.id}"}'`} />
                           </div>
                           <pre className="block bg-background-extra-light p-2 rounded text-sm text-foreground font-mono overflow-x-auto">
                             {`curl -X POST "${window.location.origin}/api/workflow/${workflow?.id}/execute" \\
   -H "Content-Type: application/json" \\
   -H "Authorization: Bearer ${apiToken || 'YOUR_API_TOKEN'}" \\
   -d '{"inputData": ${formatApiParams(selectedEntryNode.fields)}, "entryNodeId": "${selectedEntryNode.id}"}'`}
                           </pre>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            <div className="text-center py-12">
              <div className="text-error text-lg mb-4">No entry node found</div>
              <div className="text-sm text-foreground-light mb-4">This workflow may not be properly configured.</div>
              <Button
                href="/workflows"
                variant="tertiary"
                className="!bg-transparent !p-0 underline hover:text-primary-light"
              >
                Back to Workflows
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
