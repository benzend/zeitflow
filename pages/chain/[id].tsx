import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '@/components/Navigation';
import { SelectChain, SelectChainStep } from '@/schema';

export default function ChainDetail() {
  const [chain, setChain] = useState<SelectChain | null>(null);
  const [chainSteps, setChainSteps] = useState<SelectChainStep[] | null>(null);
  const [runChain, setRunChain] = useState(false);
  const [addChainStep, setAddChainStep] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [chainName, setChainName] = useState('');
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
      const response = await fetch(`/api/queue?id=${id}`, {
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
      const response = await fetch(`/api/queue?id=${id}`, {
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

    try {
      const response = await fetch(`/api/chain-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formData.get('prompt'),
          chainId: id,
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

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-center text-gray-600">Loading chain details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition duration-200"
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
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-center text-gray-600">Chain not found</p>
          <div className="text-center mt-4">
            <button
              onClick={handleBackToDashboard}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition duration-200"
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
        <title>{chain.name} - Joice</title>
        <meta name="description" content={`Details for chain ${chain.name}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <div className="container mx-auto px-4 pb-8 pt-20 max-w-4xl">
        <main className="min-h-screen py-8">
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
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Edit Chain</h2>
              <form onSubmit={handleUpdateChain}>
                <div className="mb-4">
                  <label htmlFor="chainName" className="block text-gray-700 font-medium mb-2">
                    Chain Name:
                  </label>
                  <input
                    type="text"
                    id="chainName"
                    value={chainName}
                    onChange={(e) => setChainName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setChainName(chain.name || '');
                    }}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-lg mb-8">
              <h1 className="text-3xl font-bold text-[#a3e635] mb-4">{chain.name} - Chain Details</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-white border-1 p-4 rounded">
                  <p className="text-white"><span className="font-semibold">Created:</span> {new Date(chain.createdAt).toLocaleString()}</p>
                </div>
                <div className="border-white border-1 p-4 rounded">
                  <p className="text-white"><span className="font-semibold">Last Updated:</span> {new Date(chain.updatedAt).toLocaleString()}</p>
                </div>
                <div className="border-white border-1 p-4 rounded">
                  <p className="text-white"><span className="font-semibold">Chain ID:</span> {chain.id}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-white border-1 rounded-lg shadow p-6">
            <h2 className="text-2xl text-white font-semibold mb-4">Chain Steps</h2>

            {chainSteps && chainSteps.map((step, index) => (
              <div key={index} className="border-white border-1 p-4 rounded mb-5">
                <p className="text-white"><span className="font-semibold">Step {index + 1}:</span> {step.prompt}</p>
              </div>
            ))}

            {!addChainStep && (
              <button className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200' onClick={() => setAddChainStep(true)}>
                Add Chain Step
              </button>
            )
            }

            {addChainStep && (
              <div className="border-[#a3e635] border-1 rounded-lg shadow p-6">
                <form onSubmit={handleAddChainStep}>
                  <div className="mb-4">
                    <label htmlFor="prompt" className="block text-gray-700 font-medium mb-2">
                      Prompt:
                    </label>
                    <textarea
                      id="chainStepPrompt"
                      name="prompt"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <input type="hidden" name="chainId" value={chain.id} />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddChainStep(false)}
                      className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200' onClick={() => handleRunChain()}>
              {runChain ? 'Running...' : 'Run Chain'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
