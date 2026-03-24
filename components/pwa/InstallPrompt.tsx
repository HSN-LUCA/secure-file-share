'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import {
  trackPromptShown,
  trackPromptAccepted,
  trackPromptDismissed,
} from '@/lib/pwa/install-prompt';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  onInstallSuccess?: () => void;
  onInstallDismissed?: () => void;
}

export default function InstallPrompt({
  onInstallSuccess,
  onInstallDismissed,
}: InstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const checkIOS = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    setIsIOS(checkIOS());

    // Handle beforeinstallprompt event (Chrome, Edge, Opera)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[InstallPrompt] beforeinstallprompt event fired');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
      trackPromptShown();
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('[InstallPrompt] App installed successfully');
      setShowPrompt(false);
      setDeferredPrompt(null);
      trackPromptAccepted();
      onInstallSuccess?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[InstallPrompt] App is already installed');
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstallSuccess]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('[InstallPrompt] No deferred prompt available');
      return;
    }

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[InstallPrompt] User accepted install prompt');
        setShowPrompt(false);
        setDeferredPrompt(null);
        trackPromptAccepted();
        onInstallSuccess?.();
      } else {
        console.log('[InstallPrompt] User dismissed install prompt');
        trackPromptDismissed();
        onInstallDismissed?.();
      }
    } catch (error) {
      console.error('[InstallPrompt] Error during installation:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    console.log('[InstallPrompt] User dismissed install prompt');
    setShowPrompt(false);
    trackPromptDismissed();
    onInstallDismissed?.();
  };

  // Don't show prompt if already installed or on iOS (iOS has different install flow)
  if (!showPrompt || isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Install App
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Install HodHod on your device for quick access and offline support.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-medium py-2 px-3 rounded transition-colors text-sm flex items-center justify-center gap-2"
              aria-label="Install app"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Install
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={isInstalling}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium py-2 px-3 rounded transition-colors text-sm disabled:opacity-50"
              aria-label="Not now"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
