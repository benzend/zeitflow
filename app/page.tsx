import Image from 'next/image';
import Link from 'next/link';
import LoadingScreen from './components/LoadingScreen';

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <div className="min-h-screen bg-[#18181b] text-[#fafafa] flex flex-col items-center justify-between p-8 font-sans">
        <div className="flex flex-col items-center mt-6">
          <header className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative w-24 h-24 animate-float">
              <Image
                src="/globe.svg"
                alt="Joice Logo"
                fill
                className="text-[#a3e635] animate-spin-slow"
              />
            </div>
            <h1 className="text-6xl font-extrabold tracking-tight text-[#a3e635] drop-shadow-lg animate-slide-down">
              Joice
            </h1>
            <p className="text-lg text-[#d4d4d8] mt-2 max-w-xl text-center animate-fade-in-delay">
              A playful, powerful system for managing and executing prompt
              chains
            </p>
          </header>
        </div>
        <main className="flex flex-col items-center gap-12 flex-1 justify-center w-full">
          <section className="bg-[#27272a] rounded-2xl shadow-lg p-8 flex flex-col items-center gap-6 w-full max-w-4xl animate-slide-up">
            <h2 className="text-2xl font-bold text-[#a3e635] mb-4">
              How it works
            </h2>
            <div className="grid grid-cols-4 gap-8 w-full">
              <div className="flex flex-col items-center gap-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-[#18181b] rounded-xl flex items-center justify-center group-hover:bg-[#232323] transition-colors duration-300">
                  <Image
                    src="/file.svg"
                    alt="Queue"
                    width={32}
                    height={32}
                    className="text-[#a3e635] group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="font-semibold text-[#a3e635]">Queue</span>
                <p className="text-sm text-center text-[#d4d4d8]">
                  Multiple chains
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-[#18181b] rounded-xl flex items-center justify-center group-hover:bg-[#232323] transition-colors duration-300">
                  <Image
                    src="/window.svg"
                    alt="Chain"
                    width={32}
                    height={32}
                    className="text-[#a3e635] group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="font-semibold text-[#a3e635]">Chain</span>
                <p className="text-sm text-center text-[#d4d4d8]">
                  Named sequences
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-[#18181b] rounded-xl flex items-center justify-center group-hover:bg-[#232323] transition-colors duration-300">
                  <Image
                    src="/next.svg"
                    alt="Step"
                    width={32}
                    height={32}
                    className="text-[#a3e635] group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="font-semibold text-[#a3e635]">Step</span>
                <p className="text-sm text-center text-[#d4d4d8]">
                  Prompt execution
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-[#18181b] rounded-xl flex items-center justify-center group-hover:bg-[#232323] transition-colors duration-300">
                  <Image
                    src="/vercel.svg"
                    alt="Result"
                    width={32}
                    height={32}
                    className="text-[#a3e635] group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="font-semibold text-[#a3e635]">Result</span>
                <p className="text-sm text-center text-[#d4d4d8]">
                  Tracked outputs
                </p>
              </div>
            </div>
          </section>
          <section className="flex flex-col items-center gap-4 animate-fade-in-delay-2">
            <Link
              href="#"
              className="bg-[#a3e635] text-[#18181b] px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[#bef264] transition-all duration-300 text-lg hover:scale-105 hover:shadow-xl hover:shadow-[#a3e635]/20"
            >
              Get Started →
            </Link>
          </section>
        </main>
        <footer className="flex flex-col items-center gap-2 mb-6 text-xs text-[#71717a] animate-fade-in-delay-3">
          <span>
            Made with <span className="text-[#a3e635] animate-pulse">♥</span>{' '}
            for prompt chain enthusiasts
          </span>
        </footer>
      </div>
    </>
  );
}
