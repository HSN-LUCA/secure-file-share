/**
 * Service Worker Registration and Update Management
 * Handles SW registration, updates, and user notifications
 */

interface ServiceWorkerUpdateEvent {
  type: 'update-available' | 'update-installed' | 'error';
  message?: string;
}

type UpdateCallback = (event: ServiceWorkerUpdateEvent) => void;

let updateCallback: UpdateCallback | null = null;
let registration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  onUpdate?: UpdateCallback
): Promise<ServiceWorkerRegistration | null> {
  // Only register in browser environment
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return null;
  }

  try {
    updateCallback = onUpdate || null;

    console.log('[PWA] Registering service worker...');
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    });

    console.log('[PWA] Service Worker registered successfully');

    // Check for updates periodically
    setInterval(() => {
      registration?.update().catch((error) => {
        console.error('[PWA] Error checking for updates:', error);
      });
    }, 60000); // Check every minute

    // Listen for updates
    registration.addEventListener('updatefound', handleUpdateFound);

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    notifyUpdate({
      type: 'error',
      message: 'Failed to register service worker',
    });
    return null;
  }
}

/**
 * Handle when a new service worker is found
 */
function handleUpdateFound() {
  if (!registration) return;

  const newWorker = registration.installing;
  if (!newWorker) return;

  console.log('[PWA] New service worker found');

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // New SW is ready to activate
      console.log('[PWA] New service worker ready to activate');
      notifyUpdate({
        type: 'update-available',
        message: 'A new version of the app is available',
      });
    }
  });
}

/**
 * Handle when a new service worker takes control
 */
function handleControllerChange() {
  console.log('[PWA] Service Worker controller changed');
  notifyUpdate({
    type: 'update-installed',
    message: 'App updated successfully',
  });
}

/**
 * Notify about service worker updates
 */
function notifyUpdate(event: ServiceWorkerUpdateEvent) {
  if (updateCallback) {
    updateCallback(event);
  }
}

/**
 * Prompt user to update and apply the update
 */
export async function promptAndUpdate(): Promise<boolean> {
  if (!registration || !registration.waiting) {
    console.log('[PWA] No pending update');
    return false;
  }

  console.log('[PWA] Applying pending update...');

  // Tell the waiting service worker to skip waiting
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });

  // Wait for the new service worker to take control
  return new Promise((resolve) => {
    const onControllerChange = () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      console.log('[PWA] Update applied, reloading page...');
      window.location.reload();
      resolve(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Timeout after 5 seconds
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      resolve(false);
    }, 5000);
  });
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!registration) {
    console.log('[PWA] No service worker registered');
    return false;
  }

  try {
    const success = await registration.unregister();
    if (success) {
      console.log('[PWA] Service Worker unregistered');
      registration = null;
    }
    return success;
  } catch (error) {
    console.error('[PWA] Error unregistering service worker:', error);
    return false;
  }
}

/**
 * Get current service worker registration
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return registration;
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return registration !== null && navigator.serviceWorker.controller !== null;
}

/**
 * Check if an update is pending
 */
export function hasUpdatePending(): boolean {
  return registration?.waiting !== null && registration?.waiting !== undefined;
}
