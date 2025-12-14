import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import ThemeToggle from '@/components/ThemeToggle';

type QueuedChainStepWithDetails = {
  id: number;
  queuedChainId: number;
  chainStepId: number;
  position: number;
  response: string | null;
  status: string;
  aiDescription: string | null;
  model: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  prompt: string;
  cycleCount: number;
};

type QueuedChainData = {
  id: number;
  chainId: number;
  status: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  chainName: string | null;
};

type QueuedChainVariables = {
  variableName: string;
  variableValue: string;
};

const StepSkeleton = () => (
  <div className="border border-primary/20 rounded-lg p-6 bg-background-light animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 w-24 bg-primary/20 rounded"></div>
      <div className="h-5 w-20 bg-primary/20 rounded"></div>
    </div>
  </div>
);

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
    case "processing":
      return `${baseClasses} bg-yellow-400/10 text-yellow-400`;
    case "error":
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

const StepCard = ({ step }: { step: QueuedChainStepWithDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-primary/20 rounded-lg bg-background-light hover:shadow-md transition duration-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold text-primary">
              {step.aiDescription}
            </h3>
            <span className={getStatusBadge(step.status)}>{step.status}</span>
          </div>
          <div className="flex items-center gap-4">
            {step.response && <CopyButton text={step.response} />}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-primary/10 rounded transition-colors duration-200 cursor-pointer"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-primary transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4 border-t border-primary/20 pt-4 mb-4">
            {step.response && (
              <div>
                <div className="bg-background-light p-4 rounded border border-primary text-foreground/90 whitespace-pre-wrap">
                  {step.response}
                </div>
              </div>
            )}

            {step.error && (
              <div>
                <h4 className="text-sm font-medium text-error mb-2">
                  Error:
                </h4>
                <div className="bg-red-500/20 border border-red-500 text-error p-4 rounded">
                  {step.error}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-foreground-light">
          Model: {step.model}
        </div>
      </div>
    </div>
  );
};

export default function Results() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [queuedChain, setQueuedChain] = useState<QueuedChainData | null>(null);
  const [queuedChainSteps, setQueuedChainSteps] = useState<
    QueuedChainStepWithDetails[]
  >([]);
  const [queuedChainVariables, setQueuedChainVariables] = useState<
    QueuedChainVariables[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  const fetchResults = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        const response = await fetch(`/api/results?id=${id}`);
        const data = await response.json();

        if (data.success) {
          setQueuedChain(data.queuedChain || null);
          setQueuedChainSteps(data.queuedChainSteps || []);
          setQueuedChainVariables(data.queuedChainVariables || []);
        } else {
          setError(data.message || "Failed to fetch results");
        }
      } catch (err) {
        setError("An error occurred while fetching results");
        console.error(err);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  // Set up polling when chain is processing
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (queuedChain?.status !== "completed") {
      // Set up new polling interval (every 3 seconds)
      pollingIntervalRef.current = setInterval(
        () => fetchResults({ silent: true }),
        3000,
      );
    }

    // Cleanup on unmount or when status changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [queuedChain?.status, fetchResults]);

  // Fetch results on component mount
  useEffect(() => {
    if (session && id) {
      fetchResults();
    }
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [session, id, fetchResults]);

  if (loading || status === "loading") {
    return (
      <div>
        <Head>
          <title>Results - zeitflow.io</title>
          <meta name="description" content="View chain execution results" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="container mx-auto px-4 py-10 max-w-6xl min-h-[90vh]">
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
                <span className="text-primary">Results</span>
              </li>
            </ul>
          </nav>

          <div className="animate-pulse">
            <div className="h-8 w-64 bg-primary/20 rounded mb-4"></div>
            <div className="h-6 w-48 bg-primary/20 rounded mb-8"></div>
          </div>

          <div className="flex flex-col gap-6">
            <StepSkeleton />
            <StepSkeleton />
            <StepSkeleton />
          </div>
        </main>
      </div>
    );
  }

  const supplementStepPromptVariable = (step: QueuedChainStepWithDetails, varables: QueuedChainVariables[]): QueuedChainStepWithDetails => {
    let newPrompt = step.prompt;

    for (const variable of varables) {
      newPrompt = newPrompt.replaceAll(
        `{{${variable.variableName}}}`,
        `{{${variable.variableName}: "${variable.variableValue}"}}`,
      );
    }

    return { ...step, prompt: newPrompt };
  };

  return (
    <div>
      <Head>
        <title>Results - {queuedChain?.chainName || "Chain"} - zeitflow.io</title>
        <meta name="description" content="View chain execution results" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-10 max-w-6xl min-h-[90vh]">
        <nav className="mb-10 flex justify-between items-center">
          <ul className="flex gap-4">
            <li>
              <Button href="/dashboard" variant="tertiary" className="!bg-transparent !p-0 underline hover:text-primary-light">
                Dashboard
              </Button>
            </li>
            <li>
              <span className="text-foreground-extra-light">/</span>
            </li>
            <li>
              <span className="text-foreground">Results</span>
            </li>
          </ul>


          <ThemeToggle />
        </nav>

        {error && (
          <div className="bg-red-100 border border-error text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {queuedChain && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-primary">
                {queuedChain.chainName || "Untitled Chain"}
              </h1>
              <span className={getStatusBadge(queuedChain.status)}>
                {queuedChain.status}
              </span>
            </div>

            <div className="text-sm text-foreground-light mb-4">
              Generated:{" "}
              {formatDate(queuedChain.updatedAt)}
            </div>

            {queuedChain.error && (
              <div className="bg-red-500/20 border border-red-500 text-error px-4 py-3 rounded mb-4">
                <strong>Chain Error:</strong> {queuedChain.error}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {queuedChainSteps.length === 0 ? (
            <div className="text-center py-12 text-foreground-light">
              No steps found for this chain execution.
            </div>
          ) : (
            queuedChainSteps.map((step) => (
              <StepCard key={step.id} step={supplementStepPromptVariable(step, queuedChainVariables)} />
            ))
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button href="/dashboard" variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
