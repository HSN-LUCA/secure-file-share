import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/api-auth';
import { generateDomainVerification, verifyCustomDomain } from '@/lib/branding/branding-service';

/**
 * POST /api/branding/domain
 * Generate domain verification token
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
    }

    const verification = await generateDomainVerification(auth.userId, domain);

    return NextResponse.json({
      domain,
      verification_instructions: {
        method: 'DNS TXT Record',
        record_name: verification.dnsRecordName,
        record_value: verification.dnsRecordValue,
        ttl: 3600,
        note: 'Add this DNS record to your domain registrar and wait for propagation (usually 5-30 minutes)',
      },
    });
  } catch (error: any) {
    console.error('Error generating domain verification:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/branding/domain
 * Verify custom domain
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
    }

    const verified = await verifyCustomDomain(auth.userId, domain);

    if (!verified) {
      return NextResponse.json(
        { error: 'Domain verification failed. Please ensure DNS record is properly configured.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      domain,
      message: 'Domain verified successfully',
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
