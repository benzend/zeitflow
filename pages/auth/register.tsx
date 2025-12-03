import { getProviders, signIn, getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/Button';
import { Provider } from 'next-auth/providers/index';
import { useState } from 'react';

export default function Register({ providers }: { providers: Provider[] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'An error occurred');
        return;
      }

      // Registration successful
      setSuccess(data.message);
      if (data.requiresVerification) {
        setRequiresVerification(true);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Verification email sent! Please check your inbox.');
      } else {
        setError(data.message || 'Failed to send verification email');
      }
    } catch {
      setError('Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const credentialsProvider = Object.values(providers).find(p => p.id === 'credentials');
  const otherProviders = Object.values(providers).filter(p => p.id !== 'credentials');

  return (
    <div>
      <Head>
        <title>Register - jjoist</title>
        <meta name="description" content="Create your jjoist account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-10 mt-20 max-w-6xl">
        <div className="flex justify-center">
          <div className="bg-background-light rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="-mt-4 mb-8">
              <div className="px-4 py-2 rounded-lg">
                <h1 className="text-xl font-bold text-center text-primary">
                  Create Account
                </h1>
              </div>
            </div>

            {credentialsProvider && !requiresVerification && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 bg-background text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-600 bg-background text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-600 bg-background text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your password (min 6 characters)"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                {success && (
                  <p className="text-green-500 text-sm">{success}</p>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  className="w-full"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            )}

            {requiresVerification && (
              <div className="mb-6 p-4 bg-background border border-gray-600 rounded-lg">
                <h3 className="text-primary font-medium mb-2">Check your email!</h3>
                <p className="text-primary/80 text-sm mb-4">
                  We&apos;ve sent a verification link to <strong>{email}</strong>. 
                  Please click the link in the email to activate your account.
                </p>
                <div className="space-y-2">
                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}
                  {success && (
                    <p className="text-primary text-sm">{success}</p>
                  )}
                  <Button
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    variant="tertiary"
                    className="!bg-transparent !p-0 text-sm underline disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Resend verification email'}
                  </Button>
                </div>
              </div>
            )}

            {otherProviders.length > 0 && !requiresVerification && (
              <>
                {credentialsProvider && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-background text-primary/60">Or continue with</span>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {otherProviders.map((provider: Provider) => (
                    <div key={provider.name}>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          signIn(provider.id, { callbackUrl: '/dashboard' })
                        }
                        className="w-full"
                      >
                        Sign up with {provider.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-8 text-center">
              <p className="text-primary/60 text-sm">
                By creating an account, you agree to our <Button href="/terms" variant="tertiary" className="!bg-transparent !p-0 underline text-primary">terms of service</Button> and{' '}
                <Button href="/privacy" variant="tertiary" className="!bg-transparent !p-0 underline text-primary">privacy policy</Button>.
              </p>
              <p className="mt-2 text-primary/60 text-sm">
                Already have an account?{' '}
                <Button
                  href="/auth/signin"
                  variant="tertiary"
                  className="!bg-transparent !p-0 text-primary hover:text-primary-light transition duration-200"
                >
                  Sign in
                </Button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  const providers = await getProviders();

  return {
    props: {
      providers: providers ?? [],
    },
  };
};
