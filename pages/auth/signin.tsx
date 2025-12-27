import { getProviders, signIn, getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/Button';
import { Provider } from 'next-auth/providers/index';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SignIn({ providers }: { providers: Provider[] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkError, setMagicLinkError] = useState('');
  const [magicLinkSuccess, setMagicLinkSuccess] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'credentials' | 'magic'>('credentials');
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

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail) return;

    setMagicLinkLoading(true);
    setMagicLinkError('');
    setMagicLinkSuccess('');

    try {
      const result = await signIn('email', {
        email: magicLinkEmail,
        redirect: false,
      });

      if (result?.error) {
        setMagicLinkError('Failed to send magic link. Please try again.');
      } else {
        setMagicLinkSuccess('Magic link sent! Check your email inbox.');
        setMagicLinkEmail('');
      }
    } catch {
      setMagicLinkError('An error occurred. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const credentialsProvider = Object.values(providers).find(p => p.id === 'credentials');
  const emailProvider = Object.values(providers).find(p => p.id === 'email');
  const otherProviders = Object.values(providers).filter(p => p.id !== 'credentials' && p.id !== 'email');

  return (
    <div>
      <Head>
        <title>Sign In - ZeitFlow | AI Prompt Chain Management</title>
        <meta name="description" content="Sign in to your ZeitFlow account to access your AI prompt chains, manage workflows, and process intelligent automation sequences." />
        <meta name="keywords" content="sign in, login, ZeitFlow, AI prompt chains, workflow management, automation, artificial intelligence" />
        <meta property="og:title" content="Sign In - ZeitFlow" />
        <meta property="og:description" content="Access your AI prompt chains and workflow management dashboard." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/auth/signin`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sign In - ZeitFlow" />
        <meta name="twitter:description" content="Access your AI prompt chains and workflow management dashboard." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/auth/signin`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-10 mt-20 max-w-6xl">
        <div className="flex justify-center">
          <div className="bg-background-light rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="-mt-4 mb-8">
              <div className="px-4 py-2 rounded-lg">
                <h1 className="text-xl font-bold text-center text-primary">
                  Sign In to ZeitFlow
                </h1>
              </div>
            </div>

            {/* Tab Navigation */}
            {(credentialsProvider || emailProvider) && (
              <div className="flex mb-6 border-b border-border">
                {credentialsProvider && (
                  <Button
                    onClick={() => setActiveTab('credentials')}
                    variant="secondary"
                    className={`flex-1 rounded-none ${
                      activeTab === 'credentials'
                        ? 'text-primary border-b-2 border-primary hover:!bg-surface'
                        : 'text-primary/60 hover:text-primary !bg-primary/10'
                    }`}
                  >
                    Email & Password
                  </Button>
                )}
                {emailProvider && (
                  <Button
                    onClick={() => setActiveTab('magic')}
                    variant="secondary"
                    className={`flex-1 rounded-none ${
                      activeTab === 'magic'
                        ? 'text-primary border-b-2 border-primary hover:!bg-surface'
                        : 'text-primary/60 hover:text-primary !bg-primary/10'
                    }`}
                  >
                    Magic Link
                  </Button>
                )}
              </div>
            )}

            {/* Credentials Form */}
            {activeTab === 'credentials' && credentialsProvider && (
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
                    className="w-full px-3 py-2 border border-border bg-surface text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-3 py-2 border border-border bg-surface text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                    <Button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={verificationLoading}
                      variant="tertiary"
                      className="!bg-transparent !p-0 text-sm underline disabled:opacity-50"
                    >
                      {verificationLoading ? 'Sending...' : 'Resend verification email'}
                    </Button>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  className="w-full"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            )}

            {/* Magic Link Form */}
            {activeTab === 'magic' && emailProvider && (
              <form onSubmit={handleMagicLinkSignIn} className="space-y-4 mb-6">
                <div>
                  <label htmlFor="magic-email" className="block text-sm font-medium text-primary mb-2">
                    Email
                  </label>
                   <input
                     type="email"
                     id="magic-email"
                     value={magicLinkEmail}
                     onChange={(e) => setMagicLinkEmail(e.target.value)}
                     required
                     className="w-full px-3 py-2 border border-border bg-surface text-foreground placeholder-text-placeholder rounded-lg focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
                     placeholder="Enter your email"
                   />
                </div>
                {magicLinkError && (
                  <p className="text-red-500 text-sm">{magicLinkError}</p>
                )}
                {magicLinkSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">{magicLinkSuccess}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={magicLinkLoading}
                  variant="primary"
                  className="w-full"
                >
                  {magicLinkLoading ? 'Sending magic link...' : 'Send magic link'}
                </Button>
              </form>
            )}

            {otherProviders.length > 0 && (
              <>
                {(credentialsProvider || emailProvider) && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
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
                        onClick={() =>
                          signIn(provider.id, { callbackUrl: '/dashboard' })
                        }
                        variant="secondary"
                        className="w-full"
                      >
                        Sign in with {provider.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-8 text-center">
              <p className="text-primary/60 text-sm">
                By signing in, you agree to our <Button href="/terms" variant="tertiary" className="!bg-transparent !p-0 underline text-primary">terms of service</Button> and{' '}
                <Button href="/privacy" variant="tertiary" className="!bg-transparent !p-0 underline text-primary">privacy policy</Button>.
              </p>
              <p className="mt-2 text-primary/60 text-sm">
                Don&apos;t have an account?{' '}
                <Button
                  href="/auth/register"
                  variant="tertiary"
                  className="!bg-transparent !p-0 text-primary hover:text-primary-light transition duration-200"
                >
                  Create one
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
