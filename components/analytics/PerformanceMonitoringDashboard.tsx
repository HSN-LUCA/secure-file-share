'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, HardDrive, AlertCircle } from 'lucide-react';

interface MonitoringData {
  apiPerformance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    endpointMetrics: Array<{
      endpoint: string;
      method: string;
      avgResponseTime: number;
      requestCount: number;
      errorRate: number;
    }>;
  };
  databasePerformance: {
    averageQueryTime: number;
    slowQueryCount: number;
    connectionPoolUsage: number;
    activeConnections: number;
  };
  storageUsage: {
    totalUsed: number;
    totalAvailable: number;
    percentageUsed: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    errorRate: number;
    lastHealthCheck: string;
  };
}

export default function PerformanceMonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/monitoring');
        if (!response.ok) throw new Error('Failed to fetch monitoring data');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading performance metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No monitoring data available</p>
      </div>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* System Health */}
      <div className={`rounded-lg border p-6 ${getHealthColor(data.systemHealth.status)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">System Health</h3>
            <p className="text-sm mb-2">Status: {data.systemHealth.status.toUpperCase()}</p>
            <p className="text-sm">Uptime: {data.systemHealth.uptime}%</p>
            <p className="text-sm">Error Rate: {data.systemHealth.errorRate}%</p>
          </div>
          <AlertCircle className="w-12 h-12" />
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">API Performance</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600">Avg Response Time</p>
              <p className="text-lg font-bold text-gray-900">{data.apiPerformance.averageResponseTime}ms</p>
            </div>
            <div>
              <p className="text-gray-600">P95 Response Time</p>
              <p className="text-lg font-bold text-gray-900">{data.apiPerformance.p95ResponseTime}ms</p>
            </div>
            <div>
              <p className="text-gray-600">P99 Response Time</p>
              <p className="text-lg font-bold text-gray-900">{data.apiPerformance.p99ResponseTime}ms</p>
            </div>
          </div>
        </div>

        {/* Database Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Database</h3>
            <Database className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600">Avg Query Time</p>
              <p className="text-lg font-bold text-gray-900">{data.databasePerformance.averageQueryTime}ms</p>
            </div>
            <div>
              <p className="text-gray-600">Slow Queries</p>
              <p className="text-lg font-bold text-gray-900">{data.databasePerformance.slowQueryCount}</p>
            </div>
            <div>
              <p className="text-gray-600">Active Connections</p>
              <p className="text-lg font-bold text-gray-900">{data.databasePerformance.activeConnections}</p>
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Storage</h3>
            <HardDrive className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600">Used</p>
              <p className="text-lg font-bold text-gray-900">{formatBytes(data.storageUsage.totalUsed)}</p>
            </div>
            <div>
              <p className="text-gray-600">Available</p>
              <p className="text-lg font-bold text-gray-900">{formatBytes(data.storageUsage.totalAvailable)}</p>
            </div>
            <div>
              <p className="text-gray-600">Usage</p>
              <p className="text-lg font-bold text-gray-900">{data.storageUsage.percentageUsed}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoint Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Endpoint</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Method</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Avg Response</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Requests</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.apiPerformance.endpointMetrics.map((endpoint, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-gray-900">{endpoint.endpoint}</td>
                  <td className="py-2 px-3">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{endpoint.avgResponseTime}ms</td>
                  <td className="py-2 px-3 text-gray-600">{endpoint.requestCount}</td>
                  <td className="py-2 px-3">
                    <span className={endpoint.errorRate > 1 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                      {endpoint.errorRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connection Pool Usage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connection Pool</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all"
            style={{ width: `${data.databasePerformance.connectionPoolUsage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {data.databasePerformance.connectionPoolUsage}% utilization
        </p>
      </div>
    </div>
  );
}
