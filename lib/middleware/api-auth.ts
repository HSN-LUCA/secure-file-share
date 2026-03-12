/**
 * API Key Authentication Middleware
 * Verifies API keys and attaches user context to requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyByHash, updateApiKey } from '@/lib/db/queries';
import { hashApiKey } from '@/lib/api-keys/generator';

export interface ApiAuthContext {
  apiKeyId: string;
  userId: string;
  keyName: string;
}

/**
 * Extract API key from request headers
 * Expects: Authorization: Bearer sk_live_...
 */
function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify API key and return authentication context
 */
export async function verifyApiKey(
  request: NextRequest
): Promise<{ context: ApiAuthContext | null; error: string | null }> {
  try {
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return {
        context: null,
        error: 'Missing API key in Authorization header',
      };
    }

    // Validate API key format
    if (!apiKey.startsWith('sk_live_')) {
      return {
        context: null,
        error: 'Invalid API key format',
      };
    }

    // Hash the API key
    const keyHash = hashApiKey(apiKey);

    // Look up API key in database
    const { data: keyRecord, error: lookupError } = await getApiKeyByHash(keyHash);
    if (lookupError || !keyRecord) {
      return {
        context: null,
        error: 'Invalid API key',
      };
    }

    // Check if key is active
    if (!keyRecord.is_active) {
      return {
        context: null,
        error: 'API key is inactive or revoked',
      };
    }

    // Update last_used_at timestamp
    await updateApiKey(keyRecord.id, {
      last_used_at: new Date().toISOString(),
    });

    return {
      context: {
        apiKeyId: keyRecord.id,
        userId: keyRecord.user_id,
        keyName: keyRecord.name,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error verifying API key:', error);
    return {
      context: null,
      error: 'Failed to verify API key',
    };
  }
}

/**
 * Middleware to require API key authentication
 * Usage: const auth = await requireApiAuth(request);
 */
export async function requireApiAuth(
  request: NextRequest
): Promise<{ context: ApiAuthContext; response: null } | { context: null; response: NextResponse }> {
  const { context, error } = await verifyApiKey(request);

  if (!context) {
    return {
      context: null,
      response: NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return {
    context,
    response: null,
  };
}

/**
 * Alias for requireApiAuth for backward compatibility
 */
export const verifyAuth = requireApiAuth;
