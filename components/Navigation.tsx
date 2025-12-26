'use client';

import { useSession } from 'next-auth/react';
import Logo from '@/app/components/Logo';
import { Button } from './Button';
import ThemeToggle from './ThemeToggle';
import ProfileDropdown from './ProfileDropdown';

export default function Navigation() {
  const { data: session, status } = useSession();

  return (
    <nav className="w-full bg-surface/80 backdrop-blur-sm border-b border-border fixed top-0 z-50 animate-slide-up-fade">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Button href="/" variant="tertiary" className="flex items-center space-x-2 group !bg-transparent !p-0 !h-auto">
              <div className="relative w-8 h-8 animate-scale-in">
                <Logo
                  className="text-primary animate-spin-slow animate-pulse-glow"
                />
              </div>
              <span className="text-xl font-bold text-accent animate-slide-up-fade delay-100">
                ZeitFlow
              </span>
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              href="/blog"
              variant="tertiary"
              className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
            >
              Blog
            </Button>
            {status === 'authenticated' && session?.user?.email && (
              <Button
                href="/blog/manage"
                variant="tertiary"
                className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Manage
              </Button>
            )}
            <ThemeToggle />
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-surface animate-pulse"></div>
            ) : status === 'authenticated' ? (
              <ProfileDropdown />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}