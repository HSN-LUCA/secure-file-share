import { NextRequest, NextResponse } from 'next/server';
import { requestDataExport, getUserDataExports } from '@/lib/gdpr/gdpr-service';
import { verifyAuth } from '@/lib/middleware/api-auth';

/**
 * GET /api/gdpr/export
 * Get user's data export requests
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exports = await getUserDataExports(auth.userId);
    return NextResponse.json({ exports });
  } catch (error) {
    console.error('Error fetching data exports:', error);
    return NextResponse.json({ error: 'Failed to fetch data exports' }, { status: 500 });
  }
}

/**
 * POST /api/gdpr/export
 * Request data export
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exportFormat = 'json' } = body;

    if (!['json', 'csv'].includes(exportFormat)) {
      return NextResponse.json({ error: 'Invalid export format' }, { status: 400 });
    }

    const exportRequest = await requestDataExport(auth.userId, exportFormat);

    return NextResponse.json(
      { message: 'Data export requested', exportRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error requesting data export:', error);
    return NextResponse.json({ error: 'Failed to request data export' }, { status: 500 });
  }
}
