import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/db'
import { usersTable, verificationTokensTable } from '@/schema'
import { eq, and } from 'drizzle-orm'
import { vemetric } from '@/lib/vemetric-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { token, email } = req.query

  if (!token || !email || typeof token !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ message: 'Invalid verification link' })
  }

  try {
    // Find the verification token
    const verificationToken = await db
      .select()
      .from(verificationTokensTable)
      .where(
        and(
          eq(verificationTokensTable.identifier, email),
          eq(verificationTokensTable.token, token)
        )
      )
      .limit(1)

    if (verificationToken.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification link' })
    }

    // Check if token has expired
    if (verificationToken[0].expires < new Date()) {
      // Delete expired token
      await db
        .delete(verificationTokensTable)
        .where(
          and(
            eq(verificationTokensTable.identifier, email),
            eq(verificationTokensTable.token, token)
          )
        )
      return res.status(400).json({ message: 'Verification link has expired' })
    }

    // Update user's email verification status
    const [user] = await db
      .update(usersTable)
      .set({ emailVerified: new Date() })
      .where(eq(usersTable.email, email))
      .returning()

    // Delete the verification token
    await db
      .delete(verificationTokensTable)
      .where(
        and(
          eq(verificationTokensTable.identifier, email),
          eq(verificationTokensTable.token, token)
        )
      )

    vemetric.trackEvent('EmailVerified', {
      userIdentifier: user.id,
      userDisplayName: user.name || undefined,
    });

    res.status(200).json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Email verification error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
