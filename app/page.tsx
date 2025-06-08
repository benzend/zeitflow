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

          <section className="flex flex-col items-center gap-6 animate-slide-up-fade delay-500">
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
