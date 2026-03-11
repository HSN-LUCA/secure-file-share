import { NextRequest, NextResponse } from 'next/server';
import {
  getUserRetentionPolicies,
  setRetentionPolicy,
  getRetentionStatistics,
  runAllCleanupTasks,
} from '@/lib/retention/retention-service';
import { verifyAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/retention
 * Get retention policies and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const policies = await getUserRetentionPolicies(auth.userId);
    const statistics = await getRetentionStatistics();

    return NextResponse.json({
      policies,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching retention policies:', error);
    return NextResponse.json({ error: 'Failed to fetch retention policies' }, { status: 500 });
  }
}

/**
 * POST /api/retention
 * Set retention policy
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dataType, retentionDays, autoDelete = true } = body;

    if (!['files', 'analytics', 'logs', 'sessions'].includes(dataType)) {
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    if (typeof retentionDays !== 'number' || retentionDays < 1) {
      return NextResponse.json({ error: 'Invalid retention days' }, { status: 400 });
    }

    const policy = await setRetentionPolicy(auth.userId, dataType, retentionDays, autoDelete);

    return NextResponse.json(
      { message: 'Retention policy updated', policy },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error setting retention policy:', error);
    return NextResponse.json({ error: 'Failed to set retention policy' }, { status: 500 });
  }
}
