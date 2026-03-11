'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { getPendingUploadsCount } from '@/lib/pwa/offline-queue';

interface OfflineIndicatorProps {
  showPendingCount?: boolean;
}

export default function OfflineIndicator({ showPendingCount = true }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    updatePendingCount();

    // Handle online/offline events
    const handleOnline = () => {
      console.log('[OfflineIndicator] Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[OfflineIndicator] Offline');
      setIsOnline(false);
      updatePendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending uploads periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await getPendingUploadsCount();
      setPendingCount(count);
    } catch (error) {
      console.error('[OfflineIndicator] Error getting pending uploads:', error);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm z-40 animate-in slide-in-from-top-4 ${
        isOnline ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'
      } rounded-lg border ${
        isOnline
          ? 'border-blue-200 dark:border-blue-800'
          : 'border-red-200 dark:border-red-800'
      } p-3 flex items-center gap-3`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {pendingCount > 0
                ? `${pendingCount} upload${pendingCount !== 1 ? 's' : ''} pending`
                : 'Back online'}
            </p>
            {pendingCount > 0 && (
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Syncing when ready...
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              You're offline
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              Uploads will sync when you're back online
            </p>
          </div>
        </>
      )}
    </div>
  );
}
