import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/Button';

export default function VerifyEmail() {
  const router = useRouter();
  const { token, email } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmailOnMount = async () => {
      if (token && email) {
        try {
          const response = await fetch(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email as string)}`);
          const data = await response.json();

          if (response.ok) {
            setStatus('success');
            setMessage('Your email has been verified successfully!');
          } else {
            setStatus('error');
            setMessage(data.message || 'Email verification failed');
          }
        } catch {
          setStatus('error');
          setMessage('An error occurred while verifying your email');
        }
      }
    };

    verifyEmailOnMount();
  }, [token, email]);


  return (
    <div>
      <Head>
        <title>Email Verification - ZeitFlow | AI Prompt Chain Management</title>
        <meta name="description" content="Verify your email address to activate your ZeitFlow account and start using AI prompt chains and workflow automation." />
        <meta name="keywords" content="email verification, verify email, ZeitFlow, account activation, AI prompt chains, workflow management" />
        <meta property="og:title" content="Email Verification - ZeitFlow" />
        <meta property="og:description" content="Verify your email to activate your ZeitFlow account." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/auth/verify`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Email Verification - ZeitFlow" />
        <meta name="twitter:description" content="Verify your email to activate your ZeitFlow account." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/auth/verify`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-10 mt-60 max-w-6xl">
        <div className="flex justify-center">
          <div className="bg-background-light rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="-mt-4 mb-8">
              <div className="px-4 py-2 bg-background-light rounded-lg">
                <h1 className="text-xl font-bold text-center text-primary">
                  Email Verification
                </h1>
              </div>
            </div>

            <div className="text-center">
              {status === 'loading' && (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-primary">Verifying your email...</p>
                </div>
              )}

              {status === 'success' && (
                <div>
                  <div className="text-green-500 text-4xl mb-4">✓</div>
                  <h2 className="text-lg font-semibold text-primary mb-4">Email Verified!</h2>
                  <p className="text-primary/80 mb-6">{message}</p>
                  <Button
                    href="/auth/signin"
                    variant="primary"
                    className="w-full"
                  >
                    Sign In to Your Account
                  </Button>
                </div>
              )}

              {status === 'error' && (
                <div>
                  <div className="text-red-500 text-4xl mb-4">✗</div>
                  <h2 className="text-lg font-semibold text-primary mb-4">Verification Failed</h2>
                  <p className="text-red-500 mb-6">{message}</p>
                  <div className="space-y-3">
                    <Button
                      href="/auth/register"
                      variant="primary"
                      className="w-full"
                    >
                      Try Again
                    </Button>
                    <Button
                      href="/auth/signin"
                      variant="tertiary"
                      className="!bg-transparent !p-0 block text-primary hover:text-primary-light transition duration-200 text-sm"
                    >
                      Already have an account? Sign in
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
