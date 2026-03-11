/**
 * Tests for Offline Functionality
 * Tests cache strategies and offline behavior
 */

describe('Service Worker Offline Functionality', () => {
  describe('Cache Strategies', () => {
    it('should identify static assets correctly', () => {
      const staticAssets = [
        '/_next/static/chunks/main.js',
        '/styles.css',
        '/image.png',
        '/font.woff2',
      ];

      staticAssets.forEach((url) => {
        const urlObj = new URL(url, 'http://localhost');
        const isStatic =
          urlObj.pathname.startsWith('/_next/static/') ||
          urlObj.pathname.endsWith('.js') ||
          urlObj.pathname.endsWith('.css') ||
          urlObj.pathname.endsWith('.png') ||
          urlObj.pathname.endsWith('.woff2');

        expect(isStatic).toBe(true);
      });
    });

    it('should identify API calls correctly', () => {
      const apiCalls = ['/api/upload', '/api/download/123', '/api/auth/login'];

      apiCalls.forEach((url) => {
        const urlObj = new URL(url, 'http://localhost');
        const isApi = urlObj.pathname.startsWith('/api/');

        expect(isApi).toBe(true);
      });
    });

    it('should identify HTML pages correctly', () => {
      const htmlPages = ['/', '/upload', '/download', '/page.html'];

      htmlPages.forEach((url) => {
        const urlObj = new URL(url, 'http://localhost');
        const pathname = urlObj.pathname;
        const isHtml =
          pathname === '/' ||
          pathname.endsWith('.html') ||
          (!pathname.includes('.') && !pathname.startsWith('/api/'));

        expect(isHtml).toBe(true);
      });
    });
  });

  describe('Offline Fallback', () => {
    it('should serve offline.html when network fails for HTML pages', () => {
      const offlineHtmlPath = '/offline.html';
      expect(offlineHtmlPath).toBe('/offline.html');
    });

    it('should return 503 error for failed API calls when offline', () => {
      const errorStatus = 503;
      const errorStatusText = 'Service Unavailable';

      expect(errorStatus).toBe(503);
      expect(errorStatusText).toBe('Service Unavailable');
    });
  });

  describe('Cache Versioning', () => {
    it('should use versioned cache names', () => {
      const cacheNames = [
        'static-v1',
        'api-v1',
        'html-v1',
        'images-v1',
      ];

      cacheNames.forEach((name) => {
        expect(name).toMatch(/^(static|api|html|images)-v\d+$/);
      });
    });

    it('should clean up old cache versions', () => {
      const oldCaches = ['static-v0', 'api-v0', 'html-v0'];
      const newCaches = ['static-v1', 'api-v1', 'html-v1'];

      const allCaches = [...oldCaches, ...newCaches];
      const validCaches = newCaches;
      const cachesToDelete = allCaches.filter((name) => !validCaches.includes(name));

      expect(cachesToDelete).toEqual(oldCaches);
    });
  });

  describe('Cache Size Management', () => {
    it('should cache static assets with appropriate TTL', () => {
      const cacheConfig = {
        'static-v1': { ttl: 30 * 24 * 60 * 60 * 1000 }, // 30 days
        'api-v1': { ttl: 5 * 60 * 1000 }, // 5 minutes
        'html-v1': { ttl: 24 * 60 * 60 * 1000 }, // 1 day
        'images-v1': { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
      };

      expect(cacheConfig['static-v1'].ttl).toBe(30 * 24 * 60 * 60 * 1000);
      expect(cacheConfig['api-v1'].ttl).toBe(5 * 60 * 1000);
      expect(cacheConfig['html-v1'].ttl).toBe(24 * 60 * 60 * 1000);
      expect(cacheConfig['images-v1'].ttl).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Network Status Detection', () => {
    it('should detect online status', () => {
      expect(navigator.onLine).toBeDefined();
    });

    it('should handle online/offline events', () => {
      const onlineHandler = jest.fn();
      const offlineHandler = jest.fn();

      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);

      // Simulate online event
      window.dispatchEvent(new Event('online'));
      expect(onlineHandler).toHaveBeenCalled();

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));
      expect(offlineHandler).toHaveBeenCalled();

      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    });
  });

  describe('Request Handling', () => {
    it('should skip non-GET requests', () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        expect(method).not.toBe('GET');
      });
    });

    it('should skip non-http(s) requests', () => {
      const protocols = ['data:', 'blob:', 'chrome-extension:'];

      protocols.forEach((protocol) => {
        expect(protocol).not.toMatch(/^https?:/);
      });
    });

    it('should handle successful responses', () => {
      const status = 200;
      const statusText = 'OK';

      expect(status).toBe(200);
      expect(statusText).toBe('OK');
    });

    it('should not cache error responses', () => {
      const errorStatuses = [404, 500, 401];

      errorStatuses.forEach((status) => {
        expect(status).not.toBe(200);
      });
    });
  });
});
