import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { usersTable } from '@/schema'
import { eq } from 'drizzle-orm'
import { vemetric } from '@/lib/vemetric-client'
import { encrypt, hashValue } from '@/lib/encryption'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password, name } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' })
  }

  try {
    // Check if user already exists
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1)
    
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with encrypted API token
    const rawApiToken = crypto.randomUUID();
    const [newUser] = await db.insert(usersTable).values({
      email,
      password: hashedPassword,
      name: name || null,
      emailVerified: null, // User needs to verify email
      apiToken: encrypt(rawApiToken),
      apiTokenHash: hashValue(rawApiToken),
    }).returning()

    vemetric.trackEvent('UserInitialized', {
      userIdentifier: newUser.id,
      userDisplayName: newUser.name || undefined,
    });

    // Send verification email
    try {
      const response = await fetch(`${process.env.HOST || 'http://localhost:3000'}/api/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        console.error('Failed to send verification email')
      }
    } catch (error) {
      console.error('Error sending verification email:', error)
    }

    res.status(201).json({ 
      message: 'Account created successfully! Please check your email to verify your account.',
      requiresVerification: true,
      user: { id: newUser.id, email: newUser.email } 
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
