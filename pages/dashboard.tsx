import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import { SelectChain, SelectQueuedChainWithStatus } from '@/schema';
import Link from 'next/link';

type ChainWithStepCount = SelectChain & { stepCount: number };
import SubscriptionModal from '@/components/SubscriptionCard';

// Add loading skeleton components
const ChainSkeleton = () => (
  <div className="flex justify-between items-center border-primary border-1 rounded-lg shadow p-4 bg-foreground-light animate-pulse">
    <div className="h-6 w-32 bg-primary/20 rounded"></div>
    <div className="flex gap-4">
      <div className="h-8 w-8 bg-primary/20 rounded"></div>
      <div className="h-8 w-20 bg-primary/20 rounded"></div>
    </div>
  </div>
);

const QueuedChainSkeleton = () => (
  <div className="border-[#a3e635] border-1 rounded-lg shadow p-6 bg-foreground-light animate-pulse relative">
    <div className="flex justify-between items-center">
      <div className="h-7 w-40 bg-[#a3e635]/20 rounded"></div>
      <div className="flex gap-4">
        <div className="h-8 w-16 bg-primary/20 rounded"></div>
        <div className="h-8 w-20 bg-primary/20 rounded"></div>
        <div className="h-8 w-20 bg-primary/20 rounded"></div>
      </div>
    </div>
  </div>
);

const ProgressBar = ({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="w-full rounded-sm overflow-hidden">
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-[#a3e635] h-1 transition-all rouded-full duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [chains, setChains] = useState<ChainWithStepCount[]>([]);
  const [queuedChains, setQueuedChains] = useState<
    SelectQueuedChainWithStatus[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newChainName, setNewChainName] = useState('');
  const [usage, setUsage] = useState<{
    callsUsed: number;
    callsLimit: number;
    tier: string;
  } | null>(null);
  const router = useRouter();
  const [showAddChainModal, setShowAddChainModal] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch chains on component mount
  useEffect(() => {
    if (session) {
      fetchChains();
    }
  }, [session]);

  // Auto-refresh when watching is enabled
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      fetchChains({ silent: true }); // Silent refresh to avoid loading state
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [session]);

  const fetchChains = async (opts = { silent: false }) => {
    try {
      if (!opts.silent) setLoading(true);
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (data.success) {
        setChains(data.chains || []);
        setQueuedChains(data.queuedChains || []);
        setUsage(data.usage || null);
      } else {
        setError(data.message || 'Failed to fetch chains');
      }
    } catch (err) {
      setError('An error occurred while fetching chains');
      console.error(err);
    } finally {
      if (!opts.silent) setLoading(false);
    }
  };

  const handleCreateChain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newChainName.trim()) {
      setError('Chain name is required');
      return;
    }

    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChainName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/chain/${data.chainId}`);
      } else {
        setError(data.message || 'Failed to create chain');
      }
    } catch (err) {
      setError('An error occurred while creating the chain');
      console.error(err);
    }
  };

  const handleViewChain = (id: number) => {
    router.push(`/chain/${id}`);
  };

  const handleAddChainToQueue = async (chainId: number) => {
    if (!confirm('Are you sure you want to add this chain to the queue?')) {
      return;
    }

    try {
      const response = await fetch(`/api/add-to-queue?id=${chainId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        fetchChains({ silent: true });
      } else {
        setError(data.message || 'Failed to run chain');
      }
    } catch (err) {
      setError('An error occurred while running the chain');
      console.error(err);
    }
  };

  const handleStopChain = async (id: number) => {
    if (!confirm('Are you sure you want to stop this chain?')) {
      return;
    }
  };

  return (
    <div>
      <Head>
        <title>Dashboard - jjoist</title>
        <meta name="description" content="Manage your AI chains" />
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
          </ul>

          <div className="flex gap-4 items-center">
            {usage && (
              <div className="text-sm text-primary">
                <span className="font-medium">
                  {usage.callsUsed}/{usage.callsLimit}
                </span>
                <span className="text-gray-400 ml-1">calls used</span>
                <div className="text-xs text-gray-500">{usage.tier} plan</div>
              </div>
            )}
            <SubscriptionModal onSubscriptionChange={fetchChains} />
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="bg-primary text-[#18181b] py-2 px-4 rounded-lg hover:bg-primary-light transition duration-200 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </nav>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Kanban Board Layout */}
        <div className="flex gap-6 w-full">
          {/* Prompt Chains Column */}
          <section className="flex-1 flex flex-col bg-foreground rounded-lg p-4 min-h-[70vh]">
            <h2 className="text-lg font-bold text-primary mb-4 text-center">
              Prompt Chains
            </h2>
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
              {loading ? (
                <>
                  <ChainSkeleton />
                  <ChainSkeleton />
                  <ChainSkeleton />
                </>
              ) : (
                chains.map((chain) => (
                  <Card
                    key={chain.id}
                    name={chain.name || ''}
                    actions={
                      <>
                        <Link
                          href={`/chain/${chain.id}`}
                          className="border-primary border-1 text-primary py-1 px-2 rounded hover:border-primary-light hover:text-primary-light cursor-pointer transition duration-200 text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleAddChainToQueue(chain.id)}
                          className="bg-primary text-[#18181b] py-1 px-2 rounded hover:bg-primary-light cursor-pointer transition duration-200 text-sm"
                        >
                          Run
                        </button>
                      </>
                    }
                    stepsCount={chain.stepCount}
                    stepsCompletedCount={0}
                    showProgress={false}
                  />
                ))
              )}
            </div>
            <div className="flex justify-center items-center mt-4">
              <button
                className="bg-primary text-[#18181b] py-2 px-4 rounded-lg hover:bg-primary-light transition duration-200 cursor-pointer"
                onClick={() => setShowAddChainModal(true)}
              >
                Add New Chain
              </button>
            </div>
          </section>

          {/* In Progress Column */}
          <section className="flex-1 flex flex-col bg-foreground rounded-lg p-4 min-h-[70vh]">
            <h2 className="text-lg font-bold text-primary mb-4 text-center">
              In Progress
            </h2>
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
              {loading ? (
                <>
                  <QueuedChainSkeleton />
                  <QueuedChainSkeleton />
                  <QueuedChainSkeleton />
                </>
              ) : (
                queuedChains
                  .filter(
                    (qc) =>
                      qc.status === 'pending' || qc.status === 'processing'
                  )
                  .map((queuedChain) => {
                    const chain = chains.find(
                      (c) => c.id === queuedChain.chainId
                    );
                    if (!chain) return null;
                    return (
                      <Card
                        key={queuedChain.id}
                        name={chain.name || ''}
                        actions={
                          <>
                            <button
                              onClick={() => handleViewChain(chain.id)}
                              className="border-primary border-1 text-primary py-1 px-2 rounded hover:border-primary-light hover:text-primary-light cursor-pointer transition duration-200 text-sm"
                            >
                              View
                            </button>
                            <button
                              className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 cursor-pointer transition duration-200 text-sm"
                              onClick={() => handleStopChain(queuedChain.id)}
                            >
                              Stop
                            </button>
                          </>
                        }
                        stepsCount={queuedChain.steps?.length || 0}
                        stepsCompletedCount={
                          queuedChain.steps?.filter(
                            (step) => step.status === 'completed'
                          ).length || 0
                        }
                        error={queuedChain.error || ''}
                      />
                    );
                  })
              )}
            </div>
          </section>

          {/* Completed Column */}
          <section className="flex-1 flex flex-col bg-foreground rounded-lg p-4 min-h-[70vh]">
            <h2 className="text-lg font-bold text-primary mb-4 text-center">
              Completed
            </h2>
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
              {loading ? (
                <>
                  <QueuedChainSkeleton />
                  <QueuedChainSkeleton />
                  <QueuedChainSkeleton />
                </>
              ) : (
                queuedChains
                  .filter(
                    (qc) => qc.status === 'completed' || qc.status === 'error'
                  )
                  .toSorted(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((queuedChain) => {
                    const chain = chains.find(
                      (c) => c.id === queuedChain.chainId
                    );
                    if (!chain) return null;
                    return (
                      <Card
                        key={queuedChain.id}
                        name={chain.name || ''}
                        actions={
                          <>
                            <Link
                              href={`/results/${queuedChain.id}`}
                              className="bg-primary text-[#18181b] py-1 px-2 rounded hover:bg-primary-light cursor-pointer transition duration-200 text-sm"
                            >
                              View Results
                            </Link>
                          </>
                        }
                        stepsCount={queuedChain.steps?.length || 0}
                        stepsCompletedCount={
                          queuedChain.steps?.filter(
                            (step) => step.status === 'completed'
                          ).length || 0
                        }
                        error={queuedChain.error || ''}
                      />
                    );
                  })
              )}
            </div>
          </section>
        </div>
      </main>

      {showAddChainModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-foreground p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">Add New Chain</h2>
              <button
                onClick={() => setShowAddChainModal(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateChain}>
              <div className="mb-6">
                <label
                  htmlFor="chainName"
                  className="block text-sm font-medium text-primary mb-2"
                >
                  Chain Name
                </label>
                <input
                  type="text"
                  id="chainName"
                  value={newChainName}
                  onChange={(e) => setNewChainName(e.target.value)}
                  className="w-full p-3 bg-foreground-light border border-primary/20 rounded-lg focus:outline-none focus:border-primary transition duration-200 text-primary"
                  placeholder="Enter chain name..."
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddChainModal(false)}
                  className="px-4 py-2 text-primary hover:text-primary-light transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-[#18181b] py-2 px-4 rounded-lg hover:bg-primary-light transition duration-200"
                >
                  Add Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Card = ({
  name,
  actions,
  stepsCount,
  stepsCompletedCount,
  error,
  showProgress = true,
}: {
  name: string;
  actions: React.ReactNode;
  stepsCount: number;
  stepsCompletedCount: number;
  error?: string;
  showProgress?: boolean;
}) => {
  return (
    <div className="border-[#a3e635] border-1 rounded-lg shadow hover:shadow-md transition duration-200 bg-foreground-light overflow-hidden">
      <div className="p-4">
        <div>
          <h3 className="text-md text-[#a3e635] font-semibold">{name}</h3>
          <div className="text-sm text-gray-400 mt-1">
            {error && <span className="text-red-400 ml-2">(Error)</span>}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-flex-end p-4">
        <div>
          {showProgress ? (
            <p className="text-sm font-bold text-primary">
              {stepsCompletedCount}/{stepsCount} Steps Processed
            </p>
          ) : (
            <p className="text-sm font-bold text-primary">{stepsCount} Steps</p>
          )}
        </div>
        <div className="flex gap-2 justify-end">{actions}</div>
      </div>
      {showProgress && stepsCount > 0 && (
        <ProgressBar completed={stepsCompletedCount} total={stepsCount} />
      )}
    </div>
  );
};
