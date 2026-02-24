'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Logo from '@/app/components/Logo';
import { Button } from './Button';
import ThemeToggle from './ThemeToggle';
import ProfileDropdown from './ProfileDropdown';
import { GODMODE_EMAILS } from '@/lib/constants';

export default function Navigation() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      role="navigation"
      className="w-full bg-surface/80 backdrop-blur-sm border-b border-border fixed top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
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
            <div className="hidden lg:flex items-center space-x-4">
              <Button
                href="/blog"
                variant="tertiary"
                className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Blog
              </Button>
              <Button
                href="/guides"
                variant="tertiary"
                className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Guides
              </Button>
              <Button
                href="/integrations"
                variant="tertiary"
                className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Integrations
              </Button>
              <Button
                href="/pricing"
                variant="tertiary"
                className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Pricing
              </Button>
            </div>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />
            {status === 'authenticated' && (
              <Button
                href="/dashboard"
                variant="tertiary"
                className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Dashboard
              </Button>
            )}
            {status === 'authenticated' && session?.user?.email && GODMODE_EMAILS.includes(session.user.email) && (
              <Button
                href="/blog/manage"
                variant="tertiary"
                className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 animate-slide-up-fade delay-200"
              >
                Manage
              </Button>
            )}
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

          {/* Hamburger Button - Tablet & Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-text-muted hover:text-primary hover:bg-surface transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile & Tablet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-3 border-t border-border animate-slide-down">
            <Button
              href="/blog"
              variant="tertiary"
              className="!bg-transparent !p-2 text-text-muted hover:text-primary transition-colors duration-200 w-full text-left"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Button>
            <Button
              href="/guides"
              variant="tertiary"
              className="!bg-transparent !p-2 text-text-muted hover:text-primary transition-colors duration-200 w-full text-left"
              onClick={() => setMobileMenuOpen(false)}
            >
              Guides
            </Button>
            <Button
              href="/integrations"
              variant="tertiary"
              className="!bg-transparent !p-2 text-text-muted hover:text-primary transition-colors duration-200 w-full text-left"
              onClick={() => setMobileMenuOpen(false)}
            >
              Integrations
            </Button>
            <Button
              href="/pricing"
              variant="tertiary"
              className="!bg-transparent !p-2 text-text-muted hover:text-primary transition-colors duration-200 w-full text-left"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Button>
            {status === 'authenticated' && (
              <Button
                href="/dashboard"
                variant="tertiary"
                className="!bg-transparent !p-2 text-text-muted hover:text-primary transition-colors duration-200 w-full text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Button>
            )}
            {status === 'authenticated' && session?.user?.email && GODMODE_EMAILS.includes(session.user.email) && (
              <Button
                href="/blog/manage"
                variant="tertiary"
                className="!bg-transparent !p-2 text-text-muted hover:text-primary transition-colors duration-200 w-full text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                Manage
              </Button>
            )}
            {status === 'loading' ? (
              <div className="w-full h-10 rounded-md bg-surface animate-pulse"></div>
            ) : status === 'authenticated' ? (
              <div className="px-2">
                <ProfileDropdown />
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  href="/auth/signin"
                  variant="tertiary"
                  className="!bg-transparent !p-2 text-text-muted hover:text-primary transition-colors duration-200 w-full text-left"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  href="/auth/register"
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
