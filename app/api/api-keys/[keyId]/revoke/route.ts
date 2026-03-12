/**
 * Revoke API Key Endpoint
 * POST /api/api-keys/[keyId]/revoke - Revoke an API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getApiKey, revokeApiKey } from '@/lib/db/queries';

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

    // Revoke API key
    const { data: revokedKey, error: revokeError } = await revokeApiKey(keyId);
    if (revokeError || !revokedKey) {
      throw revokeError || new Error('Failed to revoke API key');
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
      key: {
        id: revokedKey.id,
        name: revokedKey.name,
        is_active: revokedKey.is_active,
        revoked_at: revokedKey.revoked_at,
      },
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
