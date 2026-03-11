/**
 * POST /api/jobs/scheduled-reports
 * Cron job endpoint for processing scheduled reports
 * Should be called by a cron service (e.g., Vercel Cron, AWS EventBridge)
 * Requires authorization token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduledReportsDue, updateScheduledReportSentTime } from '@/lib/db/custom-reports';
import { getCustomReport } from '@/lib/db/custom-reports';
import { getDownloadStats, getFileTypeStats, getGeographicStats } from '@/lib/db/queries';

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Processing scheduled reports...');

    // Get scheduled reports due for sending
    const result = await getScheduledReportsDue();

    if (result.error) {
      console.error('Error fetching scheduled reports due:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scheduled reports' },
        { status: 500 }
      );
    }

    const reportsDue = result.data || [];
    console.log(`Found ${reportsDue.length} scheduled reports due for sending`);

    let processed = 0;
    let failed = 0;

    // Process each report
    for (const report of reportsDue) {
      try {
        // Get custom report if specified
        let reportConfig = null;
        if (report.customReportId) {
          const configResult = await getCustomReport(report.customReportId);
          if (configResult.data) {
            reportConfig = configResult.data;
          }
        }

        // Generate report data
        const reportData = await generateReportData(reportConfig);

        // Format report for email
        const emailContent = formatReportForEmail(
          report.name,
          reportData,
          report.includeCharts,
          report.includeSummary
        );

        // Send emails to recipients
        for (const email of report.recipientEmails) {
          try {
            await sendReportEmail(email, report.name, emailContent);
          } catch (error) {
            console.error(`Failed to send report email to ${email}:`, error);
            failed++;
          }
        }

        // Update scheduled report sent time
        await updateScheduledReportSentTime(report.id);
        processed++;
      } catch (error) {
        console.error(`Error processing scheduled report ${report.id}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        failed,
        total: reportsDue.length,
      },
    });
  } catch (error) {
    console.error('Scheduled reports job error:', error);
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
 * Generate report data
 */
async function generateReportData(reportConfig: any): Promise<Record<string, any>> {
  const data: Record<string, any> = {
    generatedAt: new Date().toISOString(),
    metrics: {},
  };

  try {
    // Fetch download statistics
    const downloadsResult = await getDownloadStats();
    if (downloadsResult.data) {
      data.metrics.downloads = downloadsResult.data;
    }

    // Fetch file type statistics
    const fileTypesResult = await getFileTypeStats();
    if (fileTypesResult.data) {
      data.metrics.fileTypes = fileTypesResult.data;
    }

    // Fetch geographic statistics
    const geographicResult = await getGeographicStats();
    if (geographicResult.data) {
      data.metrics.geographic = geographicResult.data;
    }
  } catch (error) {
    console.error('Error generating report data:', error);
  }

  return data;
}

/**
 * Format report for email
 */
function formatReportForEmail(
  reportName: string,
  reportData: Record<string, any>,
  includeCharts: boolean,
  includeSummary: boolean
): string {
  let html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          h1 { color: #3b82f6; }
          h2 { color: #1e40af; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f3f4f6; }
          .metric { margin: 15px 0; }
          .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        </style>
      </head>
      <body>
        <h1>${reportName}</h1>
        <p>Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>
  `;

  if (includeSummary && reportData.metrics) {
    html += '<h2>Summary</h2>';

    if (reportData.metrics.downloads) {
      html += `
        <div class="metric">
          <strong>Total Downloads:</strong>
          <div class="metric-value">${reportData.metrics.downloads.totalDownloads}</div>
        </div>
      `;
    }

    if (reportData.metrics.fileTypes) {
      html += `
        <div class="metric">
          <strong>Total Uploads:</strong>
          <div class="metric-value">${reportData.metrics.fileTypes.totalUploads}</div>
        </div>
      `;
    }
  }

  if (reportData.metrics.downloads && reportData.metrics.downloads.mostDownloadedFiles) {
    html += '<h2>Most Downloaded Files</h2>';
    html += '<table>';
    html += '<tr><th>File Name</th><th>Downloads</th></tr>';

    reportData.metrics.downloads.mostDownloadedFiles.slice(0, 10).forEach((file: any) => {
      html += `<tr><td>${file.fileName}</td><td>${file.count}</td></tr>`;
    });

    html += '</table>';
  }

  if (reportData.metrics.fileTypes && reportData.metrics.fileTypes.fileTypeDistribution) {
    html += '<h2>File Type Distribution</h2>';
    html += '<table>';
    html += '<tr><th>File Type</th><th>Count</th><th>Total Size</th></tr>';

    reportData.metrics.fileTypes.fileTypeDistribution.slice(0, 10).forEach((ft: any) => {
      html += `<tr><td>${ft.fileType}</td><td>${ft.count}</td><td>${formatBytes(ft.totalSize)}</td></tr>`;
    });

    html += '</table>';
  }

  if (reportData.metrics.geographic && reportData.metrics.geographic.topCountries) {
    html += '<h2>Top Countries</h2>';
    html += '<table>';
    html += '<tr><th>Country</th><th>Downloads</th></tr>';

    reportData.metrics.geographic.topCountries.slice(0, 10).forEach((country: any) => {
      html += `<tr><td>${country.country}</td><td>${country.count}</td></tr>`;
    });

    html += '</table>';
  }

  html += `
      </body>
    </html>
  `;

  return html;
}

/**
 * Send report email
 */
async function sendReportEmail(
  recipientEmail: string,
  reportName: string,
  emailContent: string
): Promise<void> {
  // This would integrate with an email service like SendGrid, AWS SES, etc.
  // For now, we'll just log it
  console.log(`Sending report email to ${recipientEmail}: ${reportName}`);

  // TODO: Implement actual email sending
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: recipientEmail,
  //   from: process.env.SENDER_EMAIL,
  //   subject: `Report: ${reportName}`,
  //   html: emailContent,
  // });
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
