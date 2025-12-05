import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { SelectChain, SelectQueuedChainWithStatus, SelectQueuedChainStep } from "@/schema";
import { Button } from "@/components/Button";
import ThemeToggle from '@/components/ThemeToggle';

type ChainWithStepCount = SelectChain & { stepCount: number };
import SubscriptionModal from "@/components/SubscriptionCard";
import VariablesModal from "@/components/VariablesModal";
import ProfileDropdown from "@/components/ProfileDropdown";

// Add loading skeleton components
const ChainSkeleton = () => (
  <div className="flex justify-between items-center rounded-lg shadow p-4 bg-background-extra-light animate-pulse">
    <div className="h-6 w-full bg-background-light/20 rounded"></div>
    <div className="flex gap-4">
      <div className="h-8 w-8 bg-background-light/20 rounded"></div>
      <div className="h-8 w-20 bg-background-light/20 rounded"></div>
    </div>
  </div>
);

const QueuedChainSkeleton = () => (
  <div className="p-6 bg-background-extra-light animate-pulse relative">
    <div className="flex justify-between items-center">
      <div className="h-7 w-full bg-background-light/20 rounded"></div>
      <div className="flex gap-4">
        <div className="h-8 w-16 bg-background-light/20 rounded"></div>
        <div className="h-8 w-20 bg-background-light/20 rounded"></div>
        <div className="h-8 w-20 bg-background-light/20 rounded"></div>
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
      <div className="w-full bg-surface-hover rounded-full h-1">
        <div
          className="bg-background-light h-1 transition-all rounded-full duration-300"
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
  const [error, setError] = useState("");
  const [newChainName, setNewChainName] = useState("");
  const router = useRouter();
  const [showAddChainModal, setShowAddChainModal] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [selectedChainForQueue, setSelectedChainForQueue] =
    useState<ChainWithStepCount | null>(null);
  const [activeTab, setActiveTab] = useState<'chains' | 'in-progress' | 'completed'>('chains');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/auth/signin");
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
      const response = await fetch("/api/dashboard");
      const data = await response.json();

      if (data.success) {
        setChains(data.chains || []);
        setQueuedChains(data.queuedChains || []);
      } else {
        setError(data.message || "Failed to fetch chains");
      }
    } catch (err) {
      setError("An error occurred while fetching chains");
      console.error(err);
    } finally {
      if (!opts.silent) setLoading(false);
    }
  };

  const handleCreateChain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newChainName.trim()) {
      setError("Chain name is required");
      return;
    }

    try {
      const response = await fetch("/api/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newChainName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/chain/${data.chainId}`);
      } else {
        setError(data.message || "Failed to create chain");
      }
    } catch (err) {
      setError("An error occurred while creating the chain");
      console.error(err);
    }
  };

  const handleAddChainToQueue = async (chainId: number) => {
    const chain = chains.find((c) => c.id === chainId);
    if (!chain) return;

    // Set the selected chain and show variables modal
    setSelectedChainForQueue(chain);
    setShowVariablesModal(true);
  };

  const handleVariablesSubmit = async (variables: Record<string, string>) => {
    if (!selectedChainForQueue) return;

    try {
      const response = await fetch(
        `/api/add-to-queue?id=${selectedChainForQueue.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ variables }),
        },
      );

      const data = await response.json();

      if (data.success) {
        fetchChains({ silent: true });
        setSelectedChainForQueue(null);
      } else {
        setError(data.message || "Failed to run chain");
      }
    } catch (err) {
      setError("An error occurred while running the chain");
      console.error(err);
    }
  };

  const handleVariablesModalClose = () => {
    setShowVariablesModal(false);
    setSelectedChainForQueue(null);
  };

  const handleStopChain = async (id: number) => {
    if (!confirm("Are you sure you want to stop this chain?")) {
      return;
    }

    try {
      const response = await fetch(`/api/stop-chain?id=${id}`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        fetchChains({ silent: true });
      } else {
        setError(data.message || "Failed to stop chain");
      }
    } catch (err) {
      setError("An error occurred while stopping the chain");
      console.error(err);
    }
  };

  const handleResumeChain = async (id: number) => {
    if (!confirm("Are you sure you want to resume this chain?")) {
      return;
    }

    try {
      const response = await fetch(`/api/resume-chain?id=${id}`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        fetchChains({ silent: true });
      } else {
        setError(data.message || "Failed to resume chain");
      }
    } catch (err) {
      setError("An error occurred while resuming the chain");
      console.error(err);
    }
  };

  // Filter chains for different sections
  const inProgressChains = queuedChains.filter(
    (qc) => qc.status === "pending" || qc.status === "processing" || qc.status === "stopped"
  );
  
  const completedChains = queuedChains.filter(
    (qc) => qc.status === "completed" || qc.status === "error"
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <Head>
        <title>Dashboard - jjoist</title>
        <meta name="description" content="Manage your AI chains" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-6 max-w-6xl min-h-[90vh]">
        {/* Mobile-friendly navigation */}
        <nav className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button href="/dashboard" variant="clear" className="underline hover:text-foreground-light text-lg font-semibold">
                Dashboard
              </Button>
              <Button href="/workflows" variant="clear" className="underline hover:text-foreground-light">
                Workflows
              </Button>
            </div>
            <Button
              className="sm:hidden text-foreground p-2 rounded-lg text-xl"
              variant="tertiary"
              onClick={() => setShowAddChainModal(true)}
            >
              +
            </Button>
          </div>

          <div className="flex gap-4 items-center">

          <ThemeToggle />
            <SubscriptionModal onSubscriptionChange={fetchChains} />
            <ProfileDropdown />
          </div>
        </nav>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Mobile Tab Navigation */}
        <div className="sm:hidden mb-6">
          <div className="flex bg-background-light rounded-lg p-1">
            <Button
              onClick={() => setActiveTab('chains')}
              variant="tertiary"
              className={`flex-1 !bg-transparent !p-2 !h-auto rounded-md text-sm font-medium transition-colors ${
                activeTab === 'chains'
                  ? 'bg-background-light text-foreground'
                  : 'text-foreground hover:text-foreground-light'
              }`}
            >
              Chains ({chains.length})
            </Button>
            <Button
              onClick={() => setActiveTab('in-progress')}
              variant="tertiary"
              className={`flex-1 !bg-transparent !p-2 !h-auto rounded-md text-sm font-medium transition-colors ${
                activeTab === 'in-progress'
                  ? 'bg-background-light text-foreground'
                  : 'text-foreground hover:text-foreground-light'
               }`}
            >
              In Progress ({inProgressChains.length})
            </Button>
            <Button
              onClick={() => setActiveTab('completed')}
              variant="tertiary"
              className={`flex-1 !bg-transparent !p-2 !h-auto rounded-md text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-background-light text-foreground'
                  : 'text-foreground hover:text-foreground-light'
              }`}
            >
              Completed ({completedChains.length})
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex gap-6 w-full">
          {/* Prompt Chains Column */}
          <section className="flex-1 flex flex-col bg-background-light rounded-lg p-4 h-[70vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-foreground">Prompt Chains</h2>
              <Button
                variant="tertiary"
                className="!bg-transparent text-foreground p-2 rounded-lg"
                onClick={() => setShowAddChainModal(true)}
              >
                +
              </Button>
            </div>
            <div className="overflow-y-auto">
              <div className="flex flex-col gap-4 flex-1">
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
                       name={chain.name || ""}
                       actions={
                         <>
                           <Button
                             href={`/chain/${chain.id}`}
                             variant="tertiary"
                             size="sm"
                             className="border-foreground border-1 text-foreground hover:border-foreground-light hover:text-foreground-light"
                           >
                             Edit
                           </Button>
                           <Button
                             onClick={() => handleAddChainToQueue(chain.id)}
                             variant="primary"
                             size="sm"
                           >
                             Run
                           </Button>
                         </>
                       }
                      stepsCount={chain.stepCount}
                      stepsCompletedCount={0}
                      showProgress={false}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          {/* In Progress Column */}
          <section className="flex-1 flex flex-col bg-background-light rounded-lg p-4 h-[70vh]">
            <h2 className="font-bold text-foreground py-2 mb-4">
              In Progress
            </h2>
            <div className="overflow-y-auto">
              <div className="flex flex-col gap-4 flex-1">
                {loading ? (
                  <>
                    <QueuedChainSkeleton />
                    <QueuedChainSkeleton />
                    <QueuedChainSkeleton />
                  </>
                ) : (
                  inProgressChains.map((queuedChain) => {
                    const chain = chains.find(
                      (c) => c.id === queuedChain.chainId,
                    );
                    if (!chain) return null;
                    return (
                       <Card
                         key={queuedChain.id}
                         name={chain.name || ""}
                         actions={
                           <>
                             <Button
                               href={`/results/${queuedChain.id}`}
                               variant="tertiary"
                               size="sm"
                               className="border-foreground border-1 text-foreground hover:border-foreground-light hover:text-foreground-light"
                             >
                               View
                             </Button>
                             {queuedChain.status === "processing" && (
                               <Button
                                 variant="tertiary"
                                 size="sm"
                                 className="!bg-red-500 !text-white hover:!bg-red-600"
                                 onClick={() =>
                                   handleStopChain(queuedChain.id)
                                 }
                               >
                                 Stop
                               </Button>
                              )}
                             {queuedChain.status === "stopped" && (
                               <Button
                                 variant="tertiary"
                                 size="sm"
                                 className="!bg-red-500 !text-white hover:!bg-red-600"
                                 onClick={() =>
                                   handleResumeChain(queuedChain.id)
                                 }
                               >
                                 Resume
                               </Button>
                             )}
                           </>
                         }
                        stepsCount={queuedChain.steps?.length || 0}
                        stepsCompletedCount={
                          queuedChain.steps?.filter(
                            (step: SelectQueuedChainStep) => step.status === "completed",
                          ).length || 0
                        }
                        error={queuedChain.error || ""}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* Completed Column */}
          <section className="flex-1 flex flex-col bg-background-light rounded-lg p-4 h-[70vh]">
            <h2 className="text-lg font-bold text-foreground py-2 mb-4">
              Completed
            </h2>
            <div className="overflow-y-auto">
              <div className="flex flex-col gap-4 flex-1">
                {loading ? (
                  <>
                    <QueuedChainSkeleton />
                    <QueuedChainSkeleton />
                    <QueuedChainSkeleton />
                  </>
                ) : (
                  completedChains.map((queuedChain) => {
                    const chain = chains.find(
                      (c) => c.id === queuedChain.chainId,
                    );
                    if (!chain) return null;
                    return (
                       <Card
                         key={queuedChain.id}
                         name={chain.name || ""}
                         actions={
                           <>
                             <Button
                               href={`/results/${queuedChain.id}`}
                               variant="primary"
                               size="sm"
                             >
                               View Results
                             </Button>
                           </>
                         }
                        stepsCount={queuedChain.steps?.length || 0}
                        stepsCompletedCount={
                          queuedChain.steps?.filter(
                            (step: SelectQueuedChainStep) => step.status === "completed",
                          ).length || 0
                        }
                        error={queuedChain.error || ""}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          {/* Prompt Chains Section */}
          {activeTab === 'chains' && (
            <section className="bg-background-light rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">Prompt Chains</h2>
                <Button
                  variant="tertiary"
                  className="!bg-transparent text-foreground p-2 rounded-lg"
                  onClick={() => setShowAddChainModal(true)}
                >
                  +
                </Button>
              </div>
              <div className="flex flex-col gap-4">
                {loading ? (
                  <>
                    <ChainSkeleton />
                    <ChainSkeleton />
                    <ChainSkeleton />
                  </>
                ) : (
                  chains.map((chain) => (
                    <MobileCard
                      key={chain.id}
                      name={chain.name || ""}
                      actions={
                        <>
                          <Button
                            href={`/chain/${chain.id}`}
                            variant="tertiary"
                            size="sm"
                            className="border-foreground border-1 text-foreground hover:border-foreground-light hover:text-foreground-light"
                          >
                            Edit
                          </Button>
                          <button
                            onClick={() => handleAddChainToQueue(chain.id)}
                            className="bg-foreground text-foreground py-1 px-2 rounded hover:bg-background-light-light cursor-pointer transition duration-200 text-sm"
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
            </section>
          )}

          {/* In Progress Section */}
          {activeTab === 'in-progress' && (
            <section className="bg-background-light rounded-lg p-4">
              <h2 className="text-lg font-bold text-foreground py-2 mb-4">
                In Progress
              </h2>
              <div className="flex flex-col gap-4">
                {loading ? (
                  <>
                    <QueuedChainSkeleton />
                    <QueuedChainSkeleton />
                    <QueuedChainSkeleton />
                  </>
                ) : (
                  inProgressChains.map((queuedChain) => {
                    const chain = chains.find(
                      (c) => c.id === queuedChain.chainId,
                    );
                    if (!chain) return null;
                    return (
                      <MobileCard
                        key={queuedChain.id}
                        name={chain.name || ""}
                        actions={
                          <>
                            <Button
                              href={`/results/${queuedChain.id}`}
                              variant="tertiary"
                              size="sm"
                              className="border-foreground border-1 text-foreground hover:border-foreground-light hover:text-foreground-light"
                            >
                              View
                            </Button>
                            {queuedChain.status === "processing" && (
                              <button
                                className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 cursor-pointer transition duration-200 text-sm"
                                onClick={() =>
                                  handleStopChain(queuedChain.id)
                                }
                              >
                                Stop
                              </button>
                            )}
                            {queuedChain.status === "stopped" && (
                              <button
                                className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 cursor-pointer transition duration-200 text-sm"
                                onClick={() =>
                                  handleResumeChain(queuedChain.id)
                                }
                              >
                                Resume
                              </button>
                            )}
                          </>
                        }
                        stepsCount={queuedChain.steps?.length || 0}
                        stepsCompletedCount={
                          queuedChain.steps?.filter(
                            (step: SelectQueuedChainStep) => step.status === "completed",
                          ).length || 0
                        }
                        error={queuedChain.error || ""}
                      />
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* Completed Section */}
          {activeTab === 'completed' && (
            <section className="bg-background-light rounded-lg p-4">
              <h2 className="font-bold text-foreground py-2 mb-4">
                Completed
              </h2>
              <div className="flex flex-col gap-4">
                {loading ? (
                  <>
                    <QueuedChainSkeleton />
                    <QueuedChainSkeleton />
                    <QueuedChainSkeleton />
                  </>
                ) : (
                  completedChains.map((queuedChain) => {
                    const chain = chains.find(
                      (c) => c.id === queuedChain.chainId,
                    );
                    if (!chain) return null;
                    return (
                      <MobileCard
                        key={queuedChain.id}
                        name={chain.name || ""}
                         actions={
                           <>
                              <Button
                                href={`/results/${queuedChain.id}`}
                                variant="outline"
                                size="sm"
                              >
                               View Results
                             </Button>
                           </>
                         }
                        stepsCount={queuedChain.steps?.length || 0}
                        stepsCompletedCount={
                          queuedChain.steps?.filter(
                            (step: SelectQueuedChainStep) => step.status === "completed",
                          ).length || 0
                        }
                        error={queuedChain.error || ""}
                      />
                    );
                  })
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {showAddChainModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-background-light p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Add New Chain</h2>
              <Button
                onClick={() => setShowAddChainModal(false)}
                variant="tertiary"
                className="!bg-transparent !p-0 text-gray-400 hover:text-gray-600"
              >
                ✕
              </Button>
            </div>
            <form onSubmit={handleCreateChain}>
              <div className="mb-6">
                <label
                  htmlFor="chainName"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Chain Name
                </label>
                <input
                  type="text"
                  id="chainName"
                  value={newChainName}
                  onChange={(e) => setNewChainName(e.target.value)}
                  className="w-full p-3 bg-background-light border border-foreground/20 rounded-lg focus:outline-none focus:border-foreground transition duration-200 text-foreground"
                  placeholder="Enter chain name..."
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  onClick={() => setShowAddChainModal(false)}
                  variant="tertiary"
                  className="!bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Add Chain
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <VariablesModal
        isOpen={showVariablesModal}
        onClose={handleVariablesModalClose}
        onSubmit={handleVariablesSubmit}
        chainId={selectedChainForQueue?.id || 0}
        chainName={selectedChainForQueue?.name || ""}
      />
    </div>
  );
}

// Desktop Card Component
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
    <div className="rounded-lg shadow hover:shadow-md transition duration-200 bg-background-extra-light overflow-hidden">
      <div className="p-4">
        <div>
          <h3 className="text-md text-foreground font-semibold">{name}</h3>
          <div className="text-sm text-text-muted mt-1">
            {error && <span className="text-error ml-2">(Error)</span>}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-flex-end p-4">
        <div>
          {showProgress ? (
            <p className="text-sm font-bold text-foreground">
              {stepsCompletedCount}/{stepsCount} Steps Processed
            </p>
          ) : (
            <p className="text-sm font-bold text-foreground">{stepsCount} Steps</p>
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

// Mobile Card Component
const MobileCard = ({
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
    <div className="border-foreground border-1 rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-md text-foreground font-semibold">{name}</h3>
            <div className="text-sm text-text-muted mt-1">
              {error && <span className="text-error">(Error)</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">{actions}</div>
        </div>
        <div className="mt-3">
          {showProgress ? (
            <p className="text-sm font-bold text-foreground">
              {stepsCompletedCount}/{stepsCount} Steps Processed
            </p>
          ) : (
            <p className="text-sm font-bold text-foreground">{stepsCount} Steps</p>
          )}
        </div>
      </div>
      {showProgress && stepsCount > 0 && (
        <ProgressBar completed={stepsCompletedCount} total={stepsCount} />
      )}
    </div>
  );
};
