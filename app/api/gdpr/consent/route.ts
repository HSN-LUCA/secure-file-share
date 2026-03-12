import { NextRequest, NextResponse } from 'next/server';
import { recordUserConsent, getUserConsents, withdrawUserConsent } from '@/lib/gdpr/gdpr-service';
import { verifyAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/gdpr/consent
 * Get user's consent preferences
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consents = await getUserConsents(auth.context.userId);
    return NextResponse.json({ consents });
  } catch (error) {
    console.error('Error fetching consents:', error);
    return NextResponse.json({ error: 'Failed to fetch consents' }, { status: 500 });
  }
}

/**
 * POST /api/gdpr/consent
 * Record user consent
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { consentType, given } = body;

    if (!consentType || typeof given !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    const consent = await recordUserConsent(auth.context.userId, consentType, given, ipAddress || undefined, userAgent || undefined);

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 });
  }
}

/**
 * PUT /api/gdpr/consent
 * Withdraw user consent
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { consentType } = body;

    if (!consentType) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const consent = await withdrawUserConsent(auth.context.userId, consentType);

    return NextResponse.json({ consent });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    return NextResponse.json({ error: 'Failed to withdraw consent' }, { status: 500 });
  }
}
