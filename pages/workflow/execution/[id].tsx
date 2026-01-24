import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import ThemeToggle from '@/components/ThemeToggle';
import ProfileDropdown from "@/components/ProfileDropdown";
import ExecutionDetailsSkeleton from "@/components/ExecutionDetailsSkeleton";
import ExecutionLogViewer from "@/components/ExecutionLogViewer";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  integrationId: string;
  nodeId: string;
  executionId: string;
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

interface Execution {
  id: number;
  workflowId: number;
  status: string;
  inputData: any;
  outputData: any;
  logs: LogEntry[] | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

interface Workflow {
  id: number;
  name: string;
  description: string | null;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200 cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
};

const getStatusBadge = (status: string) => {
  const baseClasses = "px-2.5 py-1 rounded-lg text-xs font-medium";
  switch (status) {
    case "completed":
      return `${baseClasses} bg-success/10 text-success`;
    case "running":
      return `${baseClasses} bg-yellow-400/10 text-yellow-400`;
    case "failed":
      return `${baseClasses} bg-error/10 text-error`;
    case "pending":
      return `${baseClasses} bg-gray-400/10 text-foreground-light`;
    default:
      return `${baseClasses} bg-gray-400/20 text-foreground-light`;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const formatDuration = (startedAt: string, completedAt: string | null) => {
  if (!completedAt) return null;
  const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export default function ExecutionDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [execution, setExecution] = useState<Execution | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  const fetchExecution = async (executionId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/execution/${executionId}`);
      const data = await response.json();

      if (data.success) {
        setExecution(data.execution);
        setWorkflow(data.workflow);
      } else {
        setError(data.message || "Failed to fetch execution details");
      }
    } catch (err) {
      setError("An error occurred while fetching execution details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && id && !Array.isArray(id)) {
      fetchExecution(parseInt(id, 10));
    }
  }, [session, id]);

  if (status === "loading" || loading) {
    return <ExecutionDetailsSkeleton />;
  }

  if (error && !execution) {
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
        <title>Execution {execution?.id} - {workflow?.name || "Workflow"} - ZeitFlow</title>
        <meta name="description" content="View workflow execution details" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-10 max-w-6xl min-h-[90vh]">
        {/* Navigation */}
        <nav className="mb-10 flex justify-between items-center">
          <ul className="flex gap-4">
            <li>
              <Button href="/dashboard" variant="tertiary" className="!bg-transparent !p-0 underline hover:text-primary-light">
                Dashboard
              </Button>
            </li>
            <li>
              <span className="text-foreground-light">/</span>
            </li>
            <li>
              <Button href="/workflows" variant="tertiary" className="!bg-transparent !p-0 underline hover:text-primary-light">
                Workflows
              </Button>
            </li>
            <li>
              <span className="text-foreground-light">/</span>
            </li>
            <li>
              <Button href={`/workflow/${workflow?.id}`} variant="tertiary" className="!bg-transparent !p-0 underline hover:text-primary-light">
                {workflow?.name}
              </Button>
            </li>
            <li>
              <span className="text-foreground-light">/</span>
            </li>
            <li>
              <span className="text-primary">Execution {execution?.id}</span>
            </li>
          </ul>

          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </nav>

        {execution && workflow && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">
                  Execution #{execution.id}
                </h1>
                <p className="text-foreground-light mb-4">
                  Workflow: {workflow.name}
                </p>
                <div className="flex items-center gap-4">
                  <span className={getStatusBadge(execution.status)}>{execution.status}</span>
                  <span className="text-sm text-foreground-light">
                    Started: {formatDate(execution.startedAt)}
                  </span>
                  {execution.completedAt && (
                    <span className="text-sm text-foreground-light">
                      Duration: {formatDuration(execution.startedAt, execution.completedAt)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Button
                  href={`/workflow/${workflow?.id}/execution`}
                  variant="primary"
                >
                  Run Again
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {execution.error && (
              <div className="bg-red-500/20 border border-red-500 text-error px-4 py-3 rounded">
                <strong>Execution Error:</strong> {execution.error}
              </div>
            )}

            {/* Execution Logs */}
            <ExecutionLogViewer logs={execution.logs} />

            {/* Input Data */}
            <div className="bg-background-light rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Input Data</h2>
                {execution.inputData && (
                  <CopyButton text={JSON.stringify(execution.inputData, null, 2)} />
                )}
              </div>
              {execution.inputData ? (
                <pre className="bg-background-extra-light p-4 rounded border border-primary/20 text-foreground font-mono text-sm overflow-x-auto">
                  {JSON.stringify(execution.inputData, null, 2)}
                </pre>
              ) : (
                <p className="text-foreground-light">No input data available</p>
              )}
            </div>

            {/* Output Data */}
            <div className="bg-background-light rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Output Data</h2>
                {execution.outputData && (
                  <CopyButton text={JSON.stringify(execution.outputData, null, 2)} />
                )}
              </div>
              {execution.outputData ? (
                <pre className="bg-background-extra-light p-4 rounded border border-primary/20 text-foreground font-mono text-sm overflow-x-auto">
                  {JSON.stringify(execution.outputData, null, 2)}
                </pre>
              ) : (
                <p className="text-foreground-light">No output data available</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button href={`/workflow/${workflow?.id}`} variant="primary">
            Back to Workflow
          </Button>
        </div>
      </main>
    </div>
  );
}
