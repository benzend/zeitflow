import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { usersTable, accountsTable, sessionsTable, verificationTokensTable } from '@/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sendMagicLinkEmail } from '@/lib/email'
import { encrypt } from '@/lib/encryption'

// Wrap the DrizzleAdapter to encrypt OAuth tokens before they are stored
function createEncryptedAdapter() {
  const baseAdapter = DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
  });

  const originalLinkAccount = baseAdapter.linkAccount;

  return {
    ...baseAdapter,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linkAccount: async (account: any) => {
      if (account.access_token) account.access_token = encrypt(account.access_token);
      if (account.refresh_token) account.refresh_token = encrypt(account.refresh_token);
      if (account.id_token) account.id_token = encrypt(account.id_token);
      return originalLinkAccount!(account);
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: createEncryptedAdapter() as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.select().from(usersTable).where(eq(usersTable.email, credentials.email)).limit(1)

        if (user.length === 0 || !user[0].password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user[0].password)

        if (!isPasswordValid) {
          return null
        }

        // Check if email is verified for credentials login
        if (!user[0].emailVerified) {
          throw new Error('Please verify your email before signing in')
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
        }
      }
    }),
    EmailProvider({
      from: process.env.RESEND_FROM_EMAIL,
      async sendVerificationRequest({
        identifier: email,
        url,
      }) {
        const result = await sendMagicLinkEmail(email, url)

        if (!result.success) {
          throw new Error(`Failed to send verification email: ${result.error}`)
        }
      },
      maxAge: 24 * 60 * 60, // 24 hours
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    session: async ({ session }) => {
      if (session?.user?.email) {
        // Add user ID to session
        const user = await db.select().from(usersTable).where(eq(usersTable.email, session.user.email)).limit(1);
        if (user.length > 0) {
          session.user.email = user[0].email;
        }
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
}

export default NextAuth(authOptions)
