import { NextRequest, NextResponse } from 'next/server';
import {
  requestCcpaDisclosure,
  getUserCcpaRequests,
  verifyCcpaRequest,
  completeCcpaRequest,
  generateCcpaDisclosureReport,
} from '@/lib/ccpa/ccpa-service';
import { verifyAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/ccpa/disclosure
 * Get user's CCPA disclosure requests
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await getUserCcpaRequests(auth.context.userId);
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching CCPA requests:', error);
    return NextResponse.json({ error: 'Failed to fetch CCPA requests' }, { status: 500 });
  }
}

/**
 * POST /api/ccpa/disclosure
 * Request CCPA disclosure (access, deletion, or opt-out)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestType = 'access', verificationMethod = 'email' } = body;

    if (!['access', 'deletion', 'opt_out'].includes(requestType)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    if (!['email', 'phone', 'in_person'].includes(verificationMethod)) {
      return NextResponse.json({ error: 'Invalid verification method' }, { status: 400 });
    }

    const disclosureRequest = await requestCcpaDisclosure(auth.context.userId, requestType, verificationMethod);

    return NextResponse.json(
      {
        message: 'CCPA disclosure request submitted. Please verify your identity.',
        disclosureRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error requesting CCPA disclosure:', error);
    return NextResponse.json({ error: 'Failed to request CCPA disclosure' }, { status: 500 });
  }
}
