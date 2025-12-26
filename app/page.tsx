
import { Button } from '../components/Button';
import Logo from '@/app/components/Logo';
import Navigation from '@/components/Navigation';
import Providers from './providers';

export default function Home() {
  return (
    <Providers>
      <div className="min-h-screen bg-gradient-to-b from-surface to-surface-hover text-foreground flex flex-col">
      <Navigation />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-between p-8 font-sans pt-24">
        <div className="flex flex-col items-center mt-6 mb-10 w-full max-w-7xl">
          <header className="flex flex-col items-center gap-4 mb-10">
            <div className="relative w-32 h-32 animate-float animate-scale-in">
              <Logo
                size={128}
                className="text-primary animate-spin-slow animate-pulse-glow"
              />
            </div>
            <h1 className="text-7xl font-extrabold tracking-tight text-accent drop-shadow-lg animate-slide-up-fade delay-200">
              ZeitFlow
            </h1>
            <p className="text-xl text-text-muted mt-4 max-w-2xl text-center animate-slide-up-fade delay-300">
              Build thousands of workflows, fast, without running into complexity.
            </p>

            <Button
              href="/auth/register"
              variant="primary"
              size="xl"
              className="mt-5"
            >
              Try it out with a free account →
            </Button>
          </header>
        </div>

        <main className="flex flex-col items-center gap-16 flex-1 justify-center w-full max-w-7xl">
          <section className="bg-surface/50 backdrop-blur-sm rounded-3xl shadow-xl py-10 px-4 md:py-12 md:px-12 flex flex-col items-center gap-8 w-full animate-slide-up-fade delay-400">
            <h2 className="text-3xl font-bold text-primary mb-6 animate-shimmer">
              Build your first workflow
            </h2>
            <div className="w-full md:px-10 mb-10">
              <div style={{position: 'relative', paddingBottom: '56.25%', height: 0}}><iframe src="https://cap.so/embed/qegqpre7vpq3jrf" allowFullScreen={true} style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}></iframe></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full px-10 pb-10 md:pb-0 md:px-0">
              {[
                {
                  icon: '/homepage/illustration-easy-building.png',
                  title: 'Easy Building',
                  desc: 'Build workflows without the typical complexity of other workflow tools',
                },
                {
                  icon: '/homepage/illustration-api-form-integrations.png',
                  title: 'API and Form Integrations',
                  desc: 'Connect to your own APIs and create public forms to run workflows',
                },
                {
                  icon: '/homepage/illustration-ai-without-limits.png',
                  title: 'AI without Limits',
                  desc: 'Run workflows with any AI model and unlimited processing',
                },
                {
                  icon: '/homepage/illustration-easy-to-format.png',
                  title: 'Easy to Format',
                  desc: 'Compile the results into an easy to use format',
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="flex flex-col items-center gap-4 group hover:scale-105 transition-transform duration-300 animate-slide-up-fade"
                  style={{ animationDelay: `${(index + 5) * 100}ms` }}
                >
                  <div className="h-20 bg-surface rounded-xl flex items-center justify-center group-hover:shadow-2xl/20 transition-shadow duration-300 shadow-lg group-hover:animate-pulse-glow">
                    <img src={item.icon} alt={item.title} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-semibold text-primary text-lg">
                    {item.title}
                  </span>
                  <p className="text-base text-center text-text-muted">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface/50 backdrop-blur-sm rounded-3xl shadow-xl p-12 flex flex-col items-center gap-8 w-full animate-slide-up-fade delay-500">
            <h2 className="text-3xl font-bold text-primary mb-6 animate-shimmer">
              Simple Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
              {[
                {
                  name: 'Free',
                  price: '$0',
                  period: '/month',
                  requests: '20 requests/hour',
                  features: ['Basic AI processing', 'Community support'],
                  buttonText: 'Get Started',
                  buttonClass: 'bg-gray-600 hover:bg-gray-700',
                  href: '/auth/register'
                },
                {
                  name: 'Pro',
                  price: '$9.99',
                  period: '/month',
                  requests: '100 requests/hour',
                  features: ['Priority support', 'Advanced features'],
                  buttonText: 'Upgrade to Pro',
                  buttonClass: 'bg-blue-600 hover:bg-blue-700',
                  popular: true,
                  href: '/pricing'
                },
                {
                  name: 'Business',
                  price: '$29.99',
                  period: '/month',
                  requests: '1000 requests/hour',
                  features: ['Premium support', 'All features'],
                  buttonText: 'For Businesses',
                  buttonClass: 'bg-purple-600 hover:bg-purple-700',
                  href: '/pricing'
                }
              ].map((plan, index) => (
                <div
                  key={plan.name}
                  className={`relative bg-surface rounded-2xl p-6 border ${plan.popular
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border'
                    } hover:border-primary transition-all duration-300 animate-slide-up-fade`}
                  style={{ animationDelay: `${(index + 6) * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-invert px-3 py-1 rounded-full text-sm font-medium">
                        Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-text-muted ml-1">{plan.period}</span>
                    </div>
                    <p className="text-sm text-primary font-medium">{plan.requests}</p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-text-muted">
                        <svg
                          className="w-4 h-4 text-primary mr-2 flex-shrink-0"
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

                  <Button
                    href={plan.href}
                    variant="primary"
                    className={`w-full ${plan.popular ? 'hover:animate-pulse-glow' : ''}`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col items-center gap-6 animate-slide-up-fade delay-600">
            <Button
              href="/auth/register"
              variant="primary"
              size="xl"
            >
              Get Started with a free account →
            </Button>
          </section>
        </main>
      </div>
    </div>
    </Providers>
  );
}
