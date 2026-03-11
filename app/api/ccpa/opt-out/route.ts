import { NextRequest, NextResponse } from 'next/server';
import { recordUserOptOut, getUserOptOuts, optInUser } from '@/lib/ccpa/ccpa-service';
import { verifyAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/ccpa/opt-out
 * Get user's opt-out preferences
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const optOuts = await getUserOptOuts(auth.userId);
    return NextResponse.json({ optOuts });
  } catch (error) {
    console.error('Error fetching opt-outs:', error);
    return NextResponse.json({ error: 'Failed to fetch opt-outs' }, { status: 500 });
  }
}

/**
 * POST /api/ccpa/opt-out
 * Record user opt-out
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { optOutType } = body;

    if (!['sale', 'sharing', 'targeted_advertising', 'profiling'].includes(optOutType)) {
      return NextResponse.json({ error: 'Invalid opt-out type' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    const optOut = await recordUserOptOut(auth.userId, optOutType, ipAddress || undefined, userAgent || undefined);

    return NextResponse.json(
      { message: 'Opt-out recorded successfully', optOut },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording opt-out:', error);
    return NextResponse.json({ error: 'Failed to record opt-out' }, { status: 500 });
  }
}

/**
 * PUT /api/ccpa/opt-out
 * Opt in user (withdraw opt-out)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { optOutType } = body;

    if (!['sale', 'sharing', 'targeted_advertising', 'profiling'].includes(optOutType)) {
      return NextResponse.json({ error: 'Invalid opt-out type' }, { status: 400 });
    }

    const optOut = await optInUser(auth.userId, optOutType);

    return NextResponse.json({ message: 'Opted in successfully', optOut });
  } catch (error) {
    console.error('Error opting in:', error);
    return NextResponse.json({ error: 'Failed to opt in' }, { status: 500 });
  }
}
