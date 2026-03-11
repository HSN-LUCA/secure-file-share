'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker, promptAndUpdate, hasUpdatePending } from '@/lib/pwa/sw-register';
import { X, RefreshCw } from 'lucide-react';

interface UpdatePromptProps {
  onUpdateAvailable?: () => void;
  onUpdateInstalled?: () => void;
}

export default function UpdatePrompt({
  onUpdateAvailable,
  onUpdateInstalled,
}: UpdatePromptProps) {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Register service worker and listen for updates
    registerServiceWorker((event) => {
      console.log('[UpdatePrompt] Update event:', event.type);

      if (event.type === 'update-available') {
        setShowUpdatePrompt(true);
        onUpdateAvailable?.();
      } else if (event.type === 'update-installed') {
        setShowUpdatePrompt(false);
        onUpdateInstalled?.();
      }
    });

    // Check if there's already a pending update
    if (hasUpdatePending()) {
      setShowUpdatePrompt(true);
    }
  }, [onUpdateAvailable, onUpdateInstalled]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await promptAndUpdate();
    } catch (error) {
      console.error('[UpdatePrompt] Error applying update:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Update Available
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              aria-label="Dismiss update prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            A new version of the app is available. Update now to get the latest features and improvements.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-3 rounded transition-colors text-sm flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Now'
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={isUpdating}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium py-2 px-3 rounded transition-colors text-sm disabled:opacity-50"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
