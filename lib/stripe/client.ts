/**
 * Stripe Client Configuration
 * Initializes Stripe SDK with API keys from environment variables
 */

import Stripe from 'stripe';

// ============================================================================
// STRIPE CLIENT INITIALIZATION
// ============================================================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_testing';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

// ============================================================================
// STRIPE PRODUCT AND PRICE IDS
// ============================================================================

export const STRIPE_PRODUCTS = {
  PRO: {
    productId: process.env.STRIPE_PRO_PRODUCT_ID || '',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    name: 'Pro',
    plan: 'paid' as const,
  },
  ENTERPRISE: {
    productId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID || '',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    name: 'Enterprise',
    plan: 'enterprise' as const,
  },
};

// ============================================================================
// STRIPE CONFIGURATION
// ============================================================================

export const STRIPE_CONFIG = {
  // Webhook endpoint secret for verifying webhook signatures
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Success and cancel URLs for checkout
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?payment=cancelled`,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get product info by plan type
 */
export function getProductByPlan(plan: 'paid' | 'enterprise') {
  if (plan === 'paid') {
    return STRIPE_PRODUCTS.PRO;
  }
  return STRIPE_PRODUCTS.ENTERPRISE;
}

/**
 * Validate that all required Stripe configuration is set
 */
export function validateStripeConfig(): boolean {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PRO_PRODUCT_ID',
    'STRIPE_PRO_PRICE_ID',
    'STRIPE_ENTERPRISE_PRODUCT_ID',
    'STRIPE_ENTERPRISE_PRICE_ID',
    'STRIPE_WEBHOOK_SECRET',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      console.warn(`Missing Stripe configuration: ${key}`);
      return false;
    }
  }

  return true;
}
