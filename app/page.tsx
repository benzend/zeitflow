import Link from 'next/link';
import Logo from './components/Logo';
import {
  QueueIcon,
  ChainIcon,
  StepIcon,
  ResultIcon,
} from './components/FeatureIcons';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#27272a] text-[#fafafa] flex flex-col">
      <Navigation />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-between p-8 font-sans pt-24">
        <div className="flex flex-col items-center mt-6 mb-10 w-full max-w-7xl">
          <header className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 animate-float animate-scale-in">
              <Logo
                size={128}
                className="text-[#a3e635] animate-spin-slow animate-pulse-glow"
              />
            </div>
            <h1 className="text-7xl font-extrabold tracking-tight text-[#a3e635] drop-shadow-lg animate-slide-up-fade delay-200">
              jjoist
            </h1>
            <p className="text-xl text-[#d4d4d8] mt-4 max-w-2xl text-center animate-slide-up-fade delay-300">
              Rethinking the way you work with AI using a unique, powerful
              system for managing and executing AI prompt chains
            </p>
          </header>
        </div>

        <main className="flex flex-col items-center gap-16 flex-1 justify-center w-full max-w-7xl">
          <section className="bg-[#27272a]/50 backdrop-blur-sm rounded-3xl shadow-xl p-12 flex flex-col items-center gap-8 w-full animate-slide-up-fade delay-400">
            <h2 className="text-3xl font-bold text-[#a3e635] mb-6 animate-shimmer">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
              {[
                {
                  icon: QueueIcon,
                  title: 'Queue',
                  desc: 'Run multiple chains sequentially',
                },
                {
                  icon: ChainIcon,
                  title: 'Chain',
                  desc: 'Command a customized sequence of prompts',
                },
                {
                  icon: StepIcon,
                  title: 'Steps',
                  desc: 'Execute multiple prompts in an execution cycle',
                },
                {
                  icon: ResultIcon,
                  title: 'Result',
                  desc: 'Compile the results into a single output',
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="flex flex-col items-center gap-4 group hover:scale-105 transition-transform duration-300 animate-slide-up-fade"
                  style={{ animationDelay: `${(index + 5) * 100}ms` }}
                >
                  <div className="w-20 h-20 bg-[#18181b] rounded-2xl flex items-center justify-center group-hover:bg-[#232323] transition-colors duration-300 shadow-lg group-hover:animate-pulse-glow">
                    <item.icon className="text-[#a3e635] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="font-semibold text-[#a3e635] text-lg">
                    {item.title}
                  </span>
                  <p className="text-base text-center text-[#d4d4d8]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#27272a]/50 backdrop-blur-sm rounded-3xl shadow-xl p-12 flex flex-col items-center gap-8 w-full animate-slide-up-fade delay-500">
            <h2 className="text-3xl font-bold text-[#a3e635] mb-6 animate-shimmer">
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
                  name: 'Unlimited',
                  price: '$29.99',
                  period: '/month',
                  requests: '1000 requests/hour',
                  features: ['Premium support', 'All features'],
                  buttonText: 'Go Unlimited',
                  buttonClass: 'bg-purple-600 hover:bg-purple-700',
                  href: '/pricing'
                }
              ].map((plan, index) => (
                <div
                  key={plan.name}
                  className={`relative bg-[#18181b] rounded-2xl p-6 border ${
                    plan.popular 
                      ? 'border-[#a3e635] shadow-lg shadow-[#a3e635]/20' 
                      : 'border-[#404040]'
                  } hover:border-[#a3e635] transition-all duration-300 animate-slide-up-fade`}
                  style={{ animationDelay: `${(index + 6) * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#a3e635] text-[#18181b] px-3 py-1 rounded-full text-sm font-medium">
                        Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-2xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400 ml-1">{plan.period}</span>
                    </div>
                    <p className="text-sm text-[#a3e635] font-medium">{plan.requests}</p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-300">
                        <svg
                          className="w-4 h-4 text-[#a3e635] mr-2 flex-shrink-0"
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

                  <Link
                    href={plan.href}
                    className={`block w-full py-2 px-4 rounded-lg font-medium text-center text-white transition-all duration-200 ${plan.buttonClass} ${
                      plan.popular ? 'hover:animate-pulse-glow' : ''
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col items-center gap-6 animate-slide-up-fade delay-600">
            <Link
              href="/auth/register"
              className="bg-[#a3e635] text-[#18181b] px-10 py-5 mb-5 rounded-full font-bold shadow-lg hover:bg-[#bef264] transition-all duration-300 text-xl hover:scale-105 hover:shadow-xl hover:shadow-[#a3e635]/20 hover:animate-pulse-glow"
            >
              Get Started with a free account →
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
