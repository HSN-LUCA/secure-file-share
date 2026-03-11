/**
 * Dashboard Page
 * User dashboard for managing uploaded files
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');

    if (!token) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Dashboard />
    </main>
  );
}
