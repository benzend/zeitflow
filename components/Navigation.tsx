import Logo from '@/app/components/Logo';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navigation() {
  const { data: session, status } = useSession();

  return (
    <nav className="w-full bg-[#18181b]/80 backdrop-blur-sm border-b border-[#27272a] fixed top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative w-8 h-8">
                <Logo className="text-[#a3e635] group-hover:animate-spin-slow transition-all duration-300" />
              </div>
              <span className="text-xl font-bold text-[#a3e635]">
                jjoist
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-[#d4d4d8]">Loading...</div>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-[#d4d4d8] hover:text-[#a3e635] transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-[#d4d4d8] text-sm">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-600 text-white px-4 py-2 rounded-full font-medium hover:bg-red-700 transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => signIn()}
                  className="text-[#d4d4d8] hover:text-[#a3e635] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => signIn()}
                  className="bg-[#a3e635] text-[#18181b] px-4 py-2 rounded-full font-medium hover:bg-[#bef264] transition-all duration-200 hover:animate-pulse-glow"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
