'use client';

/**
 * Custom Report Builder Component
 * Allows users to create custom reports by selecting metrics and dimensions
 */

import React, { useState } from 'react';
import { Card, Button, Alert } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

interface CustomReportBuilderProps {
  onReportCreated?: (reportId: string) => void;
}

interface ReportConfig {
  name: string;
  description: string;
  metrics: string[];
  dimensions: string[];
  dateRangeType: 'all' | 'last_7_days' | 'last_30_days' | 'custom';
  dateRangeFrom?: string;
  dateRangeTo?: string;
  sortBy?: string;
  sortOrder: 'ASC' | 'DESC';
  isPublic: boolean;
}

// ============================================================================
// AVAILABLE METRICS AND DIMENSIONS
// ============================================================================

const AVAILABLE_METRICS = [
  { id: 'downloads', label: 'Downloads', description: 'Total downloads and trends' },
  { id: 'fileTypes', label: 'File Types', description: 'Distribution by file type' },
  { id: 'geographic', label: 'Geographic', description: 'Downloads by country' },
  { id: 'botDetection', label: 'Bot Detection', description: 'Bot vs human metrics' },
];

const AVAILABLE_DIMENSIONS = [
  { id: 'date', label: 'Date', description: 'Group by date' },
  { id: 'fileType', label: 'File Type', description: 'Group by file type' },
  { id: 'country', label: 'Country', description: 'Group by country' },
  { id: 'user', label: 'User', description: 'Group by user' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function CustomReportBuilder({ onReportCreated }: CustomReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    metrics: [],
    dimensions: [],
    dateRangeType: 'all',
    sortOrder: 'DESC',
    isPublic: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleMetricToggle = (metricId: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((m) => m !== metricId)
        : [...prev.metrics, metricId],
    }));
  };

  const handleDimensionToggle = (dimensionId: string) => {
    setConfig((prev) => ({
      ...prev,
      dimensions: prev.dimensions.includes(dimensionId)
        ? prev.dimensions.filter((d) => d !== dimensionId)
        : [...prev.dimensions, dimensionId],
    }));
  };

  const handleDateRangeChange = (type: string) => {
    setConfig((prev) => ({
      ...prev,
      dateRangeType: type as any,
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
    }));
  };

  const handleCreateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validate
      if (!config.name.trim()) {
        setError('Report name is required');
        return;
      }

      if (config.metrics.length === 0) {
        setError('Select at least one metric');
        return;
      }

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create report');
      }

      const data = await response.json();
      setSuccess(true);
      setConfig({
        name: '',
        description: '',
        metrics: [],
        dimensions: [],
        dateRangeType: 'all',
        sortOrder: 'DESC',
        isPublic: false,
      });

      if (onReportCreated) {
        onReportCreated(data.data.reportId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Custom Report</h2>

          {error && (
            <Alert type="error" title="Error" className="mb-4">
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" title="Success" className="mb-4">
              Report created successfully!
            </Alert>
          )}

          {/* Report Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Name *</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Monthly Download Report"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Report Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this report"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Metrics Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Metrics * ({config.metrics.length} selected)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_METRICS.map((metric) => (
                <label key={metric.id} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={config.metrics.includes(metric.id)}
                    onChange={() => handleMetricToggle(metric.id)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{metric.label}</div>
                    <div className="text-sm text-gray-600">{metric.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dimensions Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Dimensions ({config.dimensions.length} selected)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_DIMENSIONS.map((dimension) => (
                <label key={dimension.id} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={config.dimensions.includes(dimension.id)}
                    onChange={() => handleDimensionToggle(dimension.id)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{dimension.label}</div>
                    <div className="text-sm text-gray-600">{dimension.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'last_7_days', 'last_30_days', 'custom'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleDateRangeChange(type)}
                  className={`px-4 py-2 rounded ${
                    config.dateRangeType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all'
                    ? 'All Time'
                    : type === 'last_7_days'
                      ? 'Last 7 Days'
                      : type === 'last_30_days'
                        ? 'Last 30 Days'
                        : 'Custom'}
                </button>
              ))}
            </div>

            {config.dateRangeType === 'custom' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={config.dateRangeFrom || ''}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, dateRangeFrom: e.target.value }))
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={config.dateRangeTo || ''}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, dateRangeTo: e.target.value }))
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Sort Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
            <select
              value={config.sortOrder}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, sortOrder: e.target.value as 'ASC' | 'DESC' }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="DESC">Descending (Highest First)</option>
              <option value="ASC">Ascending (Lowest First)</option>
            </select>
          </div>

          {/* Public Report */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.isPublic}
                onChange={(e) => setConfig((prev) => ({ ...prev, isPublic: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Make this report public</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCreateReport}
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Report'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
