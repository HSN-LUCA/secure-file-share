import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/api-auth';
import { getBrandingConfig, upsertBrandingConfig } from '@/lib/branding/branding-service';

/**
 * GET /api/branding
 * Retrieve branding configuration for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getBrandingConfig(auth.context.userId);

    if (!config) {
      return NextResponse.json({ error: 'Branding config not found' }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching branding config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/branding
 * Create or update branding configuration
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_name, company_description, support_email, support_phone } = body;

    // Validate input
    if (company_name && typeof company_name !== 'string') {
      return NextResponse.json({ error: 'Invalid company_name' }, { status: 400 });
    }

    if (support_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support_email)) {
      return NextResponse.json({ error: 'Invalid support_email' }, { status: 400 });
    }

    const config = await upsertBrandingConfig(auth.context.userId, {
      company_name,
      company_description,
      support_email,
      support_phone,
    } as any);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating branding config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
