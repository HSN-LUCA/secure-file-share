/**
 * API Key Rate Limits Management Endpoint
 * GET /api/api-keys/[keyId]/rate-limits - Get rate limits
 * PATCH /api/api-keys/[keyId]/rate-limits - Update rate limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import {
  getApiKey,
  getApiKeyRateLimit,
  updateApiKeyRateLimit,
  createApiKeyRateLimit,
} from '@/lib/db/queries';

/**
 * GET /api/api-keys/[keyId]/rate-limits
 * Get rate limit configuration for an API key
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
    if (apiKey.user_id !== authResult.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get rate limits
    const { data: rateLimit, error: rateLimitError } = await getApiKeyRateLimit(keyId);
    if (rateLimitError) {
      throw rateLimitError;
    }

    return NextResponse.json({
      success: true,
      rate_limits: rateLimit || {
        requests_per_minute: 60,
        requests_per_hour: 3600,
        requests_per_day: 86400,
      },
    });
  } catch (error) {
    console.error('Error fetching rate limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limits' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/api-keys/[keyId]/rate-limits
 * Update rate limit configuration for an API key
 */
export async function PATCH(
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
    if (apiKey.user_id !== authResult.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { requests_per_minute, requests_per_hour, requests_per_day } = body;

    // Validate inputs
    const updates: any = {};

    if (requests_per_minute !== undefined) {
      if (!Number.isInteger(requests_per_minute) || requests_per_minute < 1) {
        return NextResponse.json(
          { error: 'requests_per_minute must be a positive integer' },
          { status: 400 }
        );
      }
      updates.requests_per_minute = requests_per_minute;
    }

    if (requests_per_hour !== undefined) {
      if (!Number.isInteger(requests_per_hour) || requests_per_hour < 1) {
        return NextResponse.json(
          { error: 'requests_per_hour must be a positive integer' },
          { status: 400 }
        );
      }
      updates.requests_per_hour = requests_per_hour;
    }

    if (requests_per_day !== undefined) {
      if (!Number.isInteger(requests_per_day) || requests_per_day < 1) {
        return NextResponse.json(
          { error: 'requests_per_day must be a positive integer' },
          { status: 400 }
        );
      }
      updates.requests_per_day = requests_per_day;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Check if rate limits exist
    const { data: existingRateLimit } = await getApiKeyRateLimit(keyId);

    let updatedRateLimit;
    if (existingRateLimit) {
      // Update existing rate limits
      const { data, error } = await updateApiKeyRateLimit(keyId, updates);
      if (error || !data) {
        throw error || new Error('Failed to update rate limits');
      }
      updatedRateLimit = data;
    } else {
      // Create new rate limits
      const { data, error } = await createApiKeyRateLimit({
        api_key_id: keyId,
        ...updates,
      });
      if (error || !data) {
        throw error || new Error('Failed to create rate limits');
      }
      updatedRateLimit = data;
    }

    return NextResponse.json({
      success: true,
      rate_limits: {
        requests_per_minute: updatedRateLimit.requests_per_minute,
        requests_per_hour: updatedRateLimit.requests_per_hour,
        requests_per_day: updatedRateLimit.requests_per_day,
      },
    });
  } catch (error) {
    console.error('Error updating rate limits:', error);
    return NextResponse.json(
      { error: 'Failed to update rate limits' },
      { status: 500 }
    );
  }
}
