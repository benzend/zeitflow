import { useState, useEffect } from 'react';

interface SubscriptionStatus {
  hasSubscription: boolean;
  tier: 'FREE' | 'PRO' | 'UNLIMITED';
  queueLimit: number;
  status?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface SubscriptionModalProps {
  onSubscriptionChange?: () => void;
}

export default function SubscriptionModal({ onSubscriptionChange }: SubscriptionModalProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to create checkout session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Subscription canceled successfully. It will remain active until the end of your billing period.');
        fetchSubscriptionStatus();
        onSubscriptionChange?.();
        setIsOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = () => {
    if (!subscription && loading) {
      fetchSubscriptionStatus();
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* Subscription Button */}
      <button
        onClick={openModal}
        className="text-primary py-2 px-4 rounded-lg hover:underline cursor-pointer"
      >
        {loading ? (
          'Subscription'
        ) : subscription ? (
          `${subscription.tier} Plan`
        ) : (
          'Subscription'
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-foreground p-8 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">Subscription Management</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-200 text-2xl"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-primary/20 rounded w-1/3"></div>
                <div className="h-4 bg-primary/20 rounded w-2/3"></div>
                <div className="h-4 bg-primary/20 rounded w-1/2"></div>
              </div>
            ) : subscription ? (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="p-4 bg-foreground-light rounded-lg border border-primary/20">
                  <h3 className="text-lg font-medium text-primary mb-2">Current Plan</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">{subscription.tier}</p>
                      <p className="text-sm text-gray-400">
                        {subscription.queueLimit} requests per hour
                      </p>
                      {subscription.currentPeriodEnd && (
                        <p className="text-sm text-gray-400">
                          {subscription.cancelAtPeriodEnd 
                            ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                            : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Available Plans */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary">Available Plans</h3>
                  
                  {/* Free Plan */}
                  <div className="p-4 bg-foreground-light rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">Free</h4>
                        <p className="text-sm text-gray-400">20 requests per hour</p>
                        <p className="text-sm text-gray-400">Basic support</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">$0/month</p>
                        {subscription.tier === 'FREE' && (
                          <span className="text-sm text-green-500">Current Plan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="p-4 bg-foreground-light rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">Pro</h4>
                        <p className="text-sm text-gray-400">100 requests per hour</p>
                        <p className="text-sm text-gray-400">Priority support, Advanced features</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">$9.99/month</p>
                        {subscription.tier === 'PRO' ? (
                          <span className="text-sm text-green-500">Current Plan</span>
                        ) : (
                          <button
                            onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm mt-1"
                          >
                            {subscription.tier === 'UNLIMITED' ? 'Downgrade' : 'Upgrade'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unlimited Plan */}
                  <div className="p-4 bg-foreground-light rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">Unlimited</h4>
                        <p className="text-sm text-gray-400">1000 requests per hour</p>
                        <p className="text-sm text-gray-400">Premium support, All features</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">$29.99/month</p>
                        {subscription.tier === 'UNLIMITED' ? (
                          <span className="text-sm text-green-500">Current Plan</span>
                        ) : (
                          <button
                            onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID!)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm mt-1"
                          >
                            Upgrade
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cancel Section */}
                {subscription.hasSubscription && !subscription.cancelAtPeriodEnd && (
                  <div className="border-t border-primary/20 pt-4">
                    <button
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                      Cancel Subscription
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                      Your subscription will remain active until the end of your billing period.
                    </p>
                  </div>
                )}

                {/* Benefits */}
                {subscription.tier === 'FREE' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2 text-gray-800">Why upgrade?</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Higher request limits for more AI processing</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Failed to load subscription information.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
