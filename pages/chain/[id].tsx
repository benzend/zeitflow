import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SelectChain, SelectChainStep } from '@/schema';

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

export default function ChainDetail() {
  const [chain, setChain] = useState<SelectChain | null>(null);
  const [chainSteps, setChainSteps] = useState<SelectChainStep[] | null>(null);
  const [runChain, setRunChain] = useState(false);
  const [addChainStep, setAddChainStep] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [chainName, setChainName] = useState('');
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editStepPrompt, setEditStepPrompt] = useState('');
  const router = useRouter();
  const { id } = router.query;

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
        setError(data.message || 'Failed to fetch chain');
      }
    } catch (err) {
      setError('An error occurred while fetching the chain');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chainName.trim()) {
      setError('Chain name is required');
      return;
    }

    try {
      const response = await fetch(`/api/dashboard?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
        setError(data.message || 'Failed to update chain');
      }
    } catch (err) {
      setError('An error occurred while updating the chain');
      console.error(err);
    }
  };

  const handleDeleteChain = async () => {
    if (!confirm('Are you sure you want to delete this chain?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to delete chain');
      }
    } catch (err) {
      setError('An error occurred while deleting the chain');
      console.error(err);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleAddChainStep = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    if (!formData.get('prompt')) {
      setError('Chain step prompt is required');
      return;
    }

    if (!formData.get('position')) {
      setError('Chain step position is required');
      return;
    }

    try {
      const response = await fetch(`/api/chain-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formData.get('prompt'),
          chainId: id,
          position: formData.get('position'),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAddChainStep(false);
        fetchChain(id as string);
      } else {
        setError(data.message || 'Failed to add chain step');
      }
    } catch (err) {
      setError('An error occurred while adding the chain step');
      console.error(err);
    }
  };

  const handleRunChain = async () => {
    if (!chain) {
      return;
    }
    try {
      const response = await fetch(`/api/add-to-queue?id=${chain.id}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setRunChain(true);
      } else {
        setError(data.message || 'Failed to run chain');
      }
    } catch (err) {
      setError('An error occurred while running the chain');
      console.error(err);
    }
  };

  const handleEditStep = (step: SelectChainStep) => {
    setEditingStepId(step.id);
    setEditStepPrompt(step.prompt);
  };

  const handleCancelEditStep = () => {
    setEditingStepId(null);
    setEditStepPrompt('');
  };

  const handleUpdateStep = async (stepId: number) => {
    if (!editStepPrompt.trim()) {
      setError('Step prompt is required');
      return;
    }

    try {
      const response = await fetch(`/api/chain-step?id=${stepId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: editStepPrompt,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingStepId(null);
        setEditStepPrompt('');
        fetchChain(id as string);
      } else {
        setError(data.message || 'Failed to update step');
      }
    } catch (err) {
      setError('An error occurred while updating the step');
      console.error(err);
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!confirm('Are you sure you want to delete this step?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chain-step?id=${stepId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchChain(id as string);
      } else {
        setError(data.message || 'Failed to delete step');
      }
    } catch (err) {
      setError('An error occurred while deleting the step');
      console.error(err);
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
                    setChainName(chain.name || '');
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
                      setChainName(chain.name || '');
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
                    <span className="font-semibold">Created:</span>{' '}
                    {new Date(chain.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-foreground border border-primary/20 p-4 rounded-lg">
                  <p className="text-primary">
                    <span className="font-semibold">Last Updated:</span>{' '}
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

            {chainSteps &&
              chainSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="bg-foreground-light border border-primary/20 p-4 rounded-lg mb-4"
                >
                  {editingStepId === step.id ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-primary">Edit Step {index + 1}</h4>
                        <button
                          onClick={handleCancelEditStep}
                          className="text-gray-400 hover:text-gray-600 transition duration-200"
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        value={editStepPrompt}
                        onChange={(e) => setEditStepPrompt(e.target.value)}
                        className="w-full p-3 bg-foreground border border-primary/20 rounded-lg focus:outline-none focus:border-primary transition duration-200 text-primary min-h-[100px] mb-4"
                        placeholder="Enter step prompt..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEditStep}
                          className="px-3 py-1 text-primary hover:text-primary-light transition duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateStep(step.id)}
                          className="bg-primary text-[#18181b] py-1 px-3 rounded hover:bg-primary-light transition duration-200"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-primary">Step {index + 1}:</span>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditStep(step)}
                            className="text-blue-500 hover:text-blue-600 transition duration-200 text-sm"
                            title="Edit step"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="text-red-500 hover:text-red-600 transition duration-200 text-sm"
                            title="Delete step"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-primary whitespace-pre-wrap">
                        {step.prompt}
                      </p>
                    </div>
                  )}
                </div>
              ))}

            {addChainStep && (
              <div className="bg-foreground-light border border-primary/20 rounded-lg p-6 mt-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-primary">
                    Add New Step
                  </h3>
                  <button
                    onClick={() => setAddChainStep(false)}
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
                    <textarea
                      id="chainStepPrompt"
                      name="prompt"
                      className="w-full p-3 bg-foreground border border-primary/20 rounded-lg focus:outline-none focus:border-primary transition duration-200 text-primary min-h-[100px]"
                      required
                    />
                    <input type="hidden" name="chainId" value={chain.id} />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setAddChainStep(false)}
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
                  <input type="hidden" name="position" value={chainSteps?.length || 0} />
                </form>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              className="bg-[#a3e635] text-[#18181b] py-2 px-4 rounded-lg hover:bg-[#bef264] transition duration-200"
              onClick={() => handleRunChain()}
            >
              {runChain ? 'Running...' : 'Run Chain'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
