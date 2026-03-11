'use client';

/**
 * Analytics Dashboard Component
 * Displays comprehensive analytics metrics including downloads, file types, geographic data, and bot detection
 */

import React, { useEffect, useState } from 'react';
import { Card, Button, Alert } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsData {
  summary: {
    totalUploads: number;
    totalDownloads: number;
    totalUsers: number;
    totalEvents: number;
  };
  downloads: {
    totalDownloads: number;
    downloadsPerDay: Array<{ date: string; count: number }>;
    mostDownloadedFiles: Array<{ fileId: string; fileName: string; count: number }>;
  };
  fileTypes: {
    totalUploads: number;
    fileTypeDistribution: Array<{ fileType: string; count: number; totalSize: number }>;
  };
  geographic: {
    topCountries: Array<{ country: string; count: number }>;
    totalCountries: number;
  };
  botDetection: {
    captchaAttempts: number;
    captchaSuccesses: number;
    captchaFailures: number;
    successRate: number;
    blockedIps: number;
    botDetectedEvents: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

/**
 * Get preset date range
 */
function getPresetDateRange(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const to = now.toISOString();

  switch (preset) {
    case '7days':
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: sevenDaysAgo.toISOString(), to };
    case '30days':
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: thirtyDaysAgo.toISOString(), to };
    case '90days':
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { from: ninetyDaysAgo.toISOString(), to };
    case 'all':
      return null;
    default:
      return null;
  }
}

// ============================================================================
// ANALYTICS DASHBOARD COMPONENT
// ============================================================================

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [preset, setPreset] = useState('all');

  // ========================================================================
  // FETCH ANALYTICS DATA
  // ========================================================================

  const fetchAnalytics = async (from?: string, to?: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams();
      if (from) params.append('from_date', from);
      if (to) params.append('to_date', to);

      const response = await fetch(`/api/analytics?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return;
        }
        throw new Error('Failed to fetch analytics data');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ========================================================================
  // HANDLE PRESET CHANGE
  // ========================================================================

  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
    const range = getPresetDateRange(newPreset);
    setDateRange(range);
    fetchAnalytics(range?.from, range?.to);
  };

  // ========================================================================
  // HANDLE CUSTOM DATE RANGE
  // ========================================================================

  const handleCustomDateRange = (from: string, to: string) => {
    setPreset('custom');
    setDateRange({ from, to });
    fetchAnalytics(from, to);
  };

  // ========================================================================
  // EXPORT ANALYTICS
  // ========================================================================

  const handleExportCSV = () => {
    if (!data) return;

    const csv = generateCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!data) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert type="error" title="Error">
          {error}
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert type="error" title="Error">
          Failed to load analytics data
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">View comprehensive analytics and metrics</p>
      </div>

      {/* Date Range Filters */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-4 py-2 rounded ${
                preset === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handlePresetChange('7days')}
              className={`px-4 py-2 rounded ${
                preset === '7days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePresetChange('30days')}
              className={`px-4 py-2 rounded ${
                preset === '30days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetChange('90days')}
              className={`px-4 py-2 rounded ${
                preset === '90days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 90 Days
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export JSON
            </button>
          </div>
        </div>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Uploads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.summary.totalUploads}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Downloads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.summary.totalDownloads}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.summary.totalUsers}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Events</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.summary.totalEvents}</p>
          </div>
        </Card>
      </div>

      {/* Download Statistics */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Download Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Downloads */}
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{data.downloads.totalDownloads}</p>
            </div>

            {/* Most Downloaded Files */}
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Most Downloaded Files</p>
              {data.downloads.mostDownloadedFiles.length === 0 ? (
                <p className="text-gray-600">No downloads yet</p>
              ) : (
                <div className="space-y-2">
                  {data.downloads.mostDownloadedFiles.slice(0, 5).map((file) => (
                    <div key={file.fileId} className="flex justify-between items-center">
                      <span className="text-gray-700 truncate">{file.fileName}</span>
                      <span className="text-gray-900 font-semibold">{file.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Downloads Per Day */}
          {data.downloads.downloadsPerDay.length > 0 && (
            <div className="mt-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Downloads Per Day</p>
              <div className="space-y-1">
                {data.downloads.downloadsPerDay.slice(-7).map((day) => (
                  <div key={day.date} className="flex justify-between items-center">
                    <span className="text-gray-700">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="bg-blue-500 h-6 rounded"
                        style={{
                          width: `${Math.max(
                            20,
                            (day.count /
                              Math.max(
                                ...data.downloads.downloadsPerDay.map((d) => d.count)
                              )) *
                              200
                          )}px`,
                        }}
                      ></div>
                      <span className="text-gray-900 font-semibold w-12 text-right">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* File Type Statistics */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">File Type Statistics</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">File Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Count</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Size</th>
                </tr>
              </thead>
              <tbody>
                {data.fileTypes.fileTypeDistribution.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 px-4 text-center text-gray-600">
                      No file type data available
                    </td>
                  </tr>
                ) : (
                  data.fileTypes.fileTypeDistribution.map((ft) => (
                    <tr key={ft.fileType} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{ft.fileType}</td>
                      <td className="py-3 px-4 text-gray-600">{ft.count}</td>
                      <td className="py-3 px-4 text-gray-600">{formatBytes(ft.totalSize)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Geographic Statistics */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Geographic Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Total Countries</p>
              <p className="text-2xl font-bold text-gray-900">{data.geographic.totalCountries}</p>
            </div>

            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Top Countries</p>
              {data.geographic.topCountries.length === 0 ? (
                <p className="text-gray-600">No geographic data available</p>
              ) : (
                <div className="space-y-2">
                  {data.geographic.topCountries.slice(0, 5).map((country) => (
                    <div key={country.country} className="flex justify-between items-center">
                      <span className="text-gray-700">{country.country}</span>
                      <span className="text-gray-900 font-semibold">{country.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Bot Detection Metrics */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bot Detection Metrics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm font-medium">CAPTCHA Attempts</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.botDetection.captchaAttempts}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm font-medium">CAPTCHA Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.botDetection.successRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm font-medium">Blocked IPs</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{data.botDetection.blockedIps}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm font-medium">CAPTCHA Successes</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.botDetection.captchaSuccesses}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm font-medium">CAPTCHA Failures</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.botDetection.captchaFailures}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm font-medium">Bot Detected Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.botDetection.botDetectedEvents}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTION: GENERATE CSV
// ============================================================================

function generateCSV(data: AnalyticsData): string {
  const lines: string[] = [];

  // Summary
  lines.push('SUMMARY');
  lines.push('Total Uploads,Total Downloads,Total Users,Total Events');
  lines.push(
    `${data.summary.totalUploads},${data.summary.totalDownloads},${data.summary.totalUsers},${data.summary.totalEvents}`
  );
  lines.push('');

  // Downloads
  lines.push('DOWNLOADS');
  lines.push('Total Downloads');
  lines.push(data.downloads.totalDownloads.toString());
  lines.push('');

  lines.push('Downloads Per Day');
  lines.push('Date,Count');
  data.downloads.downloadsPerDay.forEach((day) => {
    lines.push(`${day.date},${day.count}`);
  });
  lines.push('');

  lines.push('Most Downloaded Files');
  lines.push('File Name,Count');
  data.downloads.mostDownloadedFiles.forEach((file) => {
    lines.push(`"${file.fileName}",${file.count}`);
  });
  lines.push('');

  // File Types
  lines.push('FILE TYPES');
  lines.push('File Type,Count,Total Size');
  data.fileTypes.fileTypeDistribution.forEach((ft) => {
    lines.push(`${ft.fileType},${ft.count},${ft.totalSize}`);
  });
  lines.push('');

  // Geographic
  lines.push('GEOGRAPHIC');
  lines.push('Country,Count');
  data.geographic.topCountries.forEach((country) => {
    lines.push(`${country.country},${country.count}`);
  });
  lines.push('');

  // Bot Detection
  lines.push('BOT DETECTION');
  lines.push('Metric,Value');
  lines.push(`CAPTCHA Attempts,${data.botDetection.captchaAttempts}`);
  lines.push(`CAPTCHA Successes,${data.botDetection.captchaSuccesses}`);
  lines.push(`CAPTCHA Failures,${data.botDetection.captchaFailures}`);
  lines.push(`Success Rate,${data.botDetection.successRate}%`);
  lines.push(`Blocked IPs,${data.botDetection.blockedIps}`);
  lines.push(`Bot Detected Events,${data.botDetection.botDetectedEvents}`);

  return lines.join('\n');
}
