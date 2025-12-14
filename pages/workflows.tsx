import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Plus, Workflow as WorkflowIcon, Settings, Play, Trash2 } from 'lucide-react';
import { Button } from "@/components/Button";
import ProfileDropdown from "@/components/ProfileDropdown";
import SubscriptionCard from "@/components/SubscriptionCard";
import ThemeToggle from "@/components/ThemeToggle";

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const WorkflowCard = ({ workflow, onDelete }: { workflow: Workflow; onDelete: (id: number) => void }) => {
  const runWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflow/${workflow.id}/execute`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        // TODO: Show success message
      } else {
        // TODO: Show error message
      }
    } catch (err) {
      // TODO: Show error message
      console.error(err);
    }
  };
  
  return (
    <div className="flex flex-col justify-between rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden">
      <div
        className="p-4 cursor-pointer h-full hover:bg-background-extra-light transition-colors"
        onClick={() => window.location.href = `/workflow/${workflow.id}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-md text-foreground font-semibold mb-2">{workflow.name}</h3>
            {workflow.description && (
              <p className="text-sm text-foreground-light mb-3">{workflow.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                workflow.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : workflow.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {workflow.status}
              </span>
              <span className="text-xs text-gray-500">
                Updated {new Date(workflow.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center p-4 border-t border-primary/10">
        <div className="flex gap-2">
          <Button
            href={`/workflow/${workflow.id}/edit`}
            variant="tertiary"
            size="sm"
          >
            <Settings size={14} />
            Edit
          </Button>
          <Button variant="primary" size="sm" href={`/workflow/${workflow.id}/execution`}>
            <Play size={14} />
            Run
          </Button>
        </div>
        <Button
          onClick={() => onDelete(workflow.id)}
          variant="tertiary"
          className="!bg-transparent !p-1 text-red-500 hover:text-red-700"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};

const WorkflowSkeleton = () => (
  <div className="flex flex-col justify-between rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden animate-pulse">
    <div className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-5 w-40 bg-primary/20 rounded mb-2"></div>
          <div className="h-4 w-56 bg-primary/20 rounded mb-3"></div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-primary/20 rounded"></div>
            <div className="h-4 w-24 bg-primary/20 rounded"></div>
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-between items-center p-4 border-t border-primary/10">
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-primary/20 rounded"></div>
        <div className="h-8 w-14 bg-primary/20 rounded"></div>
        <div className="h-8 w-16 bg-primary/20 rounded"></div>
      </div>
      <div className="h-8 w-8 bg-primary/20 rounded"></div>
    </div>
  </div>
);

export default function Workflows() {
  const { data: session, status } = useSession();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchWorkflows();
  }, [session, status, router]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workflows");
      const data = await response.json();

      if (data.success) {
        setWorkflows(data.workflows || []);
      } else {
        setError(data.message || "Failed to fetch workflows");
      }
    } catch (err) {
      setError("An error occurred while fetching workflows");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        setShowCreateModal(false);
        setNewWorkflowName("");
        setNewWorkflowDescription("");
        router.push(`/workflow/${data.workflow.id}/edit`);
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
        fetchWorkflows(); // Refresh the list
      } else {
        setError(data.message || "Failed to delete workflow");
      }
    } catch (err) {
      setError("An error occurred while deleting the workflow");
      console.error(err);
    }
  };

  return (
    <div>
      <Head>
        <title>Workflows - ZeitFlow</title>
        <meta name="description" content="Manage your automation workflows" />
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
            <SubscriptionCard onSubscriptionChange={() => {}} />
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
              ×
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Workflows</h1>
            <p className="text-foreground-light">Create and manage your automation workflows</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
          >
            <Plus size={20} />
            Create Workflow
          </Button>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <WorkflowSkeleton />
              <WorkflowSkeleton />
              <WorkflowSkeleton />
              <WorkflowSkeleton />
              <WorkflowSkeleton />
              <WorkflowSkeleton />

            </>
          ) : workflows.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <WorkflowIcon size={64} className="mx-auto text-foreground-light mb-4" />
              <h3 className="text-xl font-medium text-foreground-light mb-2">No workflows yet</h3>
              <p className="text-foreground-light mb-6">Create your first automation workflow to get started</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
              >
                Create Your First Workflow
              </Button>
            </div>
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
      </main>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-background-light p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">Create New Workflow</h2>
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="tertiary"
                className="!bg-transparent !p-0 text-gray-400 hover:text-gray-600"
              >
                ✕
              </Button>
            </div>
            <form onSubmit={handleCreateWorkflow}>
              <div className="mb-4">
                <label
                  htmlFor="workflowName"
                  className="block text-sm font-medium text-primary mb-2"
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
                  className="block text-sm font-medium text-primary mb-2"
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
                  onClick={() => setShowCreateModal(false)}
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
    </div>
  );
}
