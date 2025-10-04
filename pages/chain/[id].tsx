import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { SelectChain, SelectChainStep } from "@/schema";
import VariablesModal from "@/components/VariablesModal";
import { HighlightedText } from "@/lib/highlight-variables";
import { extractVariablesFromChainSteps } from "@/lib/variables-client";
import TypeaheadTextarea from "@/components/TypeaheadTextarea";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "react-tippy";

// Add skeleton components
const ChainInfoSkeleton = () => (
  <div className="rounded-lg mb-8 animate-pulse">
    <div className="h-10 w-64 bg-[#a3e635]/20 rounded mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-foreground border border-primary/20 p-4 rounded-lg">
        <div className="h-6 w-32 bg-primary/20 rounded"></div>
      </div>
      <div className="bg-foreground border border-primary/20 p-4 rounded-lg">
        <div className="h-6 w-40 bg-primary/20 rounded"></div>
      </div>
      <div className="bg-foreground border border-primary/20 p-4 rounded-lg">
        <div className="h-6 w-24 bg-primary/20 rounded"></div>
      </div>
    </div>
  </div>
);

const ChainStepSkeleton = () => (
  <div className="bg-foreground-light border border-primary/20 p-4 rounded-lg mb-4 animate-pulse">
    <div className="h-6 w-16 bg-primary/20 rounded mb-2"></div>
    <div className="h-6 w-full bg-primary/20 rounded"></div>
  </div>
);

const VERBOSE_MODELS = {
  "google/gemini-2.0-flash-001": "Gemini 2.0",
  "openai/gpt-4": "GPT-4",
  "anthropic/claude-sonnet-4": "Claude Sonnet 4",
} as const;

interface SortableStepProps {
  step: SelectChainStep;
  index: number;
  editingStepId: number | null;
  editStepPrompt: string;
  editStepModel: string;
  onEditStep: (step: SelectChainStep) => void;
  onCancelEditStep: () => void;
  onUpdateStep: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
  setEditStepPrompt: (prompt: string) => void;
  setEditStepModel: (prompt: string) => void;
  getEditStepSuggestions: () => (string | { name: string, description: string })[];
}

const SortableStep = ({
  step,
  index,
  editingStepId,
  editStepPrompt,
  editStepModel,
  onEditStep,
  onCancelEditStep,
  onUpdateStep,
  onDeleteStep,
  setEditStepPrompt,
  setEditStepModel,
  getEditStepSuggestions,
}: SortableStepProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-foreground-light border border-primary/20 p-4 rounded-lg mb-4"
    >
      {editingStepId === step.id ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-primary">
              Edit Step {index + 1}

              <span className="text-xs text-gray-400 ml-4">
                Note: Use {"{{"}variableName{"}}"} to create a variable
              </span>
            </h4>
            <button
              onClick={onCancelEditStep}
              className="text-gray-400 hover:text-gray-600 transition duration-200"
            >
              ✕
            </button>
          </div>
          <TypeaheadTextarea
            value={editStepPrompt}
            onChange={setEditStepPrompt}
            suggestions={getEditStepSuggestions()}
            className="w-full p-3 bg-foreground border border-primary/20 rounded-lg focus:outline-none focus:border-primary transition duration-200 text-primary min-h-[100px] mb-4"
            placeholder="Enter step prompt..."
          />

          <div className="text-xs text-gray-400 mt-2">
            <label htmlFor="model" className="mb-2">Model</label>
            <br />
            <select name="model" id="model" value={editStepModel} onChange={(e) => setEditStepModel(e.target.value)} className="border-gray-300 border px-3 py-2 rounded">
              {Object.keys(VERBOSE_MODELS).map((model) => (
                <option key={model} value={model}>
                  {VERBOSE_MODELS[model as keyof typeof VERBOSE_MODELS]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancelEditStep}
              className="px-3 py-1 text-primary hover:text-primary-light transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onUpdateStep(step.id)}
              className="bg-primary text-[#18181b] py-1 px-3 rounded hover:bg-primary-light transition duration-200"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                title="Drag to reorder"
              >
                ⋮⋮
              </div>
              <span className="font-semibold text-primary">
                Step {index + 1}:
              </span>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEditStep(step)}
                className="text-blue-500 hover:text-blue-600 transition duration-200 text-sm"
                title="Edit step"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteStep(step.id)}
                className="text-red-500 hover:text-red-600 transition duration-200 text-sm"
                title="Delete step"
              >
                Delete
              </button>
            </div>
          </div>
          <HighlightedText
            text={step.prompt}
            className="text-primary whitespace-pre-wrap block"
          />
          <div className="text-xs text-gray-400 mt-2">
            Model: {VERBOSE_MODELS[step.model as keyof typeof VERBOSE_MODELS]}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ChainDetail() {
  const [chain, setChain] = useState<SelectChain | null>(null);
  const [chainSteps, setChainSteps] = useState<SelectChainStep[] | null>(null);
  const [runChain, setRunChain] = useState(false);
  const [addChainStep, setAddChainStep] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [chainName, setChainName] = useState("");
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editStepPrompt, setEditStepPrompt] = useState("");
  const [editStepModel, setEditStepModel] = useState("");
  const [newStepPrompt, setNewStepPrompt] = useState("");
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  // Safely get available variables for editing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getEditStepSuggestions = () => {
    try {
      if (!chainSteps || !Array.isArray(chainSteps) || !editingStepId) {
        return [];
      }
      const otherSteps = chainSteps.filter((step: SelectChainStep) => step.id !== editingStepId);
      return [...extractVariablesFromChainSteps(otherSteps), { name: 'previousOutput', description: 'The output of the previous step' }];
    } catch (error) {
      console.error('Error extracting variables for edit step:', error);
      return [];
    }
  };

  // Safely get available variables for new step
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getNewStepSuggestions = () => {
    try {
      if (!chainSteps || !Array.isArray(chainSteps)) {
        return [];
      }
      return extractVariablesFromChainSteps(chainSteps);
    } catch (error) {
      console.error('Error extracting variables for new step:', error);
      return [];
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (id) {
      fetchChain(id as string);
    }
  }, [id]);

  const fetchChain = async (chainId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard?id=${chainId}`);
      const data = await response.json();

      if (data.success && data.chains && data.chains.length > 0) {
        setChain(data.chains[0]);
        setChainName(data.chains[0].name);
        setChainSteps(data.chainSteps);
      } else {
        setError(data.message || "Failed to fetch chain");
      }
    } catch (err) {
      setError("An error occurred while fetching the chain");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chainName.trim()) {
      setError("Chain name is required");
      return;
    }

    try {
      const response = await fetch(`/api/dashboard?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: chainName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditMode(false);
        fetchChain(id as string);
      } else {
        setError(data.message || "Failed to update chain");
      }
    } catch (err) {
      setError("An error occurred while updating the chain");
      console.error(err);
    }
  };

  const handleDeleteChain = async () => {
    if (!confirm("Are you sure you want to delete this chain?")) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.message || "Failed to delete chain");
      }
    } catch (err) {
      setError("An error occurred while deleting the chain");
      console.error(err);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  const handleAddChainStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStepPrompt.trim()) {
      setError("Chain step prompt is required");
      return;
    }

    try {
      const response = await fetch(`/api/chain-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: newStepPrompt,
          chainId: id,
          position: chainSteps?.length || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAddChainStep(false);
        setNewStepPrompt("");
        fetchChain(id as string);
      } else {
        setError(data.message || "Failed to add chain step");
      }
    } catch (err) {
      setError("An error occurred while adding the chain step");
      console.error(err);
    }
  };

  const handleRunChain = async () => {
    if (!chain) {
      return;
    }
    // Show variables modal instead of directly running
    setShowVariablesModal(true);
  };

  const handleVariablesSubmit = async (variables: Record<string, string>) => {
    if (!chain) return;

    try {
      const response = await fetch(`/api/add-to-queue?id=${chain.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variables }),
      });

      const data = await response.json();

      if (data.success) {
        setRunChain(true);
        router.push(`/results/${data.queuedChainId}`);
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
  };

  const handleEditStep = (step: SelectChainStep) => {
    setEditingStepId(step.id);
    setEditStepPrompt(step.prompt);
    setEditStepModel(step.model);
  };

  const handleCancelEditStep = () => {
    setEditingStepId(null);
    setEditStepPrompt("");
  };

  const handleUpdateStep = async (stepId: number) => {
    if (!editStepPrompt.trim()) {
      setError("Step prompt is required");
      return;
    }

    try {
      const response = await fetch(`/api/chain-step?id=${stepId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: editStepPrompt,
          model: editStepModel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingStepId(null);
        setEditStepPrompt("");
        fetchChain(id as string);
      } else {
        setError(data.message || "Failed to update step");
      }
    } catch (err) {
      setError("An error occurred while updating the step");
      console.error(err);
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!confirm("Are you sure you want to delete this step?")) {
      return;
    }

    try {
      const response = await fetch(`/api/chain-step?id=${stepId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchChain(id as string);
      } else {
        setError(data.message || "Failed to delete step");
      }
    } catch (err) {
      setError("An error occurred while deleting the step");
      console.error(err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !chainSteps) {
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = chainSteps.findIndex((step) => step.id === active.id);
      const newIndex = chainSteps.findIndex((step) => step.id === over.id);

      const newChainSteps = arrayMove(chainSteps, oldIndex, newIndex);
      setChainSteps(newChainSteps);

      try {
        await Promise.all(
          newChainSteps.map((step, index) =>
            fetch(`/api/chain-step?id=${step.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                position: index,
              }),
            }),
          ),
        );
      } catch (err) {
        setError("An error occurred while reordering steps");
        console.error(err);
        fetchChain(id as string);
      }
    }
  };

  if (loading) {
    return (
      <div>
        <Head>
          <title>Loading Chain - jjoist</title>
          <meta name="description" content="Loading chain details" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="container mx-auto px-4 pb-8 pt-20 max-w-4xl">
          <main className="min-h-[80vh] py-8">
            <div className="flex justify-between items-center mb-8">
              <div className="h-10 w-32 bg-[#a3e635]/20 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-10 w-20 bg-blue-500/20 rounded"></div>
                <div className="h-10 w-20 bg-red-500/20 rounded"></div>
              </div>
            </div>

            <ChainInfoSkeleton />

            <div className="bg-foreground border border-primary/20 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="h-7 w-32 bg-primary/20 rounded"></div>
                <div className="h-10 w-32 bg-primary/20 rounded"></div>
              </div>

              <ChainStepSkeleton />
              <ChainStepSkeleton />
              <ChainStepSkeleton />

              <div className="flex justify-end mt-6">
                <div className="h-10 w-32 bg-[#a3e635]/20 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={handleBackToDashboard}
            className="bg-[#a3e635] text-[#18181b] py-2 px-4 rounded-lg hover:bg-[#bef264] transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!chain) {
    return (
      <div>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-center text-primary">Chain not found</p>
          <div className="text-center mt-4">
            <button
              onClick={handleBackToDashboard}
              className="bg-[#a3e635] text-[#18181b] py-2 px-4 rounded-lg hover:bg-[#bef264] transition duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>{chain.name} - jjoist</title>
        <meta name="description" content={`Details for chain ${chain.name}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 pb-8 pt-20 max-w-4xl">
        <main className="min-h-[80vh] py-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handleBackToDashboard}
              className="bg-[#a3e635] text-[#18181b] py-2 px-4 rounded hover:bg-[#bef264] transition duration-200"
            >
              Back to Dashboard
            </button>
            <div className="flex space-x-2">
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleDeleteChain}
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>

          {editMode ? (
            <div className="bg-foreground rounded-lg shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary">Edit Chain</h2>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setChainName(chain.name || "");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdateChain}>
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
                    value={chainName}
                    onChange={(e) => setChainName(e.target.value)}
                    className="w-full p-3 bg-foreground-light border border-primary/20 rounded-lg focus:outline-none focus:border-primary transition duration-200 text-primary"
                    required
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setChainName(chain.name || "");
                    }}
                    className="px-4 py-2 text-primary hover:text-primary-light transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-light transition duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-lg mb-8">
              <h1 className="text-3xl font-bold text-[#a3e635] mb-4">
                {chain.name}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-foreground border border-primary/20 p-4 rounded-lg">
                  <p className="text-primary">
                    <span className="font-semibold">Created:</span>{" "}
                    {new Date(chain.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-foreground border border-primary/20 p-4 rounded-lg">
                  <p className="text-primary">
                    <span className="font-semibold">Last Updated:</span>{" "}
                    {new Date(chain.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-foreground border border-primary/20 p-4 rounded-lg">
                  <p className="text-primary">
                    <span className="font-semibold">Chain ID:</span> {chain.id}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-foreground border border-primary/20 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">Chain Steps</h2>
              {!addChainStep && (
                <button
                  className="bg-primary text-[#18181b] py-2 px-4 rounded-lg hover:bg-primary-light transition duration-200"
                  onClick={() => setAddChainStep(true)}
                >
                  Add Chain Step
                </button>
              )}
            </div>

            {chainSteps && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={chainSteps.map((step) => step.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {chainSteps.map((step, index) => (
                    <SortableStep
                      key={step.id}
                      step={step}
                      index={index}
                      editingStepId={editingStepId}
                      editStepPrompt={editStepPrompt}
                      editStepModel={editStepModel}
                      onEditStep={handleEditStep}
                      onCancelEditStep={handleCancelEditStep}
                      onUpdateStep={handleUpdateStep}
                      onDeleteStep={handleDeleteStep}
                      setEditStepPrompt={setEditStepPrompt}
                      setEditStepModel={setEditStepModel}
                      getEditStepSuggestions={getEditStepSuggestions}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {addChainStep && (
              <div className="bg-foreground-light border border-primary/20 rounded-lg p-6 mt-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-primary">
                    Add New Step
                  </h3>
                  <button
                    onClick={() => {
                      setAddChainStep(false);
                      setNewStepPrompt("");
                    }}
                    className="text-gray-400 hover:text-gray-600 transition duration-200"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleAddChainStep}>
                  <div className="mb-6">
                    <label
                      htmlFor="chainStepPrompt"
                      className="block text-sm font-medium text-primary mb-2"
                    >
                      Prompt
                    </label>
                    <TypeaheadTextarea
                      id="chainStepPrompt"
                      name="prompt"
                      value={newStepPrompt}
                      onChange={setNewStepPrompt}
                      suggestions={getNewStepSuggestions()}
                      className="w-full p-3 bg-foreground border border-primary/20 rounded-lg focus:outline-none focus:border-primary transition duration-200 text-primary min-h-[100px]"
                      required
                    />

                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setAddChainStep(false);
                        setNewStepPrompt("");
                      }}
                      className="px-4 py-2 text-primary hover:text-primary-light transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-[#18181b] py-2 px-4 rounded-lg hover:bg-primary-light transition duration-200"
                    >
                      Add Step
                    </button>
                  </div>

                </form>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            {chainSteps?.length === 0 ? (
              <Tooltip
                title="Chain must have at least one step"
                trigger="mouseenter"
                placement="bottom"
              >
                <button
                  className="bg-[#a3e635] text-[#18181b] py-2 px-4 rounded-lg hover:bg-[#bef264] transition duration-200 opacity-50 cursor-not-allowed"
                  disabled
                >
                  {runChain ? "Running..." : "Run Chain"}
                </button>
              </Tooltip>
            ) : (
              <button
                className="bg-[#a3e635] text-[#18181b] py-2 px-4 rounded-lg hover:bg-[#bef264] transition duration-200"
                onClick={() => handleRunChain()}
              >
                {runChain ? "Running..." : "Run Chain"}
              </button>
            )}
          </div>
        </main>
      </div>

      <VariablesModal
        isOpen={showVariablesModal}
        onClose={handleVariablesModalClose}
        onSubmit={handleVariablesSubmit}
        chainId={chain?.id || 0}
        chainName={chain?.name || ""}
      />
    </div>
  );
}
