/**
 * API Key Detail Endpoint
 * GET /api/api-keys/[keyId] - Get API key details
 * PATCH /api/api-keys/[keyId] - Update API key
 * DELETE /api/api-keys/[keyId] - Delete API key
 * POST /api/api-keys/[keyId]/revoke - Revoke API key
 * POST /api/api-keys/[keyId]/regenerate - Regenerate API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import {
  getApiKey,
  updateApiKey,
  deleteApiKey,
  revokeApiKey,
  createApiKey,
  createApiKeyRateLimit,
  getApiKeyRateLimit,
} from '@/lib/db/queries';
import { generateApiKey } from '@/lib/api-keys/generator';

/**
 * GET /api/api-keys/[keyId]
 * Get details for a specific API key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { keyId: string } }
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

    const { keyId } = params;

    // Get API key
    const { data: apiKey, error } = await getApiKey(keyId);
    if (error || !apiKey) {
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

    // Get rate limits
    const { data: rateLimit } = await getApiKeyRateLimit(keyId);

    return NextResponse.json({
      success: true,
      key: {
        id: apiKey.id,
        name: apiKey.name,
        key_prefix: apiKey.key_prefix,
        is_active: apiKey.is_active,
        last_used_at: apiKey.last_used_at,
        created_at: apiKey.created_at,
        revoked_at: apiKey.revoked_at,
      },
      rate_limits: rateLimit || {
        requests_per_minute: 60,
        requests_per_hour: 3600,
        requests_per_day: 86400,
      },
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/api-keys/[keyId]
 * Update API key (name only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { keyId: string } }
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

    const { keyId } = params;

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

    // Parse request body
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'API key name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (name && name.length > 255) {
      return NextResponse.json(
        { error: 'API key name must be less than 255 characters' },
        { status: 400 }
      );
    }

    // Update API key
    const { data: updatedKey, error: updateError } = await updateApiKey(keyId, {
      name: name?.trim(),
    });

    if (updateError || !updatedKey) {
      throw updateError || new Error('Failed to update API key');
    }

    return NextResponse.json({
      success: true,
      key: {
        id: updatedKey.id,
        name: updatedKey.name,
        key_prefix: updatedKey.key_prefix,
        is_active: updatedKey.is_active,
        created_at: updatedKey.created_at,
      },
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-keys/[keyId]
 * Delete API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
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

    const { keyId } = params;

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

    // Delete API key
    const { error: deleteError } = await deleteApiKey(keyId);
    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
