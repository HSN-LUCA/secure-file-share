import { NextRequest, NextResponse } from 'next/server';
import { acceptDataProcessingAgreement, getUserDpaStatus } from '@/lib/gdpr/gdpr-service';
import { verifyAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/gdpr/dpa
 * Get user's DPA acceptance status
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dpaStatus = await getUserDpaStatus(auth.context.userId);

    return NextResponse.json({
      dpaStatus,
      currentVersion: '1.0',
    });
  } catch (error) {
    console.error('Error fetching DPA status:', error);
    return NextResponse.json({ error: 'Failed to fetch DPA status' }, { status: 500 });
  }
}

/**
 * POST /api/gdpr/dpa
 * Accept Data Processing Agreement
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dpaVersion = '1.0' } = body;

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    await acceptDataProcessingAgreement(auth.context.userId, dpaVersion, ipAddress || undefined, userAgent || undefined);

    return NextResponse.json(
      { message: 'Data Processing Agreement accepted' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error accepting DPA:', error);
    return NextResponse.json({ error: 'Failed to accept DPA' }, { status: 500 });
  }
}
