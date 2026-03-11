/**
 * Analytics Page
 * Displays the analytics dashboard for authenticated users
 */

import React from 'react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const metadata = {
  title: 'Analytics - Secure File Share',
  description: 'View analytics and metrics for your file sharing activity',
};

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AnalyticsDashboard />
    </main>
  );
}
