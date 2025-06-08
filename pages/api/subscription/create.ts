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

  const { priceId } = req.body;
  if (!priceId) {
    return res.status(400).json({ error: 'Price ID is required' });
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

    const userId = user[0].id;

    // Check if user already has an active subscription
    const existingSubscription = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .limit(1);

    // If user has an active subscription, redirect to customer portal
    if (existingSubscription.length > 0 && existingSubscription[0].status === 'active') {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: existingSubscription[0].customerId,
          return_url: `${process.env.HOST || 'http://localhost:3000'}/dashboard`,
          flow_data: {
            type: 'subscription_update_confirm',
            subscription_update_confirm: {
              subscription: existingSubscription[0].id,
              items: [{
                id: (await stripe.subscriptions.retrieve(existingSubscription[0].id)).items.data[0].id,
                price: priceId,
              }],
            },
          },
        });
        
        return res.json({ url: portalSession.url });
      } catch (error) {
        console.error('Failed to create portal session:', error);
        return res.status(500).json({ error: 'Failed to create portal session' });
      }
    }

    // Create or retrieve Stripe customer
    let customerId: string;
    if (existingSubscription.length > 0) {
      customerId = existingSubscription[0].customerId;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
      });
      customerId = customer.id;
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.HOST || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.HOST || 'http://localhost:3000'}/dashboard?canceled=true`,
      metadata: {
        userId,
      },
    });

    res.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}