/**
 * API Webhooks Management Endpoint
 * GET /api/api-keys/[keyId]/webhooks - List webhooks
 * POST /api/api-keys/[keyId]/webhooks - Create webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getApiKey, getApiKeyWebhooks, createApiWebhook } from '@/lib/db/queries';
import crypto from 'crypto';

/**
 * GET /api/api-keys/[keyId]/webhooks
 * List all webhooks for an API key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { keyId } = await params;

    // Get API key
    const { data: apiKey, error: getError } = await getApiKey(keyId);
    if (getError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (apiKey.user_id !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get webhooks
    const { data: webhooks, error: webhooksError } = await getApiKeyWebhooks(keyId);
    if (webhooksError) {
      throw webhooksError;
    }

    // Remove sensitive data
    const safeWebhooks = webhooks.map((webhook) => ({
      id: webhook.id,
      event_type: webhook.event_type,
      url: webhook.url,
      is_active: webhook.is_active,
      max_retries: webhook.max_retries,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    }));

    return NextResponse.json({
      success: true,
      webhooks: safeWebhooks,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys/[keyId]/webhooks
 * Create a new webhook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { keyId } = await params;

    // Get API key
    const { data: apiKey, error: getError } = await getApiKey(keyId);
    if (getError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (apiKey.user_id !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { event_type, url, max_retries } = body;

    // Validate inputs
    if (!event_type || !['file_uploaded', 'file_downloaded', 'file_expired'].includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event_type. Must be one of: file_uploaded, file_downloaded, file_expired' },
        { status: 400 }
      );
    }

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    if (url.length > 500) {
      return NextResponse.json(
        { error: 'URL must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Validate max_retries
    const retries = max_retries || 3;
    if (!Number.isInteger(retries) || retries < 0 || retries > 10) {
      return NextResponse.json(
        { error: 'max_retries must be an integer between 0 and 10' },
        { status: 400 }
      );
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook
    const { data: webhook, error: createError } = await createApiWebhook({
      api_key_id: keyId,
      event_type: event_type as 'file_uploaded' | 'file_downloaded' | 'file_expired',
      url,
      secret,
      max_retries: retries,
      is_active: true,
    });

    if (createError || !webhook) {
      throw createError || new Error('Failed to create webhook');
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        event_type: webhook.event_type,
        url: webhook.url,
        is_active: webhook.is_active,
        max_retries: webhook.max_retries,
        secret: secret, // Only shown once
        created_at: webhook.created_at,
      },
      message: 'Save your webhook secret in a secure location. You will not be able to see it again.',
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
