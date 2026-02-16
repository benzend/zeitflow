import { useState } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import { useSession } from 'next-auth/react';

export default function Pricing() {
  const { data: session } = useSession();
  const [actionLoading, setActionLoading] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }

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

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '20 requests per hour',
        'Basic AI chain processing',
        'Community support',
        'Standard processing speed'
      ],
      buttonText: 'Get Started',
      buttonClass: 'bg-gray-600 hover:bg-gray-700 text-white',
      popular: false,
      priceId: null
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      description: 'Best for growing businesses',
      features: [
        '100 requests per hour',
        'Advanced AI chain processing',
        'Priority support',
        'Advanced features',
        'Faster processing'
      ],
      buttonText: 'Upgrade to Pro',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      popular: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
    },
    {
      name: 'Business',
      price: '$29.99',
      period: '/month',
      description: 'For businesses and power users',
      features: [
        '1000 requests per hour',
        'Premium AI chain processing',
        'Premium support',
        'All features included',
        'Fastest processing',
        'Team collaboration'
      ],
      buttonText: 'Upgrade to Business',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
      popular: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Pricing - ZeitFlow | AI Prompt Chain Management</title>
        <meta name="description" content="Choose the perfect ZeitFlow plan for your AI prompt chain and workflow automation needs. Free, Pro, and Business options available." />
        <meta name="keywords" content="pricing, plans, subscription, ZeitFlow, AI prompt chains, workflow management, automation, cost, pricing plans" />
        <meta property="og:title" content="Pricing - ZeitFlow" />
        <meta property="og:description" content="Choose the perfect plan for your AI prompt chain and workflow automation needs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/pricing`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pricing - ZeitFlow" />
        <meta name="twitter:description" content="Choose the perfect plan for your AI prompt chain and workflow automation needs." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/pricing`} />
      </Head>
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16 animate-slide-up-fade">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Choose Your
              <span className="text-primary ml-3">Plan</span>
            </h1>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Scale your AI chain processing with flexible pricing that grows with your needs
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-surface rounded-2xl p-8 border ${
                  plan.popular
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border'
                } hover:border-primary transition-all duration-300 animate-slide-up-fade`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-text-muted mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-text-muted ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-text-muted">
                      <svg
                        className="w-5 h-5 text-primary mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => plan.priceId ? handleUpgrade(plan.priceId) : window.location.href = '/auth/register'}
                  disabled={actionLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${plan.buttonClass} ${
                    plan.popular ? 'animate-pulse-glow' : ''
                  }`}
                >
                  {actionLoading ? 'Processing...' : plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto animate-slide-up-fade delay-400">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-surface rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  What are AI chain requests?
                </h3>
                <p className="text-text-muted">
                  Each AI chain request processes a sequence of AI prompts. The number of steps in your chain determines how many requests are consumed.
                </p>
              </div>
              <div className="bg-surface rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Can I change my plan anytime?
                </h3>
                <p className="text-text-muted">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </div>
              <div className="bg-surface rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  What happens if I exceed my request limit?
                </h3>
                <p className="text-text-muted">
                  Your requests will be queued until the next hour when your limit resets. Consider upgrading for higher limits and priority processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
