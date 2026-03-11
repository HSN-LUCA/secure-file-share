/**
 * Core Web Vitals Monitoring
 * Tracks and reports Core Web Vitals metrics
 */

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface WebVitalsReport extends WebVitalsMetrics {
  timestamp: number;
  url: string;
  userAgent: string;
}

const metrics: WebVitalsMetrics = {};

/**
 * Initialize Web Vitals monitoring
 */
export function initializeWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Use PerformanceObserver to track metrics
  if ('PerformanceObserver' in window) {
    // Track Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        console.log('[WebVitals] LCP:', metrics.lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('[WebVitals] LCP monitoring not supported:', error);
    }

    // Track First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          metrics.fid = (entry as any).processingDuration;
          console.log('[WebVitals] FID:', metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('[WebVitals] FID monitoring not supported:', error);
    }

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            metrics.cls = clsValue;
            console.log('[WebVitals] CLS:', metrics.cls);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('[WebVitals] CLS monitoring not supported:', error);
    }

    // Track First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          metrics.fcp = fcpEntry.startTime;
          console.log('[WebVitals] FCP:', metrics.fcp);
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('[WebVitals] FCP monitoring not supported:', error);
    }
  }

  // Track Time to First Byte (TTFB)
  if ('performance' in window && 'timing' in window.performance) {
    const perfTiming = window.performance.timing;
    const ttfb = perfTiming.responseStart - perfTiming.fetchStart;
    metrics.ttfb = ttfb;
    console.log('[WebVitals] TTFB:', metrics.ttfb);
  }
}

/**
 * Get current Web Vitals metrics
 */
export function getWebVitalsMetrics(): WebVitalsMetrics {
  return { ...metrics };
}

/**
 * Send Web Vitals to analytics endpoint
 */
export async function reportWebVitals(endpoint: string = '/api/analytics/vitals'): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const report: WebVitalsReport = {
      ...metrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Use sendBeacon for reliability
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(endpoint, JSON.stringify(report));
    } else {
      // Fallback to fetch
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true,
      });
    }

    console.log('[WebVitals] Metrics reported:', report);
  } catch (error) {
    console.error('[WebVitals] Error reporting metrics:', error);
  }
}

/**
 * Check if metrics meet good thresholds
 */
export function checkWebVitalsThresholds(): {
  lcp: 'good' | 'needs-improvement' | 'poor';
  fid: 'good' | 'needs-improvement' | 'poor';
  cls: 'good' | 'needs-improvement' | 'poor';
} {
  return {
    lcp: metrics.lcp ? (metrics.lcp <= 2500 ? 'good' : metrics.lcp <= 4000 ? 'needs-improvement' : 'poor') : 'good',
    fid: metrics.fid ? (metrics.fid <= 100 ? 'good' : metrics.fid <= 300 ? 'needs-improvement' : 'poor') : 'good',
    cls: metrics.cls ? (metrics.cls <= 0.1 ? 'good' : metrics.cls <= 0.25 ? 'needs-improvement' : 'poor') : 'good',
  };
}
