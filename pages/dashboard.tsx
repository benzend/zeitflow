import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { PlayIcon } from '@/components/icons/Play';
import { SelectChain, SelectQueuedChainWithStatus } from '@/schema';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [chains, setChains] = useState<SelectChain[]>([]);
  const [queuedChains, setQueuedChains] = useState<
    SelectQueuedChainWithStatus[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newChainName, setNewChainName] = useState('');
  const router = useRouter();
  const [showAddChainModal, setShowAddChainModal] = useState(false);

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
        router.push(`/chain/${data.chainId}`);
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

  const handleAddChainToQueue = async (chainId: number) => {
    if (!confirm('Are you sure you want to add this chain to the queue?')) {
      return;
    }

    try {
      const response = await fetch(`/api/add-to-queue?id=${chainId}`, {
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

  return (
    <div>
      <Head>
        <title>Dashboard - jjoist</title>
        <meta name="description" content="Manage your AI chains" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-10 mt-10 max-w-6xl min-h-screen">
        <nav className="mb-20">
          <ul className="flex gap-4">
            <li>
              <Link href="/dashboard">
                <span className="text-primary underline hover:text-primary-light transition duration-200">
                  Dashboard
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <section className="w-1/3 bg-foreground rounded-lg h-[calc(100vh-200px)] relative">
            {/* Tab Header */}
            <div className="-mt-4 flex justify-end">
              <div className="px-4 py-2 bg-foreground rounded-lg">
                <h2 className="text-sm font-bold text-center text-primary">
                  Prompt Chains
                </h2>
              </div>
            </div>

            <div className="relative overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                {chains.map((chain) => (
                  <div
                    className="flex justify-between items-center border-primary border-1 rounded-lg shadow p-4 hover:shadow-md transition duration-200 bg-foreground-light"
                    key={chain.id}
                  >
                    <Link href={`/chain/${chain.id}`}>
                      <h3 className="text-md font-bold text-primary">
                        {chain.name}
                      </h3>
                    </Link>
                    <div className="flex gap-4 justify-between">
                      <button
                        title="Add to Queue"
                        arial-label="Add to Queue"
                        className="cursor-pointer"
                        onClick={() => handleAddChainToQueue(chain.id)}
                      >
                        <PlayIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteChain(chain.id)}
                        className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition duration-200 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center items-center absolute bottom-4 right-4">
              <button
                className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-light transition duration-200 cursor-pointer"
                onClick={() => setShowAddChainModal(true)}
              >
                Add New Chain
              </button>
            </div>
          </section>

          <section className="w-2/3 bg-foreground rounded-lg h-[calc(100vh-200px)]">
            <div className="-mt-4 flex justify-end">
              <div className="px-4 py-2 bg-foreground rounded-lg">
                <h2 className="text-sm font-bold text-center text-primary">
                  In Process
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4">
              {queuedChains.map((queuedChain) => {
                const chain = chains.find((c) => c.id === queuedChain.chainId);
                if (!chain) {
                  return null;
                }
                return (
                  <div
                    key={queuedChain.id}
                    className="border-[#a3e635] border-1 rounded-lg shadow p-6 hover:shadow-md transition duration-200 flex justify-between bg-foreground-light"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl text-[#a3e635] font-semibold">
                        {chain.name}
                      </h3>
                    </div>
                    <div className="flex flex-1 justify-end gap-4">
                      <button
                        onClick={() => handleViewChain(queuedChain.id)}
                        className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition duration-200"
                      >
                        View
                      </button>
                      <button
                        className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition duration-200"
                        onClick={() => handleRunChain(queuedChain.id)}
                      >
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
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {showAddChainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Add New Chain</h2>
            <form onSubmit={handleCreateChain}>
              <div className="mb-4">
                <label
                  htmlFor="chainName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Chain Name
                </label>
                <input
                  type="text"
                  id="chainName"
                  value={newChainName}
                  onChange={(e) => setNewChainName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <button
                type="submit"
                className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-light transition duration-200"
              >
                Add Chain
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
