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
      description: 'Build and test agent-ready workflows',
      features: [
        '20 executions per hour',
        'Full MCP support',
        'All integrations included',
        'Complete audit logs',
        'Visual workflow builder'
      ],
      buttonText: 'Start Building',
      buttonClass: 'bg-gray-600 hover:bg-gray-700 text-white',
      popular: false,
      priceId: null
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      description: 'For teams shipping to production',
      features: [
        '100 executions per hour',
        'Full MCP support',
        'All integrations included',
        'Priority support',
        'Multi-model AI routing',
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
      description: 'Enterprise-grade scale and support',
      features: [
        '1,000 executions per hour',
        'Full MCP support',
        'All integrations included',
        'Premium support',
        'Team collaboration',
        'Fastest processing'
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
        <title>Pricing - ZeitFlow | Agent-Native Automation Platform</title>
        <meta name="description" content="Simple, predictable pricing for agent-native automation. No per-agent fees. No integration surcharges. MCP support on every plan." />
        <meta name="keywords" content="pricing, plans, ZeitFlow, AI agent automation, MCP, enterprise automation, agent-native workflows" />
        <meta property="og:title" content="Pricing - ZeitFlow" />
        <meta property="og:description" content="Simple, predictable pricing for agent-native automation. MCP support and all integrations included on every plan." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/pricing`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pricing - ZeitFlow" />
        <meta name="twitter:description" content="Simple, predictable pricing for agent-native automation. MCP support and all integrations included on every plan." />
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
              Simple, predictable
              <span className="text-primary ml-3">pricing</span>
            </h1>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              No per-agent fees. No integration surcharges. MCP support and full audit logs on every plan.
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
                  What counts as an execution?
                </h3>
                <p className="text-text-muted">
                  One execution is a complete run of your workflow, from trigger to final action. Whether triggered by an AI agent via MCP, an API call, or a form submission, each run counts as one execution.
                </p>
              </div>
              <div className="bg-surface rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Is MCP support included on the free plan?
                </h3>
                <p className="text-text-muted">
                  Yes. MCP support, all integrations, and full audit logs are included on every plan. We don&apos;t gate features — only execution volume scales with your plan.
                </p>
              </div>
              <div className="bg-surface rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Can I change my plan anytime?
                </h3>
                <p className="text-text-muted">
                  Yes. Upgrade or downgrade at any time. Changes are reflected in your next billing cycle.
                </p>
              </div>
              <div className="bg-surface rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  What happens if I exceed my execution limit?
                </h3>
                <p className="text-text-muted">
                  Executions are queued until the next hour when your limit resets. Upgrade for higher throughput and priority processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
