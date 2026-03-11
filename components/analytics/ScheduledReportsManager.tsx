'use client';

/**
 * Scheduled Reports Manager Component
 * Allows users to create and manage scheduled reports
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  scheduleType: 'daily' | 'weekly' | 'monthly';
  scheduleTime: string;
  recipientEmails: string[];
  isActive: boolean;
}

interface ScheduledReportForm {
  name: string;
  description: string;
  scheduleType: 'daily' | 'weekly' | 'monthly';
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleTime: string;
  recipientEmails: string;
  includeCharts: boolean;
  includeSummary: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScheduledReportsManager() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [form, setForm] = useState<ScheduledReportForm>({
    name: '',
    description: '',
    scheduleType: 'daily',
    scheduleTime: '09:00',
    recipientEmails: '',
    includeCharts: true,
    includeSummary: true,
  });

  // ========================================================================
  // FETCH SCHEDULED REPORTS
  // ========================================================================

  const fetchScheduledReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/reports/scheduled', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scheduled reports');
      }

      const data = await response.json();
      setReports(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  // ========================================================================
  // CREATE SCHEDULED REPORT
  // ========================================================================

  const handleCreateReport = async () => {
    try {
      setFormLoading(true);
      setError(null);

      // Validate
      if (!form.name.trim()) {
        setError('Report name is required');
        return;
      }

      if (!form.recipientEmails.trim()) {
        setError('At least one recipient email is required');
        return;
      }

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const recipientEmails = form.recipientEmails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email);

      const response = await fetch('/api/reports/scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          scheduleType: form.scheduleType,
          scheduleDayOfWeek: form.scheduleDayOfWeek,
          scheduleDayOfMonth: form.scheduleDayOfMonth,
          scheduleTime: form.scheduleTime,
          recipientEmails,
          includeCharts: form.includeCharts,
          includeSummary: form.includeSummary,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create scheduled report');
      }

      setShowForm(false);
      setForm({
        name: '',
        description: '',
        scheduleType: 'daily',
        scheduleTime: '09:00',
        recipientEmails: '',
        includeCharts: true,
        includeSummary: true,
      });

      await fetchScheduledReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
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
          <p className="text-gray-600">Loading scheduled reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <Alert type="error" title="Error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Scheduled Reports</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create Report'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Scheduled Report</h3>

            {/* Report Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Weekly Analytics Report"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Schedule Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
              <select
                value={form.scheduleType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    scheduleType: e.target.value as 'daily' | 'weekly' | 'monthly',
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Schedule Time */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Send Time</label>
              <input
                type="time"
                value={form.scheduleTime}
                onChange={(e) => setForm((prev) => ({ ...prev, scheduleTime: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Recipient Emails */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Emails * (comma-separated)
              </label>
              <textarea
                value={form.recipientEmails}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, recipientEmails: e.target.value }))
                }
                placeholder="email1@example.com, email2@example.com"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Options */}
            <div className="mb-6 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.includeCharts}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, includeCharts: e.target.checked }))
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include charts</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.includeSummary}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, includeSummary: e.target.checked }))
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include summary</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleCreateReport}
                disabled={formLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {formLoading ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <p className="text-gray-600">No scheduled reports yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                    {report.description && (
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    )}
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Schedule:</strong> {report.scheduleType} at {report.scheduleTime}
                      </p>
                      <p>
                        <strong>Recipients:</strong> {report.recipientEmails.join(', ')}
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            report.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
