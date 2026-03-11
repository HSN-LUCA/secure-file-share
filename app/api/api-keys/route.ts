/**
 * API Keys Management Endpoint
 * POST /api/api-keys - Create new API key
 * GET /api/api-keys - List user's API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import {
  createApiKey,
  getUserApiKeys,
  createApiKeyRateLimit,
} from '@/lib/db/queries';
import { generateApiKey } from '@/lib/api-keys/generator';
import { recordApiUsage } from '@/lib/db/queries';

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's API keys
    const { data: keys, error } = await getUserApiKeys(authResult.user.id);
    if (error) {
      throw error;
    }

    // Remove sensitive data from response
    const safeKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      key_prefix: key.key_prefix,
      is_active: key.is_active,
      last_used_at: key.last_used_at,
      created_at: key.created_at,
      revoked_at: key.revoked_at,
    }));

    return NextResponse.json({
      success: true,
      keys: safeKeys,
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys
 * Create a new API key for the authenticated user
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: 'API key name must be less than 255 characters' },
        { status: 400 }
      );
    }

    // Generate new API key
    const { key, prefix, hash } = generateApiKey();

    // Create API key in database
    const { data: apiKey, error: createError } = await createApiKey({
      user_id: authResult.user.id,
      name: name.trim(),
      key_hash: hash,
      key_prefix: prefix,
      is_active: true,
    });

    if (createError || !apiKey) {
      throw createError || new Error('Failed to create API key');
    }

    // Create default rate limits for the key
    const { error: rateLimitError } = await createApiKeyRateLimit({
      api_key_id: apiKey.id,
      requests_per_minute: 60,
      requests_per_hour: 3600,
      requests_per_day: 86400,
    });

    if (rateLimitError) {
      console.error('Error creating rate limits:', rateLimitError);
      // Continue anyway - rate limits can be created later
    }

    // Return the key (only shown once)
    return NextResponse.json({
      success: true,
      key: {
        id: apiKey.id,
        name: apiKey.name,
        key: key, // Full key - only shown once
        key_prefix: apiKey.key_prefix,
        created_at: apiKey.created_at,
      },
      message: 'Save your API key in a secure location. You will not be able to see it again.',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
