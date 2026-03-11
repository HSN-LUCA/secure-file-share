/**
 * Tests for Service Worker Registration
 */

import {
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerActive,
  hasUpdatePending,
  getServiceWorkerRegistration,
} from '@/lib/pwa/sw-register';

describe('Service Worker Registration', () => {
  let mockRegistration: Partial<ServiceWorkerRegistration>;
  let mockServiceWorkerContainer: Partial<ServiceWorkerContainer>;
  let originalServiceWorker: any;

  beforeEach(() => {
    // Save original
    originalServiceWorker = navigator.serviceWorker;

    // Mock ServiceWorkerRegistration
    mockRegistration = {
      installing: null,
      waiting: null,
      active: { state: 'activated' } as ServiceWorker,
      scope: '/',
      updateViaCache: 'none',
      update: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(true),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Mock ServiceWorkerContainer
    mockServiceWorkerContainer = {
      register: jest.fn().mockResolvedValue(mockRegistration),
      controller: { state: 'activated' } as ServiceWorker,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorkerContainer,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      writable: true,
      configurable: true,
    });
  });

  describe('registerServiceWorker', () => {
    it('should register service worker successfully', async () => {
      const result = await registerServiceWorker();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      expect(result).toBe(mockRegistration);
    });

    it('should call update callback on update available', async () => {
      const updateCallback = jest.fn();
      await registerServiceWorker(updateCallback);

      // Simulate update found event
      const listeners = (mockRegistration.addEventListener as jest.Mock).mock.calls;
      const updateFoundListener = listeners.find(
        (call) => call[0] === 'updatefound'
      )?.[1];

      expect(updateFoundListener).toBeDefined();
    });

    it('should return null if service worker not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await registerServiceWorker();
      expect(result).toBeNull();
    });

    it('should handle registration errors gracefully', async () => {
      const error = new Error('Registration failed');
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValueOnce(error);

      const result = await registerServiceWorker();
      expect(result).toBeNull();
    });

    it('should set up periodic update checks', async () => {
      jest.useFakeTimers();
      await registerServiceWorker();

      jest.advanceTimersByTime(60000);

      expect(mockRegistration.update).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('unregisterServiceWorker', () => {
    it('should unregister service worker successfully', async () => {
      await registerServiceWorker();
      const result = await unregisterServiceWorker();

      expect(mockRegistration.unregister).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if no registration exists', async () => {
      const result = await unregisterServiceWorker();
      expect(result).toBe(false);
    });

    it('should handle unregister errors', async () => {
      await registerServiceWorker();
      (mockRegistration.unregister as jest.Mock).mockRejectedValueOnce(
        new Error('Unregister failed')
      );

      const result = await unregisterServiceWorker();
      expect(result).toBe(false);
    });
  });

  describe('isServiceWorkerActive', () => {
    it('should return true when service worker is active', async () => {
      await registerServiceWorker();
      expect(isServiceWorkerActive()).toBe(true);
    });

    it('should return false when controller is null', async () => {
      await registerServiceWorker();
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ...mockServiceWorkerContainer,
          controller: null,
        },
        writable: true,
        configurable: true,
      });

      expect(isServiceWorkerActive()).toBe(false);
    });
  });

  describe('hasUpdatePending', () => {
    it('should return true when waiting service worker exists', async () => {
      mockRegistration.waiting = { state: 'installed' } as ServiceWorker;
      await registerServiceWorker();

      expect(hasUpdatePending()).toBe(true);
    });

    it('should return false when no waiting service worker', async () => {
      await registerServiceWorker();
      expect(hasUpdatePending()).toBe(false);
    });

    it('should return false when no registration', () => {
      expect(hasUpdatePending()).toBe(false);
    });
  });

  describe('getServiceWorkerRegistration', () => {
    it('should return registration after registering', async () => {
      await registerServiceWorker();
      const registration = getServiceWorkerRegistration();

      expect(registration).toBe(mockRegistration);
    });
  });
});
