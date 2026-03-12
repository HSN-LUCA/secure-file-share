/**
 * Webhook Detail Endpoint
 * GET /api/api-keys/[keyId]/webhooks/[webhookId] - Get webhook details
 * PATCH /api/api-keys/[keyId]/webhooks/[webhookId] - Update webhook
 * DELETE /api/api-keys/[keyId]/webhooks/[webhookId] - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getApiKey, getApiWebhook, updateApiWebhook, deleteApiWebhook } from '@/lib/db/queries';

/**
 * GET /api/api-keys/[keyId]/webhooks/[webhookId]
 * Get webhook details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string; webhookId: string }> }
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

    const { keyId, webhookId } = await params;

    // Get API key
    const { data: apiKey, error: getError } = await getApiKey(keyId);
    if (getError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (apiKey.user_id !== authResult.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get webhook
    const { data: webhook, error: webhookError } = await getApiWebhook(webhookId);
    if (webhookError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Verify webhook belongs to this API key
    if (webhook.api_key_id !== keyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        event_type: webhook.event_type,
        url: webhook.url,
        is_active: webhook.is_active,
        max_retries: webhook.max_retries,
        retry_count: webhook.retry_count,
        created_at: webhook.created_at,
        updated_at: webhook.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/api-keys/[keyId]/webhooks/[webhookId]
 * Update webhook
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string; webhookId: string }> }
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

    const { keyId, webhookId } = await params;

    // Get API key
    const { data: apiKey, error: getError } = await getApiKey(keyId);
    if (getError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (apiKey.user_id !== authResult.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get webhook
    const { data: webhook, error: webhookError } = await getApiWebhook(webhookId);
    if (webhookError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Verify webhook belongs to this API key
    if (webhook.api_key_id !== keyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { event_type, url, is_active, max_retries } = body;

    const updates: any = {};

    if (event_type !== undefined) {
      if (!['file_uploaded', 'file_downloaded', 'file_expired'].includes(event_type)) {
        return NextResponse.json(
          { error: 'Invalid event_type' },
          { status: 400 }
        );
      }
      updates.event_type = event_type;
    }

    if (url !== undefined) {
      if (typeof url !== 'string') {
        return NextResponse.json(
          { error: 'URL must be a string' },
          { status: 400 }
        );
      }
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
      updates.url = url;
    }

    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return NextResponse.json(
          { error: 'is_active must be a boolean' },
          { status: 400 }
        );
      }
      updates.is_active = is_active;
    }

    if (max_retries !== undefined) {
      if (!Number.isInteger(max_retries) || max_retries < 0 || max_retries > 10) {
        return NextResponse.json(
          { error: 'max_retries must be an integer between 0 and 10' },
          { status: 400 }
        );
      }
      updates.max_retries = max_retries;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Update webhook
    const { data: updatedWebhook, error: updateError } = await updateApiWebhook(webhookId, updates);
    if (updateError || !updatedWebhook) {
      throw updateError || new Error('Failed to update webhook');
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id: updatedWebhook.id,
        event_type: updatedWebhook.event_type,
        url: updatedWebhook.url,
        is_active: updatedWebhook.is_active,
        max_retries: updatedWebhook.max_retries,
        updated_at: updatedWebhook.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-keys/[keyId]/webhooks/[webhookId]
 * Delete webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string; webhookId: string }> }
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

    const { keyId, webhookId } = await params;

    // Get API key
    const { data: apiKey, error: getError } = await getApiKey(keyId);
    if (getError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (apiKey.user_id !== authResult.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get webhook
    const { data: webhook, error: webhookError } = await getApiWebhook(webhookId);
    if (webhookError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Verify webhook belongs to this API key
    if (webhook.api_key_id !== keyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete webhook
    const { error: deleteError } = await deleteApiWebhook(webhookId);
    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
