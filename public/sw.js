// Service Worker for Secure File Share PWA
// Implements cache strategies and offline support

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/offline.html',
];

// Install event: Cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('[SW] Failed to cache some assets:', error);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    }).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== API_CACHE &&
            cacheName !== HTML_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event: Implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine cache strategy based on request type
  if (isStaticAsset(url)) {
    // Cache-first strategy for static assets (JS, CSS, images)
    event.respondWith(cacheFirstStrategy(request));
  } else if (isApiCall(url)) {
    // Network-first strategy for API calls
    event.respondWith(networkFirstStrategy(request));
  } else if (isHtmlPage(url)) {
    // Stale-while-revalidate strategy for HTML pages
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // Default: network-first
    event.respondWith(networkFirstStrategy(request));
  }
});

// Cache-first strategy: Use cache, fall back to network
function cacheFirstStrategy(request) {
  return caches.match(request).then((response) => {
    if (response) {
      console.log('[SW] Cache hit:', request.url);
      return response;
    }

    console.log('[SW] Cache miss, fetching from network:', request.url);
    return fetch(request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();
        const cacheName = getCacheNameForUrl(request.url);

        caches.open(cacheName).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        console.log('[SW] Network request failed:', request.url);
        // Return offline fallback for HTML pages
        if (isHtmlPage(new URL(request.url))) {
          return caches.match('/offline.html');
        }
        return new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
  });
}

// Network-first strategy: Try network, fall back to cache
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      // Don't cache non-successful responses
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      // Clone the response
      const responseToCache = response.clone();
      const cacheName = getCacheNameForUrl(request.url);

      caches.open(cacheName).then((cache) => {
        cache.put(request, responseToCache);
      });

      return response;
    })
    .catch(() => {
      console.log('[SW] Network request failed, checking cache:', request.url);
      return caches.match(request).then((response) => {
        if (response) {
          console.log('[SW] Returning cached response:', request.url);
          return response;
        }

        // Return offline fallback
        if (isHtmlPage(new URL(request.url))) {
          return caches.match('/offline.html');
        }

        return new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    });
}

// Stale-while-revalidate strategy: Return cache immediately, update in background
function staleWhileRevalidateStrategy(request) {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request).then((response) => {
      // Don't cache non-successful responses
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      // Clone and cache the response
      const responseToCache = response.clone();
      caches.open(HTML_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });

      return response;
    }).catch(() => {
      console.log('[SW] Background fetch failed:', request.url);
      return cachedResponse;
    });

    // Return cached response immediately, or wait for network
    return cachedResponse || fetchPromise;
  });
}

// Helper: Check if URL is a static asset
function isStaticAsset(url) {
  const pathname = url.pathname;
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot')
  );
}

// Helper: Check if URL is an API call
function isApiCall(url) {
  return url.pathname.startsWith('/api/');
}

// Helper: Check if URL is an HTML page
function isHtmlPage(url) {
  const pathname = url.pathname;
  return (
    pathname === '/' ||
    pathname.endsWith('.html') ||
    (!pathname.includes('.') && !pathname.startsWith('/api/'))
  );
}

// Helper: Get appropriate cache name for URL
function getCacheNameForUrl(url) {
  const urlObj = new URL(url);
  if (isStaticAsset(urlObj)) {
    if (urlObj.pathname.includes('image') || urlObj.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
      return IMAGE_CACHE;
    }
    return STATIC_CACHE;
  }
  if (isApiCall(urlObj)) {
    return API_CACHE;
  }
  return HTML_CACHE;
}

// Message event: Handle update notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting and claiming clients');
    self.skipWaiting();
  }
});
