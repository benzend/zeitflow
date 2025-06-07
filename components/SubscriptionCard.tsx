import { useState, useEffect } from 'react';

interface SubscriptionStatus {
  hasSubscription: boolean;
  tier: 'FREE' | 'PRO' | 'UNLIMITED';
  queueLimit: number;
  status?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface SubscriptionCardProps {
  onSubscriptionChange?: () => void;
}

export default function SubscriptionCard({ onSubscriptionChange }: SubscriptionCardProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Subscription</h3>
      
      {subscription && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Plan: {subscription.tier}</p>
              <p className="text-sm text-gray-600">
                {subscription.queueLimit} requests per hour
              </p>
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-gray-600">
                  {subscription.cancelAtPeriodEnd 
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {!subscription.hasSubscription && (
                <>
                  <button
                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    Upgrade to Pro ($9.99/mo)
                  </button>
                  <button
                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID!)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    Upgrade to Unlimited ($29.99/mo)
                  </button>
                </>
              )}
              
              {subscription.hasSubscription && subscription.tier === 'PRO' && !subscription.cancelAtPeriodEnd && (
                <>
                  <button
                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID!)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    Upgrade to Unlimited ($29.99/mo)
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    Cancel Subscription
                  </button>
                </>
              )}
              
              {subscription.hasSubscription && subscription.tier === 'UNLIMITED' && !subscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {subscription.tier === 'FREE' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Why upgrade?</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Higher request limits for more AI processing</li>
                <li>• Priority support</li>
                <li>• Advanced features and faster processing</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}