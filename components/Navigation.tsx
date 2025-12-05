'use client';

import Logo from '@/app/components/Logo';
import { Button } from './Button';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  return (
    <nav className="w-full bg-surface/80 backdrop-blur-sm border-b border-border fixed top-0 z-50 animate-slide-up-fade">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Button href="/" variant="tertiary" className="flex items-center space-x-2 group !bg-transparent !p-0 !h-auto">
              <div className="relative w-8 h-8 animate-scale-in">
                <Logo className="text-primary group-hover:animate-spin-slow transition-all duration-300" />
              </div>
              <span className="text-xl font-bold text-accent animate-slide-up-fade delay-100">
                jjoist
              </span>
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              href="/auth/signin"
              variant="tertiary"
              className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              href="/auth/register"
              >
              Register
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
