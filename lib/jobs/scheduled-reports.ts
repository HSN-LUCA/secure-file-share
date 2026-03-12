/**
 * Scheduled Reports Job Processor
 * Processes scheduled report generation and email delivery
 * Stub implementation - Bull queues require Redis and are not suitable for Vercel's serverless environment
 */

import { getScheduledReportsDue, updateScheduledReportSentTime } from '@/lib/db/custom-reports';
import { getCustomReport } from '@/lib/db/custom-reports';
import { getDownloadStats, getFileTypeStats, getGeographicStats } from '@/lib/db/queries';

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduledReportJobData {
  reportId: string;
  userId: string;
  customReportId: string | null;
  name: string;
  recipientEmails: string[];
  includeCharts: boolean;
  includeSummary: boolean;
}

export interface ScheduledReportJobResult {
  success: boolean;
  reportId: string;
  emailsSent: number;
  error?: string;
}

// ============================================================================
// JOB PROCESSOR
// ============================================================================

/**
 * Process scheduled report job
 */
export async function processScheduledReportJob(job: any): Promise<ScheduledReportJobResult> {
  const { reportId, userId, customReportId, name, recipientEmails, includeCharts, includeSummary } =
    job.data || {};

  try {
    console.log(`Processing scheduled report: ${reportId}`);

    // Get custom report if specified
    let reportConfig = null;
    if (customReportId) {
      const result = await getCustomReport(customReportId);
      if (result.data) {
        reportConfig = result.data;
      }
    }

    // Generate report data
    const reportData = await generateScheduledReportData(reportConfig);

    // Format report for email
    const emailContent = formatReportForEmail(name, reportData, includeCharts, includeSummary);

    // Send emails to recipients
    let emailsSent = 0;
    for (const email of recipientEmails) {
      try {
        await sendReportEmail(email, name, emailContent);
        emailsSent++;
      } catch (error) {
        console.error(`Failed to send report email to ${email}:`, error);
      }
    }

    // Update scheduled report sent time
    await updateScheduledReportSentTime(reportId);

    return {
      success: true,
      reportId,
      emailsSent,
    };
  } catch (error) {
    console.error(`Error processing scheduled report ${reportId}:`, error);
    return {
      success: false,
      reportId,
      emailsSent: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create scheduled reports queue
 * Stub implementation - Bull queues require Redis and are not suitable for Vercel's serverless environment
 */
export function createScheduledReportsQueue(redisUrl: string): any {
  // Stub implementation - returns a mock queue object
  return {
    process: () => {},
    on: () => {},
    add: async () => ({ id: 'stub' }),
    close: async () => {},
  };
}

/**
 * Trigger scheduled reports processing
 */
export async function triggerScheduledReportsProcessing(): Promise<number> {
  try {
    const result = await getScheduledReportsDue();

    if (result.error) {
      console.error('Error fetching scheduled reports due:', result.error);
      return 0;
    }

    const reportsDue = result.data || [];
    console.log(`Found ${reportsDue.length} scheduled reports due for sending`);

    // Queue each report for processing
    let queued = 0;
    for (const report of reportsDue) {
      try {
        // This would be called from the job initialization
        // For now, we just log that we found reports to process
        queued++;
      } catch (error) {
        console.error(`Error queuing report ${report.id}:`, error);
      }
    }

    return queued;
  } catch (error) {
    console.error('Error triggering scheduled reports processing:', error);
    return 0;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate report data for scheduled report
 */
async function generateScheduledReportData(reportConfig: any): Promise<Record<string, any>> {
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
