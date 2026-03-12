'use client';

/**
 * Dashboard Component
 * Displays user's uploaded files, download statistics, and storage usage
 */

import React, { useEffect, useState } from 'react';
import { Card, Button, Alert } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardFile {
  id: string;
  shareCode: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  expiresAt: string;
  downloadCount: number;
  lastDownloadedAt: string | null;
}

interface DashboardStats {
  totalUploads: number;
  totalDownloads: number;
  storageUsed: number;
  storageUsedFormatted: string;
}

interface DashboardData {
  user: {
    id: string;
    email: string;
    plan: string;
    enterprisePlan?: {
      maxFileSize: number;
      storageDurationMinutes: number;
      uploadsPerDay: number;
      customSupportEmail: string | null;
    };
  };
  files: DashboardFile[];
  stats: DashboardStats;
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
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [extendingFileId, setExtendingFileId] = useState<string | null>(null);

  // ========================================================================
  // FETCH DASHBOARD DATA
  // ========================================================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');

        if (!token) {
          setError('Not authenticated');
          return;
        }

        const response = await fetch('/api/dashboard', {
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
          throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load dashboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ========================================================================
  // DELETE FILE
  // ========================================================================

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setDeletingFileId(fileId);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/dashboard/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Remove file from state
      if (data) {
        setData({
          ...data,
          files: data.files.filter((f) => f.id !== fileId),
          stats: {
            ...data.stats,
            totalUploads: data.stats.totalUploads - 1,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setDeletingFileId(null);
    }
  };

  // ========================================================================
  // EXTEND EXPIRATION
  // ========================================================================

  const handleExtendExpiration = async (fileId: string) => {
    try {
      setExtendingFileId(fileId);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/dashboard/files/${fileId}/extend`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to extend expiration');
      }

      const result = await response.json();

      if (result.success && data) {
        // Update file expiration in state
        setData({
          ...data,
          files: data.files.map((f) =>
            f.id === fileId ? { ...f, expiresAt: result.data.expiresAt } : f
          ),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend expiration');
    } finally {
      setExtendingFileId(null);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert type="error" title="Error">{error}</Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert type="error" title="Error">Failed to load dashboard data</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, <span className="font-semibold">{data.user.email}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Plan: <span className="font-semibold capitalize">{data.user.plan}</span>
        </p>
      </div>

      {/* Enterprise Plan Info */}
      {data.user.enterprisePlan && (
        <Card>
          <div className="p-6 mb-8 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Enterprise Plan Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Max File Size</p>
                <p className="text-lg font-semibold text-blue-900">
                  {formatBytes(data.user.enterprisePlan.maxFileSize)}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Storage Duration</p>
                <p className="text-lg font-semibold text-blue-900">
                  {data.user.enterprisePlan.storageDurationMinutes} minutes
                  {data.user.enterprisePlan.storageDurationMinutes >= 1440 &&
                    ` (${Math.round(data.user.enterprisePlan.storageDurationMinutes / 1440)} days)`}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Daily Uploads</p>
                <p className="text-lg font-semibold text-blue-900">
                  {data.user.enterprisePlan.uploadsPerDay === -1 ? 'Unlimited' : data.user.enterprisePlan.uploadsPerDay}
                </p>
              </div>
              {data.user.enterprisePlan.customSupportEmail && (
                <div>
                  <p className="text-sm text-blue-700">Support Email</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {data.user.enterprisePlan.customSupportEmail}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Uploads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.stats.totalUploads}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Downloads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.stats.totalDownloads}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-gray-600 text-sm font-medium">Storage Used</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.stats.storageUsedFormatted}</p>
          </div>
        </Card>
      </div>

      {/* Files List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Files</h2>

          {data.files.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No files uploaded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">File Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Share Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Downloads</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Expires</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.files.map((file) => {
                    const isExpired = new Date(file.expiresAt) < new Date();

                    return (
                      <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium truncate max-w-xs">
                          {file.fileName}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{formatBytes(file.fileSize)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-900">
                              {file.shareCode}
                            </code>
                            <button
                              onClick={() => copyToClipboard(file.shareCode)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                              title="Copy share code"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{file.downloadCount}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-sm ${
                              isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            {isExpired ? (
                              'Expired'
                            ) : (
                              <>
                                {formatDistanceToNow(new Date(file.expiresAt), {
                                  addSuffix: true,
                                })}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {!isExpired && (
                              <button
                                onClick={() => handleExtendExpiration(file.id)}
                                disabled={extendingFileId === file.id}
                                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                              >
                                {extendingFileId === file.id ? 'Extending...' : 'Extend'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              disabled={deletingFileId === file.id}
                              className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              {deletingFileId === file.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
