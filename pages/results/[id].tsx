import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type QueuedChainStepWithDetails = {
  id: number;
  queuedChainId: number;
  chainStepId: number;
  position: number;
  response: string | null;
  status: string;
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

const StepSkeleton = () => (
  <div className="border border-primary/20 rounded-lg p-6 bg-foreground-light animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 w-24 bg-primary/20 rounded"></div>
      <div className="h-5 w-20 bg-primary/20 rounded"></div>
    </div>
    <div className="mb-4">
      <div className="h-4 w-16 bg-primary/20 rounded mb-2"></div>
      <div className="h-20 w-full bg-primary/20 rounded"></div>
    </div>
    <div>
      <div className="h-4 w-20 bg-primary/20 rounded mb-2"></div>
      <div className="h-32 w-full bg-primary/20 rounded"></div>
    </div>
  </div>
);

export default function Results() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  
  const [queuedChain, setQueuedChain] = useState<QueuedChainData | null>(null);
  const [queuedChainSteps, setQueuedChainSteps] = useState<QueuedChainStepWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch results on component mount
  useEffect(() => {
    if (session && id) {
      fetchResults();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/results?id=${id}`);
      const data = await response.json();

      if (data.success) {
        setQueuedChain(data.queuedChain || null);
        setQueuedChainSteps(data.queuedChainSteps || []);
      } else {
        setError(data.message || 'Failed to fetch results');
      }
    } catch (err) {
      setError('An error occurred while fetching results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-400/20 text-green-400`;
      case 'processing':
        return `${baseClasses} bg-yellow-400/20 text-yellow-400`;
      case 'error':
        return `${baseClasses} bg-red-400/20 text-red-400`;
      case 'pending':
        return `${baseClasses} bg-gray-400/20 text-gray-400`;
      default:
        return `${baseClasses} bg-gray-400/20 text-gray-400`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading || status === 'loading') {
    return (
      <div>
        <Head>
          <title>Results - jjoist</title>
          <meta name="description" content="View chain execution results" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="container mx-auto px-4 py-10 max-w-6xl min-h-[90vh]">
          <nav className="mb-10 flex justify-between items-center">
            <ul className="flex gap-4">
              <li>
                <Link href="/dashboard">
                  <span className="text-primary underline hover:text-primary-light transition duration-200">
                    Dashboard
                  </span>
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
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

  return (
    <div>
      <Head>
        <title>Results - {queuedChain?.chainName || 'Chain'} - jjoist</title>
        <meta name="description" content="View chain execution results" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-10 max-w-6xl min-h-[90vh]">
        <nav className="mb-10 flex justify-between items-center">
          <ul className="flex gap-4">
            <li>
              <Link href="/dashboard">
                <span className="text-primary underline hover:text-primary-light transition duration-200">
                  Dashboard
                </span>
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-primary">Results</span>
            </li>
          </ul>
        </nav>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {queuedChain && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-primary">
                {queuedChain.chainName || 'Untitled Chain'}
              </h1>
              <span className={getStatusBadge(queuedChain.status)}>
                {queuedChain.status}
              </span>
            </div>
            
            <div className="text-sm text-gray-400 mb-2">
              Chain ID: {queuedChain.chainId} | Execution ID: {queuedChain.id}
            </div>
            
            <div className="text-sm text-gray-400 mb-4">
              Started: {formatDate(queuedChain.createdAt)} | 
              Last Updated: {formatDate(queuedChain.updatedAt)}
            </div>

            {queuedChain.error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
                <strong>Chain Error:</strong> {queuedChain.error}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {queuedChainSteps.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No steps found for this chain execution.
            </div>
          ) : (
            queuedChainSteps.map((step) => (
              <div
                key={step.id}
                className="border border-primary/20 rounded-lg p-6 bg-foreground-light hover:shadow-md transition duration-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-primary">
                    Step {step.position + 1}
                  </h3>
                  <span className={getStatusBadge(step.status)}>
                    {step.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-primary mb-2">Prompt:</h4>
                  <div className="bg-foreground p-4 rounded border text-primary/90">
                    {step.prompt}
                  </div>
                </div>

                {step.response && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-primary mb-2">Response:</h4>
                    <div className="bg-foreground p-4 rounded border text-primary/90 whitespace-pre-wrap">
                      {step.response}
                    </div>
                  </div>
                )}

                {step.error && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-red-400 mb-2">Error:</h4>
                    <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded">
                      {step.error}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-400 mt-4">
                  <span>Cycle: {step.cycleCount}</span>
                  <span>Updated: {formatDate(step.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/dashboard">
            <button className="bg-primary text-[#18181b] py-2 px-6 rounded-lg hover:bg-primary-light transition duration-200">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
