# Stripe Subscription Setup Guide

This guide will help you complete the Stripe subscription integration for jjoist.

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook endpoint secret (configured after creating webhook)

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_PRO_PRICE_ID=price_...  # Pro plan price ID ($9.99/month)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...  # Same as above, for frontend
STRIPE_UNLIMITED_PRICE_ID=price_...  # Unlimited plan price ID ($29.99/month)
NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID=price_...  # Same as above, for frontend
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

In your Stripe dashboard, create these products:

**Pro Plan:**
- Name: jjoist Pro
- Price: $9.99/month
- Recurring: Monthly
- Copy the Price ID and use it for `STRIPE_PRO_PRICE_ID`

**Unlimited Plan:**
- Name: jjoist Unlimited
- Price: $29.99/month
- Recurring: Monthly
- Copy the Price ID and use it for `STRIPE_UNLIMITED_PRICE_ID`

### 2. Configure Webhook

1. Go to Developers > Webhooks in your Stripe dashboard
2. Click "Add endpoint"
3. Use endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret and use it for `STRIPE_WEBHOOK_SECRET`

## Features Implemented

✅ **Database Schema**: Subscription and plan tables added
✅ **API Endpoints**: 
- `/api/subscription/create` - Create checkout sessions
- `/api/subscription/status` - Get user subscription status
- `/api/subscription/cancel` - Cancel subscription
- `/api/stripe/webhook` - Handle Stripe webhooks

✅ **Rate Limiting**: Enhanced with subscription tiers
- Free: 20 requests/hour
- Pro: 100 requests/hour  
- Unlimited: 1000 requests/hour

✅ **UI Components**: Subscription management in dashboard

## Testing

1. Use Stripe test keys for development
2. Test the subscription flow:
   - Sign up as a new user
   - View subscription card on dashboard
   - Upgrade to Pro or Unlimited
   - Test cancellation
3. Test rate limiting with different subscription tiers

## Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook URL to production domain
- [ ] Test webhook delivery in production
- [ ] Monitor subscription events in Stripe dashboard
- [ ] Set up proper error monitoring for payment failures

## Subscription Tiers

| Tier | Price | Requests/Hour | Features |
|------|-------|---------------|----------|
| Free | $0 | 20 | Basic support |
| Pro | $9.99/mo | 100 | Priority support, Advanced features |
| Unlimited | $29.99/mo | 1000 | Premium support, All features |

## Support

Users can upgrade, downgrade, or cancel subscriptions directly from the dashboard. Cancellations take effect at the end of the billing period to ensure users get full value for their payment.