import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const getStripeJs = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    queueLimit: 20,
    price: 0,
    features: ['20 requests per hour', 'Basic support'],
  },
  PRO: {
    name: 'Pro',
    queueLimit: 100,
    price: 999, // $9.99 in cents
    features: ['100 requests per hour', 'Priority support', 'Advanced features'],
  },
  UNLIMITED: {
    name: 'Unlimited',
    queueLimit: 1000,
    price: 2999, // $29.99 in cents
    features: ['1000 requests per hour', 'Premium support', 'All features'],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS;