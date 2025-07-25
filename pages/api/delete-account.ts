import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { usersTable, subscriptionsTable, queuedChainsTable } from '@/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { password, confirmEmail } = req.body;

  if (!confirmEmail) {
    return res.status(400).json({ error: 'Email confirmation is required' });
  }

  if (confirmEmail !== session.user.email) {
    return res.status(400).json({ error: 'Email confirmation does not match' });
  }

  try {
    // Get user from database
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password for email/password users (skip for OAuth users)
    if (user[0].password) {
      if (!password) {
        return res.status(400).json({ error: 'Password is required for email/password accounts' });
      }
      const isPasswordValid = await bcrypt.compare(password, user[0].password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid password' });
      }
    }

    // Get user's subscription
    const subscription = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, user[0].id))
      .limit(1);

    // Check for active queued chains and stop them
    const activeQueuedChains = await db
      .select()
      .from(queuedChainsTable)
      .where(and(
        eq(queuedChainsTable.userId, user[0].id),
        eq(queuedChainsTable.status, "pending")
      ));

    if (activeQueuedChains.length > 0) {
      // Update all active queued chains to stopped status
      await db
        .update(queuedChainsTable)
        .set({ 
          status: "stopped",
          updatedAt: new Date()
        })
        .where(and(
          eq(queuedChainsTable.userId, user[0].id),
          eq(queuedChainsTable.status, "pending")
        ));
    }

    // Cancel Stripe subscription if exists
    if (subscription.length > 0) {
      try {
        const sub = subscription[0];
        
        // Cancel the subscription immediately
        await stripe.subscriptions.update(sub.id, {
          cancel_at_period_end: false, // Cancel immediately
        });

        // Cancel the subscription from Stripe
        await stripe.subscriptions.cancel(sub.id);

        // Try to delete the customer (optional)
        try {
          await stripe.customers.del(sub.customerId);
        } catch (customerError) {
          console.log('Could not delete Stripe customer:', customerError);
          // Continue with account deletion even if customer deletion fails
        }
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with account deletion even if Stripe operations fail
      }
    }

    // Delete the user (this will cascade delete all related data)
    await db.delete(usersTable).where(eq(usersTable.id, user[0].id));

    // Log the deletion for audit purposes
    console.log(`User account deleted: ${user[0].email} (${user[0].id})`);

    res.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
} 