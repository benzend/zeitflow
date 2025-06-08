import Logo from '@/app/components/Logo';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="w-full bg-[#18181b]/80 backdrop-blur-sm border-b border-[#27272a] fixed top-0 z-50 animate-slide-up-fade">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative w-8 h-8 animate-scale-in">
                <Logo className="text-[#a3e635] group-hover:animate-spin-slow transition-all duration-300" />
              </div>
              <span className="text-xl font-bold text-[#a3e635] animate-slide-up-fade delay-100">
                jjoist
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/signin"
              className="text-[#d4d4d8] hover:text-[#a3e635] transition-colors duration-200 animate-slide-up-fade delay-200"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-[#a3e635] text-[#18181b] px-4 py-2 rounded-full font-medium hover:bg-[#bef264] transition-all duration-200 animate-slide-up-fade delay-300 hover:animate-pulse-glow"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
