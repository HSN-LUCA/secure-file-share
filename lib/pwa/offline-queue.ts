/**
 * Offline Upload Queue
 * Manages queued uploads when offline using IndexedDB
 */

export interface QueuedUpload {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  timestamp: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface DownloadHistoryItem {
  id: string;
  shareCode: string;
  fileName: string;
  fileSize: number;
  downloadedAt: number;
  status: 'completed' | 'failed';
}

const DB_NAME = 'secure-file-share';
const UPLOAD_QUEUE_STORE = 'upload-queue';
const DOWNLOAD_HISTORY_STORE = 'download-history';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initializeOfflineDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    throw new Error('IndexedDB not supported');
  }

  if (db) {
    return db;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineQueue] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('[OfflineQueue] IndexedDB initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create upload queue store
      if (!database.objectStoreNames.contains(UPLOAD_QUEUE_STORE)) {
        const uploadStore = database.createObjectStore(UPLOAD_QUEUE_STORE, {
          keyPath: 'id',
        });
        uploadStore.createIndex('status', 'status', { unique: false });
        uploadStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('[OfflineQueue] Created upload queue store');
      }

      // Create download history store
      if (!database.objectStoreNames.contains(DOWNLOAD_HISTORY_STORE)) {
        const downloadStore = database.createObjectStore(DOWNLOAD_HISTORY_STORE, {
          keyPath: 'id',
        });
        downloadStore.createIndex('shareCode', 'shareCode', { unique: false });
        downloadStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        console.log('[OfflineQueue] Created download history store');
      }
    };
  });
}

/**
 * Add file to upload queue
 */
export async function addToUploadQueue(file: File): Promise<QueuedUpload> {
  const database = await initializeOfflineDB();

  const queuedUpload: QueuedUpload = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    file,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
    maxRetries: 3,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([UPLOAD_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(UPLOAD_QUEUE_STORE);
    const request = store.add(queuedUpload);

    request.onerror = () => {
      console.error('[OfflineQueue] Failed to add to queue:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[OfflineQueue] Added to upload queue:', queuedUpload.id);
      resolve(queuedUpload);
    };
  });
}

/**
 * Get all queued uploads
 */
export async function getQueuedUploads(
  status?: QueuedUpload['status']
): Promise<QueuedUpload[]> {
  const database = await initializeOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([UPLOAD_QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(UPLOAD_QUEUE_STORE);

    let request;
    if (status) {
      const index = store.index('status');
      request = index.getAll(status);
    } else {
      request = store.getAll();
    }

    request.onerror = () => {
      console.error('[OfflineQueue] Failed to get queued uploads:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const uploads = request.result as QueuedUpload[];
      console.log(`[OfflineQueue] Retrieved ${uploads.length} queued uploads`);
      resolve(uploads);
    };
  });
}

/**
 * Update queued upload status
 */
export async function updateQueuedUploadStatus(
  id: string,
  status: QueuedUpload['status'],
  error?: string
): Promise<void> {
  const database = await initializeOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([UPLOAD_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(UPLOAD_QUEUE_STORE);
    const getRequest = store.get(id);

    getRequest.onerror = () => {
      console.error('[OfflineQueue] Failed to get upload:', getRequest.error);
      reject(getRequest.error);
    };

    getRequest.onsuccess = () => {
      const upload = getRequest.result as QueuedUpload;
      if (!upload) {
        reject(new Error('Upload not found'));
        return;
      }

      upload.status = status;
      if (error) {
        upload.error = error;
        upload.retryCount += 1;
      }

      const updateRequest = store.put(upload);

      updateRequest.onerror = () => {
        console.error('[OfflineQueue] Failed to update upload:', updateRequest.error);
        reject(updateRequest.error);
      };

      updateRequest.onsuccess = () => {
        console.log('[OfflineQueue] Updated upload status:', id, status);
        resolve();
      };
    };
  });
}

/**
 * Remove queued upload
 */
export async function removeFromUploadQueue(id: string): Promise<void> {
  const database = await initializeOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([UPLOAD_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(UPLOAD_QUEUE_STORE);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('[OfflineQueue] Failed to remove from queue:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[OfflineQueue] Removed from upload queue:', id);
      resolve();
    };
  });
}

/**
 * Add to download history
 */
export async function addToDownloadHistory(
  shareCode: string,
  fileName: string,
  fileSize: number
): Promise<DownloadHistoryItem> {
  const database = await initializeOfflineDB();

  const historyItem: DownloadHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    shareCode,
    fileName,
    fileSize,
    downloadedAt: Date.now(),
    status: 'completed',
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOWNLOAD_HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(DOWNLOAD_HISTORY_STORE);
    const request = store.add(historyItem);

    request.onerror = () => {
      console.error('[OfflineQueue] Failed to add to download history:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[OfflineQueue] Added to download history:', historyItem.id);
      resolve(historyItem);
    };
  });
}

/**
 * Get download history
 */
export async function getDownloadHistory(limit: number = 50): Promise<DownloadHistoryItem[]> {
  const database = await initializeOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOWNLOAD_HISTORY_STORE], 'readonly');
    const store = transaction.objectStore(DOWNLOAD_HISTORY_STORE);
    const index = store.index('downloadedAt');
    const request = index.openCursor(null, 'prev');

    const items: DownloadHistoryItem[] = [];

    request.onerror = () => {
      console.error('[OfflineQueue] Failed to get download history:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && items.length < limit) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        console.log(`[OfflineQueue] Retrieved ${items.length} download history items`);
        resolve(items);
      }
    };
  });
}

/**
 * Clear download history
 */
export async function clearDownloadHistory(): Promise<void> {
  const database = await initializeOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOWNLOAD_HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(DOWNLOAD_HISTORY_STORE);
    const request = store.clear();

    request.onerror = () => {
      console.error('[OfflineQueue] Failed to clear download history:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[OfflineQueue] Download history cleared');
      resolve();
    };
  });
}

/**
 * Get pending uploads count
 */
export async function getPendingUploadsCount(): Promise<number> {
  const uploads = await getQueuedUploads('pending');
  return uploads.length;
}

/**
 * Check if offline
 */
export function isOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return !navigator.onLine;
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.onLine;
}
