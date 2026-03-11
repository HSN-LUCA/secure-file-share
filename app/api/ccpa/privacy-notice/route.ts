import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeCcpaNotice, getUserCcpaNoticeStatus } from '@/lib/ccpa/ccpa-service';
import { verifyAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/ccpa/privacy-notice
 * Get user's CCPA privacy notice status
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const noticeStatus = await getUserCcpaNoticeStatus(auth.userId);

    return NextResponse.json({
      noticeStatus,
      currentVersion: '1.0',
    });
  } catch (error) {
    console.error('Error fetching privacy notice status:', error);
    return NextResponse.json({ error: 'Failed to fetch privacy notice status' }, { status: 500 });
  }
}

/**
 * POST /api/ccpa/privacy-notice
 * Acknowledge CCPA privacy notice
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { noticeVersion = '1.0' } = body;

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    await acknowledgeCcpaNotice(auth.userId, noticeVersion, ipAddress || undefined, userAgent || undefined);

    return NextResponse.json(
      { message: 'CCPA privacy notice acknowledged' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error acknowledging privacy notice:', error);
    return NextResponse.json({ error: 'Failed to acknowledge privacy notice' }, { status: 500 });
  }
}
