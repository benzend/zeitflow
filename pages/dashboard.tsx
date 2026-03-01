import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Plus } from 'lucide-react';
import GetStarted from "@/components/GetStarted";
import { SelectChain, SelectQueuedChainWithStatus, SelectQueuedChainStep } from "@/schema";
import { Button } from "@/components/Button";
import { Tabs } from "@/components/Tabs";
import { WorkflowCard, WorkflowSkeleton, Workflow } from "@/components/WorkflowCard";
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
          className="bg-primary h-1 transition-all rounded-full duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Top-level tab state (workflows vs chains vs templates)
  const [dashboardTab, setDashboardTab] = useState<'workflows' | 'chains' | 'templates'>('workflows');

  // Chains sub-tab state (for mobile)
  const [chainsSubTab, setChainsSubTab] = useState<'chains' | 'in-progress' | 'completed'>('chains');

  // Chains state
  const [chains, setChains] = useState<ChainWithStepCount[]>([]);
  const [queuedChains, setQueuedChains] = useState<SelectQueuedChainWithStatus[]>([]);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [chainsFetched, setChainsFetched] = useState(false);

  // Workflows state
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [workflowsFetched, setWorkflowsFetched] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesFetched, setTemplatesFetched] = useState(false);

  const [error, setError] = useState("");
  const [newChainName, setNewChainName] = useState("");
  const [showAddChainModal, setShowAddChainModal] = useState(false);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [selectedChainForQueue, setSelectedChainForQueue] = useState<ChainWithStepCount | null>(null);

  // Workflow creation modal
  const [showCreateWorkflowModal, setShowCreateWorkflowModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");

  // Sync tab state with URL query param
  useEffect(() => {
    const { tab } = router.query;
    if (tab === 'chains' || tab === 'workflows' || tab === 'templates') {
      setDashboardTab(tab);
    }
  }, [router.query]);

  // Update URL when tab changes (without full navigation)
  const handleTabChange = (tabId: string) => {
    const newTab = tabId as 'workflows' | 'chains' | 'templates';
    setDashboardTab(newTab);
    router.replace({ pathname: '/dashboard', query: { tab: newTab } }, undefined, { shallow: true });
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    if (workflowsFetched) return;

    try {
      setWorkflowsLoading(true);
      const response = await fetch("/api/workflows");
      const data = await response.json();

      if (data.success) {
        setWorkflows(data.workflows || []);
        setWorkflowsFetched(true);
      } else {
        setError(data.message || "Failed to fetch workflows");
      }
    } catch (err) {
      setError("An error occurred while fetching workflows");
      console.error(err);
    } finally {
      setWorkflowsLoading(false);
    }
  }, [workflowsFetched]);

  // Fetch templates (user's templates)
  const fetchTemplates = useCallback(async () => {
    if (templatesFetched) return;

    try {
      setTemplatesLoading(true);
      // Fetch only user's templates for dashboard
      const response = await fetch("/api/templates?visibility=private");
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
        setTemplatesFetched(true);
      } else {
        setError(data.message || "Failed to fetch templates");
      }
    } catch (err) {
      setError("An error occurred while fetching templates");
      console.error(err);
    } finally {
      setTemplatesLoading(false);
    }
  }, [templatesFetched]);

  // Fetch chains
  const fetchChains = useCallback(async (opts = { silent: false, force: false }) => {
    if (chainsFetched && !opts.force && !opts.silent) return;

    try {
      if (!opts.silent) setChainsLoading(true);
      const response = await fetch("/api/dashboard");
      const data = await response.json();

      if (data.success) {
        setChains(data.chains || []);
        setQueuedChains(data.queuedChains || []);
        setChainsFetched(true);
      } else {
        setError(data.message || "Failed to fetch chains");
      }
    } catch (err) {
      setError("An error occurred while fetching chains");
      console.error(err);
    } finally {
      if (!opts.silent) setChainsLoading(false);
    }
  }, [chainsFetched]);

  // Fetch data based on active tab
  useEffect(() => {
    if (!session) return;

    if (dashboardTab === 'workflows' && !workflowsFetched) {
      fetchWorkflows();
    } else if (dashboardTab === 'chains' && !chainsFetched) {
      fetchChains();
    } else if (dashboardTab === 'templates' && !templatesFetched) {
      fetchTemplates();
    }
  }, [session, dashboardTab, workflowsFetched, chainsFetched, templatesFetched, fetchWorkflows, fetchChains, fetchTemplates]);

  // Auto-refresh chains when watching is enabled
  useEffect(() => {
    if (!session || dashboardTab !== 'chains') return;

    const interval = setInterval(() => {
      fetchChains({ silent: true, force: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [session, dashboardTab, fetchChains]);

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
        fetchChains({ silent: true, force: true });
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
        fetchChains({ silent: true, force: true });
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
        fetchChains({ silent: true, force: true });
      } else {
        setError(data.message || "Failed to resume chain");
      }
    } catch (err) {
      setError("An error occurred while resuming the chain");
      console.error(err);
    }
  };

  // Workflow handlers
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWorkflowName.trim()) {
      setError("Workflow name is required");
      return;
    }

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newWorkflowName,
          description: newWorkflowDescription,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateWorkflowModal(false);
        setNewWorkflowName("");
        setNewWorkflowDescription("");
        router.push(`/workflow/${data.workflow.id}`);
      } else {
        setError(data.message || "Failed to create workflow");
      }
    } catch (err) {
      setError("An error occurred while creating the workflow");
      console.error(err);
    }
  };

  const handleDeleteWorkflow = async (workflowId: number) => {
    if (!confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/workflow/${workflowId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setWorkflows(workflows.filter(w => w.id !== workflowId));
      } else {
        setError(data.message || "Failed to delete workflow");
      }
    } catch (err) {
      setError("An error occurred while deleting the workflow");
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

  const topLevelTabs = [
    { id: 'workflows', label: 'Workflows', count: workflowsFetched ? workflows.length : undefined },
    { id: 'chains', label: 'Chains', count: chainsFetched ? chains.length : undefined },
    { id: 'templates', label: 'Templates', count: templatesFetched ? templates.length : undefined },
  ];

  const chainsSubTabs = [
    { id: 'chains', label: 'Prompt Chains', count: chains.length },
    { id: 'in-progress', label: 'In Progress', count: inProgressChains.length },
    { id: 'completed', label: 'Completed', count: completedChains.length },
  ];

  return (
    <div>
      <Head>
        <title>Dashboard - ZeitFlow</title>
        <meta name="description" content="Manage your AI workflows and chains" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-6 max-w-6xl min-h-[90vh]">
        {/* Navigation */}
        <nav className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button href="/dashboard" variant="clear" className="underline hover:text-foreground-light text-lg font-semibold">
                Dashboard
              </Button>
            </div>
            {dashboardTab === 'workflows' && (
              <Button
                className="sm:hidden text-foreground p-2 rounded-lg text-xl"
                variant="tertiary"
                onClick={() => setShowCreateWorkflowModal(true)}
              >
                +
              </Button>
            )}
            {dashboardTab === 'chains' && (
              <Button
                className="sm:hidden text-foreground p-2 rounded-lg text-xl"
                variant="tertiary"
                onClick={() => setShowAddChainModal(true)}
              >
                +
              </Button>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <SubscriptionModal onSubscriptionChange={() => fetchChains({ silent: true, force: true })} />
            <ProfileDropdown />
          </div>
        </nav>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
            <Button
              onClick={() => setError("")}
              variant="tertiary"
              className="!bg-transparent !p-0 float-right text-red-700 hover:text-red-900"
            >
              x
            </Button>
          </div>
        )}

        {/* Top-level Tabs */}
        <div className="mb-6">
          <Tabs
            tabs={topLevelTabs}
            activeTab={dashboardTab}
            onTabChange={handleTabChange}
            variant="underline"
          />
        </div>

        {/* Workflows Tab Content */}
        {dashboardTab === 'workflows' && (
          <>
            {/* Header */}
            <div className="hidden sm:flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Workflows</h1>
                <p className="text-foreground-light text-sm">Create and manage your automation workflows</p>
              </div>
              <Button
                onClick={() => setShowCreateWorkflowModal(true)}
                variant="primary"
              >
                <Plus size={20} />
                Create Workflow
              </Button>
            </div>

            {/* Workflows Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflowsLoading ? (
                <>
                  <WorkflowSkeleton />
                  <WorkflowSkeleton />
                  <WorkflowSkeleton />
                  <WorkflowSkeleton />
                  <WorkflowSkeleton />
                  <WorkflowSkeleton />
                </>
              ) : workflows.length === 0 ? (
                <GetStarted onCreateWorkflow={() => setShowCreateWorkflowModal(true)} />
              ) : (
                workflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    onDelete={handleDeleteWorkflow}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Chains Tab Content */}
        {dashboardTab === 'chains' && (
          <>
            {/* Mobile Tab Navigation for Chains Sub-tabs */}
            <div className="sm:hidden mb-6">
              <Tabs
                tabs={chainsSubTabs}
                activeTab={chainsSubTab}
                onTabChange={(tabId) => setChainsSubTab(tabId as 'chains' | 'in-progress' | 'completed')}
              />
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
                    {chainsLoading ? (
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
                    {chainsLoading ? (
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
                    {chainsLoading ? (
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

            {/* Mobile Layout for Chains */}
            <div className="sm:hidden">
              {/* Prompt Chains Section */}
              {chainsSubTab === 'chains' && (
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
                    {chainsLoading ? (
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
              {chainsSubTab === 'in-progress' && (
                <section className="bg-background-light rounded-lg p-4">
                  <h2 className="text-lg font-bold text-foreground py-2 mb-4">
                    In Progress
                  </h2>
                  <div className="flex flex-col gap-4">
                    {chainsLoading ? (
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
              {chainsSubTab === 'completed' && (
                <section className="bg-background-light rounded-lg p-4">
                  <h2 className="font-bold text-foreground py-2 mb-4">
                    Completed
                  </h2>
                  <div className="flex flex-col gap-4">
                    {chainsLoading ? (
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
          </>
        )}

        {/* Templates Tab Content */}
        {dashboardTab === 'templates' && (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">My Templates</h1>
                <p className="text-foreground-light text-sm">Manage your workflow templates</p>
              </div>
              <Button
                href="/templates"
                variant="secondary"
              >
                Browse Marketplace
              </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templatesLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col justify-between rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden animate-pulse">
                      <div className="h-32 bg-primary/20"></div>
                      <div className="p-4 flex-1">
                        <div className="h-5 w-32 bg-primary/20 rounded mb-2"></div>
                        <div className="h-4 w-full bg-primary/20 rounded mb-2"></div>
                        <div className="h-4 w-3/4 bg-primary/20 rounded"></div>
                      </div>
                      <div className="flex gap-2 p-4 border-t border-primary/10">
                        <div className="h-8 flex-1 bg-primary/20 rounded"></div>
                        <div className="h-8 flex-1 bg-primary/20 rounded"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : templates.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-medium text-foreground-light mb-2">No templates yet</h3>
                  <p className="text-foreground-light mb-6">
                    Save your workflows as templates to reuse them later, or browse the marketplace for inspiration.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      href="/templates"
                      variant="primary"
                    >
                      Browse Marketplace
                    </Button>
                    <Button
                      href="/dashboard?tab=workflows"
                      variant="secondary"
                    >
                      View My Workflows
                    </Button>
                  </div>
                </div>
              ) : (
                templates.map((template: any) => (
                  <div key={template.id} className="flex flex-col justify-between rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      {template.previewImage ? (
                        <img src={template.previewImage} alt={template.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl">{template.icon || '📋'}</span>
                      )}
                      {template.visibility === 'public' && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs bg-blue-500 text-white font-semibold">
                          Public
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1">
                      <h3 className="text-md text-foreground font-semibold mb-2">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-foreground-light line-clamp-2">{template.description}</p>
                      )}
                      <div className="mt-3 text-xs text-gray-500">
                        {template.useCount} {template.useCount === 1 ? 'use' : 'uses'}
                      </div>
                    </div>
                    <div className="flex gap-2 p-4 border-t border-primary/10">
                      <Button
                        href={`/templates?id=${template.id}`}
                        variant="tertiary"
                        size="sm"
                        className="flex-1"
                      >
                        View
                      </Button>
                      <Button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this template?')) {
                            try {
                              const response = await fetch(`/api/templates/${template.id}`, { method: 'DELETE' });
                              const data = await response.json();
                              if (data.success) {
                                setTemplates(templates.filter((t: any) => t.id !== template.id));
                              } else {
                                alert(data.message || 'Failed to delete template');
                              }
                            } catch (err) {
                              alert('Failed to delete template');
                            }
                          }
                        }}
                        variant="tertiary"
                        size="sm"
                        className="!bg-transparent !p-1 text-red-500 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Add Chain Modal */}
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
                x
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

      {/* Create Workflow Modal */}
      {showCreateWorkflowModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-background-light p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Create New Workflow</h2>
              <Button
                onClick={() => setShowCreateWorkflowModal(false)}
                variant="tertiary"
                className="!bg-transparent !p-0 text-gray-400 hover:text-gray-600"
              >
                x
              </Button>
            </div>
            <form onSubmit={handleCreateWorkflow}>
              <div className="mb-4">
                <label
                  htmlFor="workflowName"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Workflow Name
                </label>
                <input
                  type="text"
                  id="workflowName"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="w-full p-3 bg-input-background border border-foreground rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-primary transition duration-200 text-foreground placeholder-text-placeholder"
                  placeholder="Enter workflow name..."
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="workflowDescription"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="workflowDescription"
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-input-background border border-foreground rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus transition duration-200 text-foreground placeholder-text-placeholder resize-none"
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateWorkflowModal(false)}
                  variant="tertiary"
                  className="!bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Create Workflow
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
