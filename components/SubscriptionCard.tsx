import { useState, useEffect } from 'react';

import { Button } from "./Button";

interface SubscriptionStatus {
  hasSubscription: boolean;
  tier: 'FREE' | 'PRO' | 'UNLIMITED' | 'GODMODE';
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
      <Button
        onClick={openModal}
        variant="tertiary"
        className="!bg-transparent py-2 px-4 rounded-lg hover:underline"
      >
        {loading ? (
          'Subscription'
        ) : subscription ? (
          `${subscription.tier}${subscription.tier === 'GODMODE' ? '' : ' Plan'}`
        ) : (
          'Subscription'
        )}
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-background-light p-8 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Subscription Management</h2>
              <Button
                onClick={() => setIsOpen(false)}
                variant="tertiary"
                className="!bg-transparent !p-0 text-foreground-light hover:text-gray-600 transition duration-200 text-2xl"
              >
                ✕
              </Button>
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
                <div className="p-4 bg-background-light rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">{subscription.tier}</p>
                      <p className="text-sm text-foreground-light">
                        {subscription.queueLimit} requests per hour
                      </p>
                      {subscription.currentPeriodEnd && (
                        <p className="text-sm text-foreground-light">
                          {subscription.cancelAtPeriodEnd 
                            ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                            : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                          }
                        </p>
                      )}
                    </div>

                    <h3 className="text-lg font-medium text-foreground-extra-light mb-2">Current Plan</h3>
                  </div>
                </div>

                {/* Available Plans */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Available Plans</h3>
                  
                  {/* Free Plan */}
                  <div className="p-4 bg-background-light rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">Free</h4>
                        <p className="text-sm text-foreground-light">20 requests per hour</p>
                        <p className="text-sm text-foreground-light">Basic support</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">$0/month</p>
                        {subscription.tier === 'FREE' && (
                          <span className="text-sm text-foreground">Current Plan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="p-4 bg-background-light rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">Pro</h4>
                        <p className="text-sm text-foreground-light">100 requests per hour</p>
                        <p className="text-sm text-foreground-light">Priority support, Advanced features</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">$9.99/month</p>
                        {subscription.tier === 'PRO' ? (
                          <span className="text-sm text-foreground-light">Current Plan</span>
                        ) : (
                          <Button
                            onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!)}
                            disabled={actionLoading}
                            variant="primary"
                            size="sm"
                            className="mt-1"
                          >
                            {subscription.tier === 'UNLIMITED' ? 'Downgrade' : 'Upgrade'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unlimited Plan */}
                  <div className="p-4 bg-background-light rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">Business</h4>
                        <p className="text-sm text-foreground-light">1000 requests per hour</p>
                        <p className="text-sm text-foreground-light">Premium support, All features</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">$29.99/month</p>
                        {subscription.tier === 'UNLIMITED' ? (
                          <span className="text-sm text-foreground-light">Current Plan</span>
                        ) : (
                          <Button
                            onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID!)}
                            disabled={actionLoading}
                            variant="primary"
                            size="sm"
                            className="mt-1"
                          >
                            Upgrade
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cancel Section */}
                {subscription.hasSubscription && !subscription.cancelAtPeriodEnd && (
                  <div className="border-t border-primary/20 pt-4">
                    <Button
                      onClick={handleCancel}
                      disabled={actionLoading}
                      variant="tertiary"
                      className="!bg-red-600 !text-white hover:!bg-red-700 text-sm"
                    >
                      Cancel Subscription
                    </Button>
                    <p className="text-xs text-foreground-light mt-2">
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
              <p className="text-foreground-light">Failed to load subscription information.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
