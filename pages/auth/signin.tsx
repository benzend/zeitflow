import { getProviders, signIn, getSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Navigation from '@/components/Navigation'

export default function SignIn({ providers }: { providers: any }) {
  return (
    <div>
      <Head>
        <title>Sign In - Joice</title>
        <meta name="description" content="Sign in to your Joice account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-md min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Sign In to Joice</h1>
          
          <div className="space-y-4">
            {Object.values(providers).map((provider: any) => (
              <div key={provider.name}>
                <button
                  onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                >
                  Sign in with {provider.name}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  const providers = await getProviders()

  return {
    props: {
      providers: providers ?? [],
    },
  }
}