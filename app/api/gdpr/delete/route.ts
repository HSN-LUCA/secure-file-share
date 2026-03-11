import { NextRequest, NextResponse } from 'next/server';
import { requestDataDeletion, getUserDataDeletions } from '@/lib/gdpr/gdpr-service';
import { verifyAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/gdpr/delete
 * Get user's data deletion requests
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletions = await getUserDataDeletions(auth.userId);
    return NextResponse.json({ deletions });
  } catch (error) {
    console.error('Error fetching data deletions:', error);
    return NextResponse.json({ error: 'Failed to fetch data deletions' }, { status: 500 });
  }
}

/**
 * POST /api/gdpr/delete
 * Request data deletion
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deletionType = 'account', reason } = body;

    if (!['account', 'files', 'analytics'].includes(deletionType)) {
      return NextResponse.json({ error: 'Invalid deletion type' }, { status: 400 });
    }

    const deletionRequest = await requestDataDeletion(auth.userId, deletionType, reason);

    return NextResponse.json(
      {
        message: 'Data deletion requested. Your data will be deleted in 30 days.',
        deletionRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error requesting data deletion:', error);
    return NextResponse.json({ error: 'Failed to request data deletion' }, { status: 500 });
  }
}
