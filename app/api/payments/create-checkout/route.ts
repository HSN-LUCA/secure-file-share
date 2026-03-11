/**
 * POST /api/payments/create-checkout
 * Creates a Stripe checkout session for plan upgrade
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getUserById } from '@/lib/db/queries';
import { stripe, STRIPE_PRODUCTS, STRIPE_CONFIG, getProductByPlan } from '@/lib/stripe/client';
import { createAnalytics } from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface CheckoutRequest {
  plan: 'paid' | 'enterprise';
}

interface CheckoutResponse {
  success: boolean;
  data?: {
    sessionId: string;
    url: string;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

// ============================================================================
// CHECKOUT ENDPOINT
// ============================================================================

async function handler(request: AuthenticatedRequest): Promise<NextResponse<CheckoutResponse>> {
  try {
    // Get authenticated user
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // ========================================================================
    // PARSE REQUEST BODY
    // ========================================================================

    let body: CheckoutRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { plan } = body;

    // ========================================================================
    // VALIDATE PLAN
    // ========================================================================

    if (!plan || (plan !== 'paid' && plan !== 'enterprise')) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan. Must be "paid" or "enterprise"' },
        { status: 400 }
      );
    }

    // ========================================================================
    // GET USER DETAILS
    // ========================================================================

    const userResult = await getUserById(user.userId);

    if (!userResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userResult.data;

    // ========================================================================
    // GET STRIPE PRODUCT INFO
    // ========================================================================

    const product = getProductByPlan(plan);

    if (!product.priceId) {
      console.error(`Missing Stripe price ID for plan: ${plan}`);
      return NextResponse.json(
        { success: false, error: 'Plan configuration error' },
        { status: 500 }
      );
    }

    // ========================================================================
    // CREATE CHECKOUT SESSION
    // ========================================================================

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: userData.email,
        line_items: [
          {
            price: product.priceId,
            quantity: 1,
          },
        ],
        success_url: STRIPE_CONFIG.successUrl,
        cancel_url: STRIPE_CONFIG.cancelUrl,
        metadata: {
          userId: user.userId,
          plan: plan,
          email: userData.email,
        },
      });

      // ====================================================================
      // LOG ANALYTICS
      // ====================================================================

      await createAnalytics({
        event_type: 'security',
        user_id: user.userId,
        ip_address: getClientIp(request),
        metadata: {
          event: 'checkout_initiated',
          plan: plan,
          sessionId: session.id,
        },
      });

      // ====================================================================
      // RETURN SUCCESS RESPONSE
      // ====================================================================

      return NextResponse.json(
        {
          success: true,
          data: {
            sessionId: session.id,
            url: session.url || '',
          },
        },
        { status: 200 }
      );
    } catch (stripeError) {
      console.error('Stripe error creating checkout session:', stripeError);

      // Log error
      await createAnalytics({
        event_type: 'error',
        user_id: user.userId,
        ip_address: getClientIp(request),
        metadata: {
          event: 'checkout_failed',
          plan: plan,
          error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
