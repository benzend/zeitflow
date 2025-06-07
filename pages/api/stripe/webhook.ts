import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { subscriptionsTable } from '@/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, (err as Error).message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSuccess(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailure(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) return;

  // Find user by customer ID
  const existingSubscription = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.customerId, customerId))
    .limit(1);

  if (existingSubscription.length > 0) {
    // Update existing subscription
    await db
      .update(subscriptionsTable)
      .set({
        status: subscription.status,
        priceId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.id, subscription.id));
  } else {
    // This should not happen if properly created through our API
    console.error('Subscription not found for update:', subscription.id);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  await db
    .update(subscriptionsTable)
    .set({
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.id, subscription.id));
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await handleSubscriptionChange(subscription);
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    await db
      .update(subscriptionsTable)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.id, invoice.subscription as string));
  }
}