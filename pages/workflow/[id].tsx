import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Play, Edit, TrendingUp, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import { Button } from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileDropdown from "@/components/ProfileDropdown";
import WorkflowStatsSkeleton from "@/components/WorkflowStatsSkeleton";

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionStats {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
}

interface RecentExecution {
  id: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  duration: number | null;
  url: string;
}

export default function WorkflowStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (id && !Array.isArray(id)) {
      fetchWorkflowStats(parseInt(id, 10));
    }
  }, [session, status, router, id]);

  const fetchWorkflowStats = async (workflowId: number) => {
    try {
      setLoading(true);

      // Fetch workflow info
      const workflowResponse = await fetch(`/api/workflow/${workflowId}`);
      const workflowData = await workflowResponse.json();

      if (!workflowData.success) {
        setError(workflowData.message || "Failed to fetch workflow");
        return;
      }

      setWorkflow(workflowData.workflow);

      // Fetch stats
      const statsResponse = await fetch(`/api/workflow/${workflowId}/stats`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.stats);
        setRecentExecutions(statsData.recentExecutions);
      } else {
        setError(statsData.message || "Failed to fetch stats");
      }
    } catch (err) {
      setError("An error occurred while fetching workflow stats");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'running': return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (status === "loading" || loading) {
    return <WorkflowStatsSkeleton />;
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
        <title>{workflow?.name || "Workflow"} Stats - ZeitFlow</title>
        <meta name="description" content="View workflow execution statistics and history" />
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
            <h1 className="text-3xl font-bold text-primary mb-2">{workflow?.name}</h1>
            <p className="text-foreground-light">Workflow execution statistics</p>
          </div>
          <div className="flex gap-2">
            <Button
              href={`/workflow/${workflow?.id}/execution`}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run
            </Button>
            <Button
              href={`/workflow/${workflow?.id}/edit`}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-background-light rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-medium text-foreground-light">Total Executions</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalExecutions}</p>
            </div>

            <div className="bg-background-light rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-medium text-foreground-light">Success Rate</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.successRate.toFixed(1)}%</p>
            </div>

            <div className="bg-background-light rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-medium text-foreground-light">Avg Duration</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.averageDuration > 0 ? formatDuration(stats.averageDuration) : 'N/A'}
              </p>
            </div>

            <div className="bg-background-light rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-medium text-foreground-light">Completed</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.completedExecutions}</p>
            </div>
          </div>
        )}

        {/* Recent Executions */}
        <div className="bg-background-light rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Executions</h2>
          {recentExecutions.length > 0 ? (
            <div className="space-y-3">
              {recentExecutions.map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-4 bg-background-extra-light rounded-lg hover:bg-background-extra-light/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 ${getStatusColor(execution.status)}`}>
                      {getStatusIcon(execution.status)}
                      <span className="text-sm font-medium capitalize">{execution.status}</span>
                    </div>
                    <div className="text-sm text-foreground-light">
                      {formatDate(execution.startedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {execution.duration && (
                      <div className="text-sm text-foreground-light">
                        Duration: {formatDuration(execution.duration)}
                      </div>
                    )}
                    {execution.error && (
                      <div className="text-sm text-red-600 max-w-xs truncate" title={execution.error}>
                        {execution.error}
                      </div>
                    )}
                    <Button
                      href={execution.url}
                      variant="tertiary"
                      className="!bg-transparent !p-0 underline hover:text-primary-light text-sm"
                    >
                      View Details →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-foreground-light mx-auto mb-4" />
              <p className="text-foreground-light">No executions yet</p>
              <p className="text-sm text-foreground-light mt-2">
                Run this workflow to see execution history and statistics
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
