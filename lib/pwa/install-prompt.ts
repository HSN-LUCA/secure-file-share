/**
 * PWA Install Prompt Detection and Metrics
 * Handles install prompt detection, tracking, and analytics
 */

interface InstallMetrics {
  promptShown: number;
  promptAccepted: number;
  promptDismissed: number;
  installDate?: string;
  isInstalled: boolean;
}

const METRICS_STORAGE_KEY = 'pwa_install_metrics';

/**
 * Get current install metrics
 */
export function getInstallMetrics(): InstallMetrics {
  if (typeof window === 'undefined') {
    return {
      promptShown: 0,
      promptAccepted: 0,
      promptDismissed: 0,
      isInstalled: false,
    };
  }

  try {
    const stored = localStorage.getItem(METRICS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[PWA] Error reading install metrics:', error);
  }

  return {
    promptShown: 0,
    promptAccepted: 0,
    promptDismissed: 0,
    isInstalled: false,
  };
}

/**
 * Update install metrics
 */
function updateMetrics(updates: Partial<InstallMetrics>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getInstallMetrics();
    const updated = { ...current, ...updates };
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[PWA] Error updating install metrics:', error);
  }
}

/**
 * Track install prompt shown
 */
export function trackPromptShown(): void {
  const metrics = getInstallMetrics();
  updateMetrics({
    promptShown: metrics.promptShown + 1,
  });
  console.log('[PWA] Install prompt shown');
}

/**
 * Track install prompt accepted
 */
export function trackPromptAccepted(): void {
  const metrics = getInstallMetrics();
  updateMetrics({
    promptAccepted: metrics.promptAccepted + 1,
    installDate: new Date().toISOString(),
    isInstalled: true,
  });
  console.log('[PWA] Install prompt accepted');
}

/**
 * Track install prompt dismissed
 */
export function trackPromptDismissed(): void {
  const metrics = getInstallMetrics();
  updateMetrics({
    promptDismissed: metrics.promptDismissed + 1,
  });
  console.log('[PWA] Install prompt dismissed');
}

/**
 * Check if app is installed
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check if running as PWA on iOS
  if ((navigator as any).standalone === true) {
    return true;
  }

  // Check metrics
  const metrics = getInstallMetrics();
  return metrics.isInstalled;
}

/**
 * Check if install prompt should be shown
 */
export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;

  // Don't show if already installed
  if (isAppInstalled()) {
    return false;
  }

  // Don't show on iOS (has different install flow)
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipot/.test(userAgent)) {
    return false;
  }

  // Don't show if already dismissed recently
  const metrics = getInstallMetrics();
  if (metrics.promptDismissed > 0) {
    // Could add logic to show again after X days
    return false;
  }

  return true;
}

/**
 * Get install prompt acceptance rate
 */
export function getInstallAcceptanceRate(): number {
  const metrics = getInstallMetrics();
  if (metrics.promptShown === 0) return 0;
  return (metrics.promptAccepted / metrics.promptShown) * 100;
}

/**
 * Reset install metrics (for testing)
 */
export function resetInstallMetrics(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(METRICS_STORAGE_KEY);
    console.log('[PWA] Install metrics reset');
  } catch (error) {
    console.error('[PWA] Error resetting install metrics:', error);
  }
}

/**
 * Send install metrics to analytics
 */
export async function sendInstallMetrics(endpoint: string = '/api/analytics/install'): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const metrics = getInstallMetrics();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...metrics,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      console.warn('[PWA] Failed to send install metrics:', response.statusText);
    } else {
      console.log('[PWA] Install metrics sent successfully');
    }
  } catch (error) {
    console.error('[PWA] Error sending install metrics:', error);
  }
}
