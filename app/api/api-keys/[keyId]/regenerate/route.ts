/**
 * Regenerate API Key Endpoint
 * POST /api/api-keys/[keyId]/regenerate - Regenerate an API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getApiKey, updateApiKey } from '@/lib/db/queries';
import { generateApiKey } from '@/lib/api-keys/generator';

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

    // Generate new API key
    const { key, prefix, hash } = generateApiKey();

    // Update API key with new hash and prefix
    const { data: regeneratedKey, error: updateError } = await updateApiKey(keyId, {
      key_hash: hash,
      key_prefix: prefix,
    });

    if (updateError || !regeneratedKey) {
      throw updateError || new Error('Failed to regenerate API key');
    }

    return NextResponse.json({
      success: true,
      key: {
        id: regeneratedKey.id,
        name: regeneratedKey.name,
        key: key, // Full key - only shown once
        key_prefix: regeneratedKey.key_prefix,
        created_at: regeneratedKey.created_at,
      },
      message: 'API key regenerated successfully. Save your new key in a secure location.',
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    );
  }
}
