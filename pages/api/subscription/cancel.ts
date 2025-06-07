import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { subscriptionsTable, usersTable } from '@/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
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

    // Get user's subscription
    const subscription = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, user[0].id))
      .limit(1);

    if (subscription.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const sub = subscription[0];

    // Cancel subscription at period end
    await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    });

    // Update local database
    await db
      .update(subscriptionsTable)
      .set({
        cancelAtPeriodEnd: 1,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.id, sub.id));

    res.json({ success: true, message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}