import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import { SelectChain, SelectQueuedChainWithStatus } from '@/schema';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [chains, setChains] = useState<SelectChain[]>([]);
  const [queuedChains, setQueuedChains] = useState<SelectQueuedChainWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newChainName, setNewChainName] = useState('');
  const router = useRouter();

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

  const fetchChains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (data.success) {
        setChains(data.chains || []);
        setQueuedChains(data.queuedChains || []);
      } else {
        setError(data.message || 'Failed to fetch chains');
      }
    } catch (err) {
      setError('An error occurred while fetching chains');
      console.error(err);
    } finally {
      setLoading(false);
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
        setNewChainName('');
        fetchChains();
      } else {
        setError(data.message || 'Failed to create chain');
      }
    } catch (err) {
      setError('An error occurred while creating the chain');
      console.error(err);
    }
  };

  const handleDeleteChain = async (id: number) => {
    if (!confirm('Are you sure you want to delete this chain?')) {
      return;
    }

    try {
      const response = await fetch(`/api/queue?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchChains();
      } else {
        setError(data.message || 'Failed to delete chain');
      }
    } catch (err) {
      setError('An error occurred while deleting the chain');
      console.error(err);
    }
  };

  const handleDeleteQueuedChain = async (id: number) => {
    if (!confirm('Are you sure you want to delete this queued chain?')) {
      return;
    }

    try {
      const response = await fetch(`/api/queued-chain?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchChains();
      } else {
        setError(data.message || 'Failed to delete queued chain');
      }
    } catch (err) {
      setError('An error occurred while deleting the queued chain');
      console.error(err);
    }
  };

  const handleRunChain = async (id: number) => {
    if (!confirm('Are you sure you want to run this chain?')) {
      return;
    }
    try {
      const response = await fetch(`/api/process-queued-chain?id=${id}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        fetchChains();
      } else {
        setError(data.message || 'Failed to run chain');
      }
    } catch (err) {
      setError('An error occurred while running the chain');
      console.error(err);
    }
  };

  const handleViewChain = (id: number) => {
    router.push(`/chain/${id}`);
  };

  return (
    <div>
      <Head>
        <title>Dashboard - Joice</title>
        <meta name="description" content="Manage your AI chains" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Your Chains</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold text-[#a3e635] mb-4">Create a Chain</h2>
          <form onSubmit={handleCreateChain}>
            <div className="mb-4">
              <label htmlFor="chainName" className="block text-gray-700 font-medium mb-2">
                Chain Name:
              </label>
              <input
                type="text"
                id="chainName"
                value={newChainName}
                onChange={(e) => setNewChainName(e.target.value)}
                placeholder="Enter chain name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
            >
              Create Chain
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-[#a3e635] mb-4">Your Queue</h2>
          {loading ? (
            <p className="text-gray-600">Loading chains...</p>
          ) : chains.length === 0 ? (
            <p className="text-gray-600">No queue found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {queuedChains.map((queuedChain) => {
                const chain = chains.find(c => c.id === queuedChain.chainId);
                if (!chain) {
                  return null;
                }
                return (
                  <div key={queuedChain.id} className="border-[#a3e635] border-1 rounded-lg shadow p-6 hover:shadow-md transition duration-200 flex justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl text-[#a3e635] font-semibold mb-2">{chain.name}</h3>
                      <p className="text-gray-600 mb-1 capitalize">{queuedChain.status}</p>
                      <p className="text-gray-600">Created: {new Date(queuedChain.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-1 justify-end gap-4">
                      <button
                        onClick={() => handleViewChain(queuedChain.id)}
                        className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition duration-200"
                      >
                        View
                      </button>
                      <button className='bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition duration-200' onClick={() => handleRunChain(queuedChain.id)}>
                        Process
                      </button>
                      <button
                        onClick={() => handleDeleteQueuedChain(queuedChain.id)}
                        className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                )
              })}
            </div>
          )}
        </div>


        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-[#a3e635] mb-4">Your Chains</h2>
          {loading ? (
            <p className="text-gray-600">Loading chains...</p>
          ) : chains.length === 0 ? (
            <p className="text-gray-600">No chains found. Create your first chain above!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chains.map((chain) => (
                <div key={chain.id} className="border-[#a3e635] border-1 rounded-lg shadow p-6 hover:shadow-md transition duration-200">
                  <h3 className="text-xl text-[#a3e635] font-semibold mb-2">{chain.name}</h3>
                  <p className="text-gray-600 mb-4">Created: {new Date(chain.createdAt).toLocaleDateString()}</p>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handleViewChain(chain.id)}
                      className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition duration-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteChain(chain.id)}
                      className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </main>
    </div>
  );
}
