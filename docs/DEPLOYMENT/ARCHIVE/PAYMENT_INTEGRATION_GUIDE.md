# Payment Integration Guide

This guide explains how the Stripe payment integration works in the Secure File Share application.

## Overview

The payment system allows users to upgrade from the Free plan to Pro or Enterprise plans using Stripe. The integration includes:

- **Checkout Endpoint**: Creates Stripe checkout sessions
- **Webhook Handler**: Processes payment events from Stripe
- **Subscription Management**: Tracks and manages user subscriptions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User (Frontend)                          │
│                                                             │
│  1. Click "Upgrade to Pro"                                 │
│  2. Redirected to Stripe Checkout                          │
│  3. Enter payment details                                  │
│  4. Redirected to success/cancel URL                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Next.js)                          │
│                                                             │
│  POST /api/payments/create-checkout                        │
│  - Verify JWT token                                        │
│  - Create Stripe checkout session                          │
│  - Return session ID                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Stripe                                     │
│                                                             │
│  - Process payment                                         │
│  - Send webhook events                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Webhook Handler                                │
│                                                             │
│  POST /api/payments/webhook                                │
│  - Verify webhook signature                                │
│  - Handle checkout.session.completed                       │
│  - Update user plan in database                            │
│  - Set subscription expiration                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                          │
│                                                             │
│  users table:                                              │
│  - plan: 'free' | 'paid' | 'enterprise'                   │
│  - subscription_expires_at: TIMESTAMP                      │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a new account or sign in
3. Go to **Developers** > **API Keys**
4. Copy your **Publishable Key** and **Secret Key**

### 2. Create Products and Prices

1. Go to **Products** in Stripe Dashboard
2. Create two products:
   - **Pro Plan**: $4.99/month
   - **Enterprise Plan**: Custom pricing

3. For each product, create a price:
   - Set billing period to monthly
   - Copy the **Price ID**

### 3. Configure Environment Variables

Add the following to your `.env.local`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Product IDs
STRIPE_PRO_PRODUCT_ID=prod_your_pro_product_id_here
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
STRIPE_ENTERPRISE_PRODUCT_ID=prod_your_enterprise_product_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id_here

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. Set Up Webhook

1. Go to **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/payments/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `charge.failed`
   - `customer.subscription.deleted`
5. Copy the **Signing Secret** and add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## API Endpoints

### POST /api/payments/create-checkout

Creates a Stripe checkout session for plan upgrade.

**Authentication**: Required (JWT token)

**Request**:
```json
{
  "plan": "paid" | "enterprise"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_123",
    "url": "https://checkout.stripe.com/pay/cs_test_123"
  }
}
```

**Error Responses**:
- `400`: Invalid plan or request body
- `401`: Missing or invalid authentication token
- `404`: User not found
- `500`: Stripe API error

### POST /api/payments/webhook

Handles Stripe webhook events. This endpoint is called by Stripe, not by the frontend.

**Events Handled**:
- `checkout.session.completed`: Updates user plan to paid/enterprise
- `charge.failed`: Logs payment failure
- `customer.subscription.deleted`: Downgrades user to free plan

**Security**: Verifies Stripe webhook signature

### GET /api/payments/subscription

Returns current subscription status for authenticated user.

**Authentication**: Required (JWT token)

**Response**:
```json
{
  "success": true,
  "data": {
    "plan": "paid",
    "subscriptionExpiresAt": "2024-02-28T12:00:00Z",
    "isActive": true,
    "daysRemaining": 30
  }
}
```

## Frontend Integration

### Checkout Button

```typescript
async function handleCheckout(plan: 'paid' | 'enterprise') {
  try {
    const response = await fetch('/api/payments/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });

    const data = await response.json();

    if (data.success && data.data?.url) {
      // Redirect to Stripe checkout
      window.location.href = data.data.url;
    }
  } catch (error) {
    console.error('Checkout error:', error);
  }
}
```

### Check Subscription Status

```typescript
async function checkSubscription() {
  try {
    const response = await fetch('/api/payments/subscription', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('Plan:', data.data.plan);
      console.log('Active:', data.data.isActive);
      console.log('Days remaining:', data.data.daysRemaining);
    }
  } catch (error) {
    console.error('Subscription error:', error);
  }
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'paid', 'enterprise')),
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

**Fields**:
- `plan`: Current subscription plan
- `subscription_expires_at`: When the subscription expires (NULL for free users)

## Payment Flow

### 1. User Initiates Checkout

1. User clicks "Upgrade to Pro" button
2. Frontend calls `POST /api/payments/create-checkout`
3. Backend creates Stripe checkout session with user metadata
4. Backend returns session ID and checkout URL
5. Frontend redirects to Stripe checkout

### 2. User Completes Payment

1. User enters payment details in Stripe checkout
2. Stripe processes the payment
3. Stripe redirects user to success URL
4. Stripe sends `checkout.session.completed` webhook

### 3. Backend Processes Webhook

1. Webhook handler receives event from Stripe
2. Verifies webhook signature
3. Extracts user email and plan from metadata
4. Updates user plan in database
5. Sets subscription expiration to 30 days from now
6. Logs analytics event

### 4. User Sees Updated Plan

1. User is redirected to dashboard
2. Dashboard fetches subscription status
3. User sees "Pro" plan with expiration date

## Subscription Expiration

When a subscription expires:

1. Cron job or background task checks for expired subscriptions
2. User is downgraded to free plan
3. User receives notification (optional)
4. User can upgrade again

**Note**: Currently, subscriptions are set to expire 30 days after purchase. You can implement automatic renewal or manual renewal prompts.

## Error Handling

### Checkout Errors

- **Invalid Plan**: Returns 400 with error message
- **Missing Token**: Returns 401 with error message
- **User Not Found**: Returns 404 with error message
- **Stripe API Error**: Returns 500 with error message

### Webhook Errors

- **Invalid Signature**: Returns 401 (webhook is rejected)
- **Missing Metadata**: Logs error but returns 200 (webhook is acknowledged)
- **Database Error**: Logs error but returns 200 (webhook is acknowledged)

## Security Considerations

### Webhook Signature Verification

The webhook handler verifies the Stripe signature to ensure the webhook is from Stripe:

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  STRIPE_CONFIG.webhookSecret
);
```

This prevents attackers from sending fake webhook events.

### Metadata Validation

The checkout session includes metadata with user information:

```typescript
metadata: {
  userId: user.userId,
  plan: plan,
  email: userData.email,
}
```

This metadata is used to identify the user when processing the webhook.

### JWT Authentication

All checkout and subscription endpoints require JWT authentication:

```typescript
export const POST = withAuth(handler);
```

This ensures only authenticated users can initiate checkouts.

## Testing

### Unit Tests

Run unit tests for payment logic:

```bash
npm test -- app/api/payments/__tests__/payments.test.ts --run
```

### Integration Tests

Run integration tests for API endpoints:

```bash
npm test -- app/api/payments/__tests__/integration.test.ts --run
```

### Manual Testing

1. Set up Stripe test account
2. Use test card numbers: `4242 4242 4242 4242`
3. Test checkout flow
4. Verify webhook events in Stripe Dashboard
5. Check database for updated user plan

## Troubleshooting

### Webhook Not Received

1. Check webhook URL in Stripe Dashboard
2. Verify webhook secret in `.env.local`
3. Check server logs for errors
4. Test webhook in Stripe Dashboard

### User Plan Not Updated

1. Check webhook signature verification
2. Verify metadata in checkout session
3. Check database for user record
4. Check analytics logs for errors

### Checkout Session Not Created

1. Verify Stripe API keys in `.env.local`
2. Check product and price IDs
3. Verify user exists in database
4. Check server logs for errors

## Production Deployment

### Before Going Live

1. Switch to Stripe production keys
2. Create production products and prices
3. Update webhook URL to production domain
4. Test full payment flow
5. Set up monitoring and alerting
6. Document support procedures

### Monitoring

Monitor these metrics:

- Checkout session creation rate
- Payment success rate
- Webhook delivery rate
- User plan upgrade rate
- Subscription expiration rate

### Backup and Recovery

1. Regularly backup user subscription data
2. Document recovery procedures
3. Test recovery procedures
4. Set up alerts for failed webhooks

## Future Enhancements

- [ ] Automatic subscription renewal
- [ ] Subscription cancellation endpoint
- [ ] Invoice generation and email
- [ ] Usage-based billing
- [ ] Proration for plan changes
- [ ] Refund handling
- [ ] Tax calculation
- [ ] Multiple payment methods
- [ ] Subscription management portal
- [ ] Analytics dashboard
