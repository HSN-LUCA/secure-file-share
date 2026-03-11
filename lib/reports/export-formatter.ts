/**
 * Report Export Formatter
 * Handles formatting of report data for CSV and JSON export
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ExportData {
  reportName: string;
  reportDescription?: string;
  generatedAt: string;
  dateRange?: {
    type: string;
    from?: string;
    to?: string;
  };
  metrics: Record<string, any>;
  dimensions?: Record<string, any>;
  aggregations?: Record<string, any>;
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Format report data as CSV
 */
export function formatAsCSV(data: ExportData): string {
  const lines: string[] = [];

  // Header
  lines.push('Report Export');
  lines.push(`Name,${escapeCSV(data.reportName)}`);
  if (data.reportDescription) {
    lines.push(`Description,${escapeCSV(data.reportDescription)}`);
  }
  lines.push(`Generated At,${data.generatedAt}`);
  lines.push('');

  // Date Range
  if (data.dateRange) {
    lines.push('Date Range');
    lines.push(`Type,${data.dateRange.type}`);
    if (data.dateRange.from) lines.push(`From,${data.dateRange.from}`);
    if (data.dateRange.to) lines.push(`To,${data.dateRange.to}`);
    lines.push('');
  }

  // Metrics
  if (data.metrics) {
    lines.push('METRICS');
    lines.push('');

    // Downloads
    if (data.metrics.downloads) {
      lines.push('Downloads');
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

      if (data.metrics.downloads.mostDownloadedFiles) {
        lines.push('Most Downloaded Files');
        lines.push('File Name,Downloads');
        data.metrics.downloads.mostDownloadedFiles.forEach((file: any) => {
          lines.push(`${escapeCSV(file.fileName)},${file.count}`);
        });
        lines.push('');
      }
    }

    // File Types
    if (data.metrics.fileTypes) {
      lines.push('File Types');
      lines.push(`Total Uploads,${data.metrics.fileTypes.totalUploads}`);
      lines.push('');

      if (data.metrics.fileTypes.fileTypeDistribution) {
        lines.push('File Type Distribution');
        lines.push('File Type,Count,Total Size (bytes)');
        data.metrics.fileTypes.fileTypeDistribution.forEach((ft: any) => {
          lines.push(`${ft.fileType},${ft.count},${ft.totalSize}`);
        });
        lines.push('');
      }
    }

    // Geographic
    if (data.metrics.geographic) {
      lines.push('Geographic');
      lines.push(`Total Countries,${data.metrics.geographic.totalCountries}`);
      lines.push('');

      if (data.metrics.geographic.topCountries) {
        lines.push('Top Countries');
        lines.push('Country,Downloads');
        data.metrics.geographic.topCountries.forEach((country: any) => {
          lines.push(`${country.country},${country.count}`);
        });
        lines.push('');
      }
    }

    // Bot Detection
    if (data.metrics.botDetection) {
      lines.push('Bot Detection');
      lines.push(`CAPTCHA Attempts,${data.metrics.botDetection.captchaAttempts}`);
      lines.push(`CAPTCHA Successes,${data.metrics.botDetection.captchaSuccesses}`);
      lines.push(`CAPTCHA Failures,${data.metrics.botDetection.captchaFailures}`);
      lines.push(`Success Rate,${data.metrics.botDetection.successRate.toFixed(2)}%`);
      lines.push(`Blocked IPs,${data.metrics.botDetection.blockedIps}`);
      lines.push(`Bot Detected Events,${data.metrics.botDetection.botDetectedEvents}`);
      lines.push('');
    }

    // Flows
    if (data.metrics.flows) {
      lines.push('User Flows');
      lines.push('Flow Name,Total Flows,Completed Flows,Completion Rate');
      data.metrics.flows.forEach((flow: any) => {
        lines.push(
          `${flow.flowName},${flow.totalFlows},${flow.completedFlows},${flow.completionRate.toFixed(2)}%`
        );
      });
      lines.push('');
    }
  }

  // Dimensions
  if (data.dimensions) {
    lines.push('DIMENSIONS');
    lines.push('');

    if (data.dimensions.byDate) {
      lines.push('By Date');
      lines.push('Date,Count');
      data.dimensions.byDate.forEach((item: any) => {
        lines.push(`${item.date},${item.count}`);
      });
      lines.push('');
    }

    if (data.dimensions.byFileType) {
      lines.push('By File Type');
      lines.push('File Type,Count,Total Size');
      data.dimensions.byFileType.forEach((item: any) => {
        lines.push(`${item.fileType},${item.count},${item.totalSize}`);
      });
      lines.push('');
    }

    if (data.dimensions.byCountry) {
      lines.push('By Country');
      lines.push('Country,Count');
      data.dimensions.byCountry.forEach((item: any) => {
        lines.push(`${item.country},${item.count}`);
      });
      lines.push('');
    }
  }

  // Aggregations
  if (data.aggregations) {
    lines.push('AGGREGATIONS');
    lines.push(`Aggregation Type,${data.aggregations.aggregationType}`);
    lines.push('');

    if (data.aggregations.aggregatedMetrics) {
      lines.push('Aggregated Metrics');
      lines.push('Metric,Value');
      Object.entries(data.aggregations.aggregatedMetrics).forEach(([key, value]) => {
        lines.push(`${key},${value}`);
      });
    }
  }

  return lines.join('\n');
}

/**
 * Format report data as JSON
 */
export function formatAsJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format report data as HTML (for PDF conversion)
 */
export function formatAsHTML(data: ExportData): string {
  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHTML(data.reportName)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 20px;
            background-color: #f9fafb;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h1 {
            color: #3b82f6;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
          }
          h2 {
            color: #1e40af;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          h3 {
            color: #1e40af;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th {
            background-color: #f3f4f6;
            color: #1f2937;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #d1d5db;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:hover {
            background-color: #f9fafb;
          }
          .metric {
            display: inline-block;
            margin: 15px 20px 15px 0;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
          }
          .metric-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-top: 5px;
          }
          .meta {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${escapeHTML(data.reportName)}</h1>
          <div class="meta">
            <p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
  `;

  if (data.reportDescription) {
    html += `<p>${escapeHTML(data.reportDescription)}</p>`;
  }

  if (data.dateRange) {
    html += `
      <p>
        <strong>Date Range:</strong> ${data.dateRange.type}
        ${data.dateRange.from ? ` (From: ${data.dateRange.from})` : ''}
        ${data.dateRange.to ? ` (To: ${data.dateRange.to})` : ''}
      </p>
    `;
  }

  html += '</div>';

  // Metrics
  if (data.metrics) {
    html += '<div class="section"><h2>Metrics</h2>';

    if (data.metrics.downloads) {
      html += `
        <div class="metric">
          <div class="metric-label">Total Downloads</div>
          <div class="metric-value">${data.metrics.downloads.totalDownloads}</div>
        </div>
      `;

      if (data.metrics.downloads.mostDownloadedFiles) {
        html += '<h3>Most Downloaded Files</h3>';
        html += '<table><tr><th>File Name</th><th>Downloads</th></tr>';
        data.metrics.downloads.mostDownloadedFiles.slice(0, 10).forEach((file: any) => {
          html += `<tr><td>${escapeHTML(file.fileName)}</td><td>${file.count}</td></tr>`;
        });
        html += '</table>';
      }
    }

    if (data.metrics.fileTypes) {
      html += `
        <div class="metric">
          <div class="metric-label">Total Uploads</div>
          <div class="metric-value">${data.metrics.fileTypes.totalUploads}</div>
        </div>
      `;

      if (data.metrics.fileTypes.fileTypeDistribution) {
        html += '<h3>File Type Distribution</h3>';
        html += '<table><tr><th>File Type</th><th>Count</th><th>Total Size</th></tr>';
        data.metrics.fileTypes.fileTypeDistribution.slice(0, 10).forEach((ft: any) => {
          html += `<tr><td>${ft.fileType}</td><td>${ft.count}</td><td>${formatBytes(ft.totalSize)}</td></tr>`;
        });
        html += '</table>';
      }
    }

    if (data.metrics.geographic) {
      html += `
        <div class="metric">
          <div class="metric-label">Total Countries</div>
          <div class="metric-value">${data.metrics.geographic.totalCountries}</div>
        </div>
      `;

      if (data.metrics.geographic.topCountries) {
        html += '<h3>Top Countries</h3>';
        html += '<table><tr><th>Country</th><th>Downloads</th></tr>';
        data.metrics.geographic.topCountries.slice(0, 10).forEach((country: any) => {
          html += `<tr><td>${country.country}</td><td>${country.count}</td></tr>`;
        });
        html += '</table>';
      }
    }

    html += '</div>';
  }

  html += `
        </div>
      </body>
    </html>
  `;

  return html;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(value: string): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
