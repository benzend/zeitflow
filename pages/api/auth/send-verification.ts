import { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { usersTable, verificationTokensTable } from '@/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email is required' })
  }

  try {
    // Check if user exists
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1)
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if already verified
    if (user[0].emailVerified) {
      return res.status(400).json({ message: 'Email already verified' })
    }

    // Delete any existing verification tokens for this email
    await db
      .delete(verificationTokensTable)
      .where(eq(verificationTokensTable.identifier, email))

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store verification token
    await db.insert(verificationTokensTable).values({
      identifier: email,
      token,
      expires,
    })

    // Send verification email
    const verificationUrl = `${process.env.HOST || 'http://localhost:3000'}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`

    await resend.emails.send({
      from: process.env.VERIFY_FROM_EMAIL!,
      to: email,
      subject: 'Verify your jjoist account',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
          <p>Hello,</p>
          <p>Thank you for signing up for jjoist! Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with jjoist, you can safely ignore this email.</p>
        </div>
      `,
    })

    res.status(200).json({ message: 'Verification email sent' })
  } catch (error) {
    console.error('Send verification email error:', error)
    res.status(500).json({ message: 'Failed to send verification email' })
  }
}
