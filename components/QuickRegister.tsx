'use client';

import { useState } from 'react';
import { Button } from './Button';

export default function QuickRegister() {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    const params = new URLSearchParams({ email });
    window.location.href = `/auth/register?${params.toString()}`;
  };

  return (
    <div className="space-y-4 w-full md:px-8">
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          Try it while it's in beta
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-surface/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-text-muted"
            placeholder="Enter your email"
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full py-3 text-lg"
          disabled={!email}
        >
          Get Started for Free →
        </Button>
      </form>
      
      <div className="text-center">
        <p className="text-sm text-text-muted">
          Already have an account?{' '}
          <a 
            href="/auth/signin" 
            className="text-primary hover:text-primary/80 transition-colors duration-200 font-medium"
          >
            Log In
          </a>
        </p>
      </div>
      
      <p className="text-xs text-text-muted text-center">
        By signing up, you agree to our{' '}
        <a 
          href="/terms" 
          className="text-primary hover:text-primary/80 transition-colors duration-200"
        >
          terms
        </a>
        {' '}and{' '}
        <a 
          href="/privacy" 
          className="text-primary hover:text-primary/80 transition-colors duration-200"
        >
          privacy policy
        </a>
      </p>
    </div>
  );
}
