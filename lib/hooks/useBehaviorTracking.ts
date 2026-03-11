/**
 * useBehaviorTracking Hook
 * Tracks user behavior including sessions, page views, clicks, and flows
 * Privacy-respecting and GDPR-compliant
 */

import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

interface BehaviorTrackingConfig {
  enabled?: boolean;
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackSessions?: boolean;
  userId?: string;
  country?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useBehaviorTracking(config: BehaviorTrackingConfig = {}) {
  const {
    enabled = true,
    trackPageViews = true,
    trackClicks = true,
    trackSessions = true,
    userId,
    country,
  } = config;

  const sessionRef = useRef<{
    sessionId: string;
    sessionToken: string;
    startTime: number;
    currentPageViewId?: string;
  } | null>(null);

  const flowRef = useRef<{
    flowId: string;
    flowName: string;
  } | null>(null);

  // ========================================================================
  // INITIALIZE SESSION
  // ========================================================================

  const initializeSession = useCallback(async () => {
    if (!enabled || !trackSessions) return;

    try {
      const sessionToken = uuidv4();

      const response = await fetch('/api/behavior-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'session_start',
          sessionToken,
          userId: userId || null,
          country: country || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionRef.current = {
          sessionId: data.data.sessionId,
          sessionToken,
          startTime: Date.now(),
        };
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }, [enabled, trackSessions, userId, country]);

  // ========================================================================
  // END SESSION
  // ========================================================================

  const endSession = useCallback(async () => {
    if (!enabled || !trackSessions || !sessionRef.current) return;

    try {
      await fetch('/api/behavior-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'session_end',
          sessionId: sessionRef.current.sessionId,
        }),
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [enabled, trackSessions]);

  // ========================================================================
  // TRACK PAGE VIEW
  // ========================================================================

  const trackPageView = useCallback(
    async (pagePath: string, pageTitle?: string, referrer?: string) => {
      if (!enabled || !trackPageViews || !sessionRef.current) return;

      try {
        const response = await fetch('/api/behavior-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'page_view',
            sessionId: sessionRef.current.sessionId,
            userId: userId || null,
            pagePath,
            pageTitle: pageTitle || document.title,
            referrer: referrer || document.referrer,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          sessionRef.current.currentPageViewId = data.data.pageViewId;
        }
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    },
    [enabled, trackPageViews, userId]
  );

  // ========================================================================
  // TRACK CLICK
  // ========================================================================

  const trackClick = useCallback(
    async (element: HTMLElement, pagePath?: string) => {
      if (!enabled || !trackClicks || !sessionRef.current) return;

      try {
        await fetch('/api/behavior-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'click',
            sessionId: sessionRef.current.sessionId,
            userId: userId || null,
            elementId: element.id || null,
            elementClass: element.className || null,
            elementText: element.textContent?.substring(0, 100) || null,
            pagePath: pagePath || window.location.pathname,
          }),
        });
      } catch (error) {
        console.error('Failed to track click:', error);
      }
    },
    [enabled, trackClicks, userId]
  );

  // ========================================================================
  // START FLOW
  // ========================================================================

  const startFlow = useCallback(
    async (flowName: string, stepName: string, stepData?: Record<string, any>) => {
      if (!enabled || !sessionRef.current) return;

      try {
        const response = await fetch('/api/behavior-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'flow_start',
            sessionId: sessionRef.current.sessionId,
            userId: userId || null,
            flowName,
            stepName,
            stepData: stepData || null,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          flowRef.current = {
            flowId: data.data.flowId,
            flowName,
          };
          return data.data.flowId;
        }
      } catch (error) {
        console.error('Failed to start flow:', error);
      }
    },
    [enabled, userId]
  );

  // ========================================================================
  // COMPLETE FLOW
  // ========================================================================

  const completeFlow = useCallback(async () => {
    if (!enabled || !flowRef.current) return;

    try {
      await fetch('/api/behavior-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flow_complete',
          flowId: flowRef.current.flowId,
        }),
      });

      flowRef.current = null;
    } catch (error) {
      console.error('Failed to complete flow:', error);
    }
  }, [enabled]);

  // ========================================================================
  // SETUP GLOBAL CLICK TRACKING
  // ========================================================================

  useEffect(() => {
    if (!enabled || !trackClicks) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      trackClick(target);
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [enabled, trackClicks, trackClick]);

  // ========================================================================
  // SETUP SESSION LIFECYCLE
  // ========================================================================

  useEffect(() => {
    if (!enabled) return;

    // Initialize session on mount
    initializeSession();

    // Track page view on mount
    if (trackPageViews) {
      trackPageView(window.location.pathname);
    }

    // End session on unmount
    return () => {
      endSession();
    };
  }, [enabled, initializeSession, endSession, trackPageViews, trackPageView]);

  // ========================================================================
  // SETUP PAGE VISIBILITY TRACKING
  // ========================================================================

  useEffect(() => {
    if (!enabled || !trackPageViews) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        endSession();
      } else {
        initializeSession();
        trackPageView(window.location.pathname);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, trackPageViews, endSession, initializeSession, trackPageView]);

  return {
    trackPageView,
    trackClick,
    startFlow,
    completeFlow,
    sessionId: sessionRef.current?.sessionId,
  };
}
