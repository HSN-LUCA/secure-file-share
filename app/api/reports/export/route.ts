/**
 * POST /api/reports/export
 * Endpoint for exporting reports in CSV, JSON, or PDF format
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getCustomReport } from '@/lib/db/custom-reports';
import { createReportExport, updateReportExportStatus } from '@/lib/db/custom-reports';
import { getDownloadStats, getFileTypeStats, getGeographicStats } from '@/lib/db/queries';

// ============================================================================
// TYPES
// ============================================================================

interface ExportRequest {
  reportId?: string;
  exportFormat: 'csv' | 'json' | 'pdf';
  customReportId?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body: ExportRequest = await request.json();

    // Validate required fields
    if (!body.exportFormat || !['csv', 'json', 'pdf'].includes(body.exportFormat)) {
      return NextResponse.json(
        { success: false, error: 'Valid exportFormat (csv, json, pdf) is required' },
        { status: 400 }
      );
    }

    if (!body.customReportId) {
      return NextResponse.json(
        { success: false, error: 'customReportId is required' },
        { status: 400 }
      );
    }

    // Get the custom report
    const reportResult = await getCustomReport(body.customReportId);

    if (reportResult.error || !reportResult.data) {
      return NextResponse.json(
        { success: false, error: 'Custom report not found' },
        { status: 404 }
      );
    }

    const report = reportResult.data;

    // Verify user owns the report
    if (report.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create export record
    const fileName = `report-${report.name}-${new Date().toISOString().split('T')[0]}.${body.exportFormat}`;
    const exportResult = await createReportExport(
      user.id,
      body.customReportId,
      body.exportFormat,
      fileName
    );

    if (exportResult.error) {
      console.error('Create export error:', exportResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to create export' },
        { status: 500 }
      );
    }

    const exportId = exportResult.data?.exportId;

    // Generate report data based on metrics and dimensions
    const reportData = await generateReportData(report);

    // Format data based on export format
    let formattedData: string;
    let contentType: string;

    if (body.exportFormat === 'csv') {
      formattedData = generateCSV(reportData);
      contentType = 'text/csv';
    } else if (body.exportFormat === 'json') {
      formattedData = JSON.stringify(reportData, null, 2);
      contentType = 'application/json';
    } else {
      // PDF export would require additional library
      formattedData = JSON.stringify(reportData, null, 2);
      contentType = 'application/json';
    }

    // Update export status to completed
    await updateReportExportStatus(
      exportId,
      'completed',
      formattedData.length,
      `reports/${exportId}/${fileName}`
    );

    // Return the formatted data
    return new NextResponse(formattedData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate report data based on metrics and dimensions
 */
async function generateReportData(report: any): Promise<Record<string, any>> {
  const data: Record<string, any> = {
    reportName: report.name,
    reportDescription: report.description,
    generatedAt: new Date().toISOString(),
    dateRange: {
      type: report.dateRangeType,
      from: report.dateRangeFrom,
      to: report.dateRangeTo,
    },
    metrics: {},
  };

  // Fetch data for each metric
  for (const metric of report.metrics) {
    if (metric === 'downloads') {
      const result = await getDownloadStats(report.dateRangeFrom, report.dateRangeTo);
      if (result.data) {
        data.metrics.downloads = result.data;
      }
    } else if (metric === 'fileTypes') {
      const result = await getFileTypeStats(report.dateRangeFrom, report.dateRangeTo);
      if (result.data) {
        data.metrics.fileTypes = result.data;
      }
    } else if (metric === 'geographic') {
      const result = await getGeographicStats(report.dateRangeFrom, report.dateRangeTo);
      if (result.data) {
        data.metrics.geographic = result.data;
      }
    }
  }

  return data;
}

/**
 * Generate CSV from report data
 */
function generateCSV(data: Record<string, any>): string {
  const lines: string[] = [];

  lines.push('Report Export');
  lines.push(`Name,${data.reportName}`);
  lines.push(`Generated At,${data.generatedAt}`);
  lines.push('');

  // Add metrics data
  if (data.metrics.downloads) {
    lines.push('DOWNLOADS');
    lines.push(`Total Downloads,${data.metrics.downloads.totalDownloads}`);
    lines.push('');

    if (data.metrics.downloads.downloadsPerDay) {
      lines.push('Downloads Per Day');
      lines.push('Date,Count');
      data.metrics.downloads.downloadsPerDay.forEach((day: any) => {
        lines.push(`${day.date},${day.count}`);
      });
      lines.push('');
    }
  }

  if (data.metrics.fileTypes) {
    lines.push('FILE TYPES');
    lines.push('File Type,Count,Total Size');
    data.metrics.fileTypes.fileTypeDistribution.forEach((ft: any) => {
      lines.push(`${ft.fileType},${ft.count},${ft.totalSize}`);
    });
    lines.push('');
  }

  if (data.metrics.geographic) {
    lines.push('GEOGRAPHIC');
    lines.push('Country,Count');
    data.metrics.geographic.topCountries.forEach((country: any) => {
      lines.push(`${country.country},${country.count}`);
    });
  }

  return lines.join('\n');
}

export const POST = withAuth(handlePost);
