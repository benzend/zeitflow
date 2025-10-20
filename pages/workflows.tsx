import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Plus, Workflow as WorkflowIcon, Settings, Play, Trash2 } from 'lucide-react';
import Link from "next/link";
import ProfileDropdown from "@/components/ProfileDropdown";
import SubscriptionCard from "@/components/SubscriptionCard";

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const WorkflowCard = ({ workflow, onDelete }: { workflow: Workflow; onDelete: (id: number) => void }) => {
  return (
    <div className="border-[#a3e635] border-1 rounded-lg shadow hover:shadow-md transition duration-200 bg-foreground-light overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-md text-[#a3e635] font-semibold mb-2">{workflow.name}</h3>
            {workflow.description && (
              <p className="text-sm text-gray-400 mb-3">{workflow.description}</p>
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
      <div className="flex justify-between items-center p-4 bg-foreground border-t border-primary/10">
        <div className="flex gap-2">
          <Link
            href={`/workflow/${workflow.id}`}
            className="flex items-center gap-1 border-primary border-1 text-primary py-1 px-3 rounded hover:border-primary-light hover:text-primary-light cursor-pointer transition duration-200 text-sm"
          >
            <Settings size={14} />
            Edit
          </Link>
          <button className="flex items-center gap-1 bg-primary text-[#18181b] py-1 px-3 rounded hover:bg-primary-light cursor-pointer transition duration-200 text-sm">
            <Play size={14} />
            Run
          </button>
        </div>
        <button
          onClick={() => onDelete(workflow.id)}
          className="text-red-500 hover:text-red-700 transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const WorkflowSkeleton = () => (
  <div className="border-primary border-1 rounded-lg shadow p-4 bg-foreground-light animate-pulse">
    <div className="h-6 w-32 bg-primary/20 rounded mb-2"></div>
    <div className="h-4 w-48 bg-primary/20 rounded mb-3"></div>
    <div className="flex gap-2">
      <div className="h-6 w-16 bg-primary/20 rounded"></div>
      <div className="h-6 w-24 bg-primary/20 rounded"></div>
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
        fetchWorkflows(); // Refresh the list
      } else {
        setError(data.message || "Failed to delete workflow");
      }
    } catch (err) {
      setError("An error occurred while deleting the workflow");
      console.error(err);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Head>
        <title>Workflows - jjoist</title>
        <meta name="description" content="Manage your automation workflows" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-6 max-w-6xl min-h-[90vh]">
        {/* Navigation */}
        <nav className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <span className="text-primary underline hover:text-primary-light transition duration-200">
                Dashboard
              </span>
            </Link>
            <Link href="/workflows">
              <span className="text-primary underline hover:text-primary-light transition duration-200 text-lg font-semibold">
                Workflows
              </span>
            </Link>
          </div>

          <div className="flex gap-4 items-center">
            <SubscriptionCard onSubscriptionChange={() => {}} />
            <ProfileDropdown />
          </div>
        </nav>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
            <button 
              onClick={() => setError("")} 
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Workflows</h1>
            <p className="text-gray-400">Create and manage your automation workflows</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-[#18181b] px-4 py-2 rounded-lg hover:bg-primary-light transition duration-200 font-medium"
          >
            <Plus size={20} />
            Create Workflow
          </button>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <WorkflowSkeleton />
              <WorkflowSkeleton />
              <WorkflowSkeleton />
            </>
          ) : workflows.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <WorkflowIcon size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">No workflows yet</h3>
              <p className="text-gray-400 mb-6">Create your first automation workflow to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-[#18181b] px-6 py-3 rounded-lg hover:bg-primary-light transition duration-200 font-medium"
              >
                Create Your First Workflow
              </button>
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
          <div className="bg-foreground p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">Create New Workflow</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                ✕
              </button>
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
                  className="w-full p-3 bg-foreground-light border border-primary/20 rounded-lg focus:outline-none focus:border-primary transition duration-200 text-primary"
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
                  className="w-full p-3 bg-foreground-light border border-primary/20 rounded-lg focus:outline-none focus:border-primary transition duration-200 text-primary resize-none"
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-primary hover:text-primary-light transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-[#18181b] py-2 px-6 rounded-lg hover:bg-primary-light transition duration-200 font-medium"
                >
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}