'use client';

import Logo from '@/app/components/Logo';
import Link from 'next/link';
import { useState } from 'react';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: data.message });
        setEmail('');
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                href="/coming-soon"
                className="text-[#d4d4d8] hover:text-[#a3e635] transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Sign In
              </Link>
              <Link
                href="/coming-soon"
                className="bg-[#a3e635] text-[#18181b] px-4 py-2 rounded-full font-medium hover:bg-[#bef264] transition-all duration-200 animate-slide-up-fade delay-300 hover:animate-pulse-glow"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-4">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#a3e635] to-[#bef264] bg-clip-text text-transparent animate-fade-in pb-4">
            Coming Soon
          </h1>
          <p className="text-xl text-[#d4d4d8] leading-relaxed">
            We are working hard to bring you the best experience. Subscribe to
            be the first to know when we launch.
          </p>

          {/* Email list */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-6 mt-8"
          >
            <div className="w-full max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-[#27272a] text-[#fafafa] px-6 py-3 rounded-full border border-[#3f3f46] focus:border-[#a3e635] focus:outline-none transition-all duration-200"
                required
              />
              {status.type && (
                <p
                  className={`mt-2 text-sm ${
                    status.type === 'success'
                      ? 'text-[#a3e635]'
                      : 'text-red-400'
                  }`}
                >
                  {status.message}
                </p>
              )}
            </div>

            <div className="mt-8">
              <Link
                href="/"
                className="inline-block bg-transparent text-[#a3e635] border-2 border-[#a3e635] px-8 py-3 rounded-full font-semibold hover:bg-[#a3e635]/10 transition-all duration-300 mr-4"
              >
                Go Back
              </Link>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#a3e635] text-[#18181b] px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-[#bef264] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#a3e635]/20 hover:animate-pulse-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
