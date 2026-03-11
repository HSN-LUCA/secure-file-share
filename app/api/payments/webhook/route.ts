/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint for handling payment events
 * Verifies webhook signature and processes payment events
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/client';
import { getUserByEmail, updateUser, createAnalytics } from '@/lib/db/queries';
import Stripe from 'stripe';

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

/**
 * Verify Stripe webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): Stripe.Event | null {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    // Extract metadata
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as 'paid' | 'enterprise' | undefined;
    const email = session.metadata?.email;

    if (!userId || !plan || !email) {
      console.error('Missing metadata in checkout session:', {
        userId,
        plan,
        email,
      });
      return;
    }

    // ========================================================================
    // GET USER
    // ========================================================================

    const userResult = await getUserByEmail(email);

    if (!userResult.data) {
      console.error('User not found for email:', email);
      return;
    }

    const user = userResult.data;

    // ========================================================================
    // UPDATE USER PLAN
    // ========================================================================

    // Calculate subscription expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updateResult = await updateUser(user.id, {
      plan: plan,
      subscription_expires_at: expiresAt.toISOString(),
    });

    if (updateResult.error) {
      console.error('Failed to update user plan:', updateResult.error);
      return;
    }

    // ========================================================================
    // LOG ANALYTICS
    // ========================================================================

    await createAnalytics({
      event_type: 'security',
      user_id: user.id,
      metadata: {
        event: 'payment_success',
        plan: plan,
        sessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
      },
    });

    console.log(`Payment successful for user ${user.id}, plan upgraded to ${plan}`);
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

/**
 * Handle charge.failed event
 */
async function handleChargeFailed(charge: Stripe.Charge) {
  try {
    const email = charge.billing_details?.email;

    if (!email) {
      console.error('No email in failed charge');
      return;
    }

    // Get user
    const userResult = await getUserByEmail(email);

    if (!userResult.data) {
      console.error('User not found for email:', email);
      return;
    }

    const user = userResult.data;

    // Log analytics
    await createAnalytics({
      event_type: 'error',
      user_id: user.id,
      metadata: {
        event: 'payment_failed',
        chargeId: charge.id,
        failureCode: charge.failure_code,
        failureMessage: charge.failure_message,
      },
    });

    console.log(`Payment failed for user ${user.id}: ${charge.failure_message}`);
  } catch (error) {
    console.error('Error handling charge.failed:', error);
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const email = subscription.metadata?.email;

    if (!email) {
      console.error('No email in subscription');
      return;
    }

    // Get user
    const userResult = await getUserByEmail(email);

    if (!userResult.data) {
      console.error('User not found for email:', email);
      return;
    }

    const user = userResult.data;

    // Downgrade user to free plan
    const updateResult = await updateUser(user.id, {
      plan: 'free',
      subscription_expires_at: null,
    });

    if (updateResult.error) {
      console.error('Failed to downgrade user:', updateResult.error);
      return;
    }

    // Log analytics
    await createAnalytics({
      event_type: 'security',
      user_id: user.id,
      metadata: {
        event: 'subscription_cancelled',
        subscriptionId: subscription.id,
      },
    });

    console.log(`Subscription cancelled for user ${user.id}, downgraded to free plan`);
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
  }
}

// ============================================================================
// WEBHOOK ENDPOINT
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ========================================================================
    // GET REQUEST BODY AND SIGNATURE
    // ========================================================================

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // ========================================================================
    // VERIFY WEBHOOK SIGNATURE
    // ========================================================================

    const event = verifyWebhookSignature(body, signature);

    if (!event) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // ========================================================================
    // HANDLE EVENTS
    // ========================================================================

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // ========================================================================
    // RETURN SUCCESS
    // ========================================================================

    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
