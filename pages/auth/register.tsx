import { getProviders, signIn, getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import { Provider } from 'next-auth/providers/index';
import Link from 'next/link';

export default function Register({ providers }: { providers: Provider[] }) {
  return (
    <div>
      <Head>
        <title>Register - jjoist</title>
        <meta name="description" content="Create your jjoist account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-10 mt-60 max-w-6xl">
        <div className="flex justify-center">
          <div className="bg-foreground rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="-mt-4 mb-8">
              <div className="px-4 py-2 bg-foreground rounded-lg">
                <h1 className="text-xl font-bold text-center text-primary">
                  Create Account
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              {Object.values(providers).map((provider: Provider) => (
                <div key={provider.name}>
                  <button
                    onClick={() =>
                      signIn(provider.id, { callbackUrl: '/dashboard' })
                    }
                    className="w-full bg-primary text-[#18181b] py-3 px-4 rounded-lg hover:bg-primary-light transition duration-200 font-medium cursor-pointer"
                  >
                    Sign up with {provider.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-primary/60 text-sm">
                By creating an account, you agree to our terms of service and
                privacy policy.
              </p>
              <p className="mt-2 text-primary/60 text-sm">
                Already have an account?{' '}
                <Link
                  href="/auth/signin"
                  className="text-primary hover:text-primary-light transition duration-200"
                >
                  Sign in
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
