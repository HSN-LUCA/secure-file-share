/**
 * Offline Sync Manager
 * Handles syncing queued uploads when connection is restored
 */

import {
  getQueuedUploads,
  updateQueuedUploadStatus,
  removeFromUploadQueue,
  isOnline,
  type QueuedUpload,
} from './offline-queue';

interface SyncOptions {
  maxConcurrent?: number;
  onProgress?: (progress: SyncProgress) => void;
  onError?: (error: Error) => void;
}

interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  currentId?: string;
}

let isSyncing = false;
let syncAbortController: AbortController | null = null;

/**
 * Start syncing queued uploads
 */
export async function startSync(options: SyncOptions = {}): Promise<void> {
  const { maxConcurrent = 3, onProgress, onError } = options;

  if (isSyncing) {
    console.log('[OfflineSync] Sync already in progress');
    return;
  }

  if (!isOnline()) {
    console.log('[OfflineSync] Not online, cannot sync');
    return;
  }

  isSyncing = true;
  syncAbortController = new AbortController();

  try {
    console.log('[OfflineSync] Starting sync...');

    const uploads = await getQueuedUploads('pending');
    if (uploads.length === 0) {
      console.log('[OfflineSync] No pending uploads to sync');
      isSyncing = false;
      return;
    }

    const progress: SyncProgress = {
      total: uploads.length,
      completed: 0,
      failed: 0,
    };

    onProgress?.(progress);

    // Process uploads in batches
    for (let i = 0; i < uploads.length; i += maxConcurrent) {
      if (syncAbortController.signal.aborted) {
        console.log('[OfflineSync] Sync aborted');
        break;
      }

      const batch = uploads.slice(i, i + maxConcurrent);
      const results = await Promise.allSettled(
        batch.map((upload) => syncUpload(upload, progress, onProgress))
      );

      results.forEach((result) => {
        if (result.status === 'rejected') {
          progress.failed += 1;
          onError?.(result.reason);
        }
      });
    }

    console.log('[OfflineSync] Sync completed:', progress);
    onProgress?.(progress);
  } catch (error) {
    console.error('[OfflineSync] Sync error:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  } finally {
    isSyncing = false;
    syncAbortController = null;
  }
}

/**
 * Sync a single upload
 */
async function syncUpload(
  upload: QueuedUpload,
  progress: SyncProgress,
  onProgress?: (progress: SyncProgress) => void
): Promise<void> {
  if (!syncAbortController || syncAbortController.signal.aborted) {
    throw new Error('Sync aborted');
  }

  try {
    progress.currentId = upload.id;
    onProgress?.(progress);

    await updateQueuedUploadStatus(upload.id, 'uploading');

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', upload.file);

    // Upload file
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: syncAbortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    // Mark as completed
    await updateQueuedUploadStatus(upload.id, 'completed');
    await removeFromUploadQueue(upload.id);

    progress.completed += 1;
    onProgress?.(progress);

    console.log('[OfflineSync] Upload synced:', upload.id);
  } catch (error) {
    console.error('[OfflineSync] Failed to sync upload:', upload.id, error);

    if (upload.retryCount < upload.maxRetries) {
      // Retry
      await updateQueuedUploadStatus(
        upload.id,
        'pending',
        error instanceof Error ? error.message : String(error)
      );
    } else {
      // Mark as failed
      await updateQueuedUploadStatus(
        upload.id,
        'failed',
        error instanceof Error ? error.message : String(error)
      );
    }

    throw error;
  }
}

/**
 * Stop syncing
 */
export function stopSync(): void {
  if (syncAbortController) {
    syncAbortController.abort();
    console.log('[OfflineSync] Sync stopped');
  }
}

/**
 * Check if syncing
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

/**
 * Setup online/offline listeners
 */
export function setupSyncListeners(options: SyncOptions = {}): () => void {
  const handleOnline = async () => {
    console.log('[OfflineSync] Connection restored');
    // Wait a bit for connection to stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await startSync(options);
  };

  const handleOffline = () => {
    console.log('[OfflineSync] Connection lost');
    stopSync();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
