import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '@/components/Navigation';

type Chain = {
  id: number;
  name: string;
  cycleCount: number;
  currentCycle: number;
  createdAt: string;
  updatedAt: string;
};

export default function Dashboard() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newChainName, setNewChainName] = useState('');
  const [newChainCycles, setNewChainCycles] = useState(1);
  const router = useRouter();

  // Fetch chains on component mount
  useEffect(() => {
    fetchChains();
  }, []);

  const fetchChains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/queue');
      const data = await response.json();
      
      if (data.success) {
        setChains(data.chains || []);
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
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChainName,
          cycle_count: newChainCycles,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewChainName('');
        setNewChainCycles(1);
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
            <div className="mb-4">
              <label htmlFor="chainCycles" className="block text-gray-700 font-medium mb-2">
                Number of Cycles:
              </label>
              <input
                type="number"
                id="chainCycles"
                value={newChainCycles}
                onChange={(e) => setNewChainCycles(parseInt(e.target.value, 10))}
                min="1"
                max="100"
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
                  <p className="text-gray-600 mb-1">Progress: {chain.currentCycle} / {chain.cycleCount} cycles</p>
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
