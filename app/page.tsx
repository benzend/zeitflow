import Image from 'next/image';
import Link from 'next/link';
import Logo from './components/Logo';
import {
  QueueIcon,
  ChainIcon,
  StepIcon,
  ResultIcon,
} from './components/FeatureIcons';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181b] to-[#27272a] text-[#fafafa] flex flex-col">
      {/* Navigation Bar */}
      <nav className="w-full bg-[#18181b]/80 backdrop-blur-sm border-b border-[#27272a] fixed top-0 z-50 animate-slide-up-fade">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="relative w-8 h-8 animate-scale-in">
                  <Logo className="text-[#a3e635] group-hover:animate-spin-slow transition-all duration-300" />
                </div>
                <span className="text-xl font-bold text-[#a3e635] animate-slide-up-fade delay-100">
                  Joice
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/signin"
                className="text-[#d4d4d8] hover:text-[#a3e635] transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-[#a3e635] text-[#18181b] px-4 py-2 rounded-full font-medium hover:bg-[#bef264] transition-all duration-200 animate-slide-up-fade delay-300 hover:animate-pulse-glow"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
              Joice
            </h1>
            <p className="text-xl text-[#d4d4d8] mt-4 max-w-2xl text-center animate-slide-up-fade delay-300">
              A playful, powerful system for managing and executing AI prompt
              chains
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
                  title: 'Step',
                  desc: 'Execute multiple prompts',
                },
                {
                  icon: ResultIcon,
                  title: 'Result',
                  desc: 'Track the results of each prompt',
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
              href="/register"
              className="bg-[#a3e635] text-[#18181b] px-10 py-5 mb-5 rounded-full font-bold shadow-lg hover:bg-[#bef264] transition-all duration-300 text-xl hover:scale-105 hover:shadow-xl hover:shadow-[#a3e635]/20 hover:animate-pulse-glow"
            >
              Get Started →
            </Link>
          </section>
        </main>

        <footer className="flex flex-col items-center gap-2 mb-6 text-sm text-[#71717a] animate-slide-up-fade delay-500">
          <span>
            Made with <span className="text-[#a3e635] animate-pulse">♥</span>{' '}
            for prompt chain enthusiasts
          </span>
        </footer>
      </div>
    </div>
  );
}
