import { getProviders, signIn, getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import { Provider } from 'next-auth/providers/index';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SignIn({ providers }: { providers: Provider[] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowResendVerification(false);
    setVerificationMessage('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('verify your email')) {
          setError('Please verify your email before signing in');
          setShowResendVerification(true);
        } else {
          setError('Invalid email or password');
        }
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    
    setVerificationLoading(true);
    setVerificationMessage('');
    
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
        setVerificationMessage('Verification email sent! Please check your inbox.');
      } else {
        setVerificationMessage(data.message || 'Failed to send verification email');
      }
    } catch {
      setVerificationMessage('Failed to send verification email');
    } finally {
      setVerificationLoading(false);
    }
  };

  const credentialsProvider = Object.values(providers).find(p => p.id === 'credentials');
  const otherProviders = Object.values(providers).filter(p => p.id !== 'credentials');

  return (
    <div>
      <Head>
        <title>Sign In - jjoist</title>
        <meta name="description" content="Sign in to your jjoist account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-10 mt-60 max-w-6xl">
        <div className="flex justify-center">
          <div className="bg-foreground rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="-mt-4 mb-8">
              <div className="px-4 py-2 bg-foreground rounded-lg">
                <h1 className="text-xl font-bold text-center text-primary">
                  Sign In to jjoist
                </h1>
              </div>
            </div>

            {credentialsProvider && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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
                    className="w-full px-3 py-2 border border-gray-600 bg-background text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your password"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                {showResendVerification && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm mb-2">
                      Check your email for a verification link, or click below to resend it.
                    </p>
                    {verificationMessage && (
                      <p className={`text-sm mb-2 ${verificationMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                        {verificationMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={verificationLoading}
                      className="text-sm text-primary hover:text-primary-light underline disabled:opacity-50"
                    >
                      {verificationLoading ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-[#18181b] py-3 px-4 rounded-lg hover:bg-primary-light transition duration-200 font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            )}

            {otherProviders.length > 0 && (
              <>
                {credentialsProvider && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-foreground text-primary/60">Or continue with</span>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {otherProviders.map((provider: Provider) => (
                    <div key={provider.name}>
                      <button
                        onClick={() =>
                          signIn(provider.id, { callbackUrl: '/dashboard' })
                        }
                        className="w-full bg-primary text-[#18181b] py-3 px-4 rounded-lg hover:bg-primary-light transition duration-200 font-medium cursor-pointer"
                      >
                        Sign in with {provider.name}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-8 text-center">
              <p className="text-primary/60 text-sm">
                By signing in, you agree to our <Link href="/terms" className="underline text-primary">terms of service</Link> and{' '}
                <Link href="/privacy" className="underline text-primary">privacy policy</Link>.
              </p>
              <p className="mt-2 text-primary/60 text-sm">
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/register"
                  className="text-primary hover:text-primary-light transition duration-200"
                >
                  Create one
                </Link>
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
