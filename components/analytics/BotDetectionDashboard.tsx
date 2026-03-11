'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, TrendingUp, Lock } from 'lucide-react';

interface BotDetectionData {
  metrics: {
    captchaAttempts: number;
    captchaSuccesses: number;
    captchaFailures: number;
    successRate: number;
    blockedIps: number;
    botDetectedEvents: number;
  };
  blockedIps: Array<{
    ip: string;
    blockCount: number;
    lastBlockedAt: string;
    reason: string;
  }>;
  suspiciousPatterns: Array<{
    pattern: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  botVsHumanRatio: {
    humanVerified: number;
    botDetected: number;
    ratio: number;
  };
}

export default function BotDetectionDashboard() {
  const [data, setData] = useState<BotDetectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/bot-detection');
        if (!response.ok) throw new Error('Failed to fetch bot detection data');
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
        <div className="text-gray-500">Loading bot detection metrics...</div>
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
        <p className="text-gray-600">No bot detection data available</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CAPTCHA Attempts */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CAPTCHA Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.captchaAttempts}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.successRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Blocked IPs */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blocked IPs</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.blockedIps}</p>
            </div>
            <Lock className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        {/* Bot Detected Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bot Events</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.botDetectedEvents}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Bot vs Human Ratio */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bot vs Human Ratio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Human Verified</p>
            <p className="text-3xl font-bold text-green-600">{data.botVsHumanRatio.humanVerified}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Bot Detected</p>
            <p className="text-3xl font-bold text-red-600">{data.botVsHumanRatio.botDetected}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Bot Ratio</p>
            <p className="text-3xl font-bold text-orange-600">{data.botVsHumanRatio.ratio}%</p>
          </div>
        </div>
      </div>

      {/* Suspicious Patterns */}
      {data.suspiciousPatterns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suspicious Patterns</h3>
          <div className="space-y-3">
            {data.suspiciousPatterns.map((pattern, idx) => (
              <div key={idx} className={`border rounded-lg p-3 ${getSeverityColor(pattern.severity)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{pattern.pattern}</p>
                    <p className="text-sm">{pattern.description}</p>
                  </div>
                  <span className="text-lg font-bold">{pattern.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked IPs List */}
      {data.blockedIps.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Blocked IPs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">IP Address</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Block Count</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Last Blocked</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.blockedIps.slice(0, 10).map((ip, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-gray-900">{ip.ip}</td>
                    <td className="py-2 px-3 text-gray-600">{ip.blockCount}</td>
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(ip.lastBlockedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 text-gray-600">{ip.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
