import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/api-auth';
import { toggleWhiteLabel, getBrandingConfig } from '@/lib/branding/branding-service';

/**
 * POST /api/branding/white-label
 * Enable or disable white-label mode
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled parameter' }, { status: 400 });
    }

    const config = await toggleWhiteLabel(auth.context.userId, enabled);

    return NextResponse.json({
      success: true,
      white_label_enabled: config.white_label_enabled,
      message: enabled ? 'White-label mode enabled' : 'White-label mode disabled',
    });
  } catch (error) {
    console.error('Error toggling white-label:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/branding/white-label
 * Get white-label configuration
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

    return NextResponse.json({
      white_label_enabled: config.white_label_enabled,
      logo_url: config.logo_url,
      primary_color: config.primary_color,
      secondary_color: config.secondary_color,
      accent_color: config.accent_color,
      custom_domain: config.custom_domain,
      domain_verified: config.domain_verified,
      company_name: config.company_name,
      company_description: config.company_description,
      support_email: config.support_email,
      support_phone: config.support_phone,
    });
  } catch (error) {
    console.error('Error fetching white-label config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
