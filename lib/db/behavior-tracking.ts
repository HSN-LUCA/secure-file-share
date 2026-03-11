/**
 * User Behavior Tracking Database Functions
 * Handles tracking of user sessions, page views, clicks, and user flows
 */

import { getClient } from './pool';
import { QueryResult } from './queries';

// ============================================================================
// SESSION TRACKING
// ============================================================================

/**
 * Create a new user session
 */
export async function createUserSession(
  userId: string | null,
  sessionToken: string,
  ipAddress: string,
  userAgent: string,
  country?: string
): Promise<QueryResult<{ sessionId: string }>> {
  try {
    const { data, error } = await getClient()
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        country: country || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      data: { sessionId: data?.id || '' },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<QueryResult<null>> {
  try {
    const { error } = await getClient()
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * End a user session
 */
export async function endUserSession(sessionId: string): Promise<QueryResult<null>> {
  try {
    const { data: sessionData, error: fetchError } = await getClient()
      .from('user_sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;

    const startedAt = new Date(sessionData.started_at);
    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    const { error } = await getClient()
      .from('user_sessions')
      .update({
        is_active: false,
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', sessionId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// PAGE VIEW TRACKING
// ============================================================================

/**
 * Track a page view
 */
export async function trackPageView(
  userId: string | null,
  sessionId: string,
  pagePath: string,
  pageTitle?: string,
  referrer?: string
): Promise<QueryResult<{ pageViewId: string }>> {
  try {
    const { data, error } = await getClient()
      .from('page_views')
      .insert({
        user_id: userId,
        session_id: sessionId,
        page_path: pagePath,
        page_title: pageTitle || null,
        referrer: referrer || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      data: { pageViewId: data?.id || '' },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update page view with time spent
 */
export async function updatePageViewTime(
  pageViewId: string,
  timeOnPageSeconds: number
): Promise<QueryResult<null>> {
  try {
    const { error } = await getClient()
      .from('page_views')
      .update({ time_on_page_seconds: timeOnPageSeconds })
      .eq('id', pageViewId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// CLICK EVENT TRACKING
// ============================================================================

/**
 * Track a click event
 */
export async function trackClickEvent(
  userId: string | null,
  sessionId: string,
  elementId: string | null,
  elementClass: string | null,
  elementText: string | null,
  pagePath: string
): Promise<QueryResult<{ clickEventId: string }>> {
  try {
    const { data, error } = await getClient()
      .from('click_events')
      .insert({
        user_id: userId,
        session_id: sessionId,
        element_id: elementId,
        element_class: elementClass,
        element_text: elementText,
        page_path: pagePath,
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      data: { clickEventId: data?.id || '' },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// USER FLOW TRACKING
// ============================================================================

/**
 * Start a user flow
 */
export async function startUserFlow(
  userId: string | null,
  sessionId: string,
  flowName: string,
  stepName: string,
  stepData?: Record<string, any>
): Promise<QueryResult<{ flowId: string }>> {
  try {
    const { data, error } = await getClient()
      .from('user_flows')
      .insert({
        user_id: userId,
        session_id: sessionId,
        flow_name: flowName,
        flow_step: 1,
        step_name: stepName,
        step_data: stepData || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      data: { flowId: data?.id || '' },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Add a step to a user flow
 */
export async function addFlowStep(
  flowId: string,
  stepName: string,
  stepData?: Record<string, any>
): Promise<QueryResult<null>> {
  try {
    // Get current flow to find next step number
    const { data: flowData, error: fetchError } = await getClient()
      .from('user_flows')
      .select('flow_step')
      .eq('id', flowId)
      .order('flow_step', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) throw fetchError;

    const nextStep = (flowData?.flow_step || 0) + 1;

    const { error } = await getClient()
      .from('user_flows')
      .insert({
        id: flowId,
        flow_step: nextStep,
        step_name: stepName,
        step_data: stepData || null,
      });

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Complete a user flow
 */
export async function completeUserFlow(flowId: string): Promise<QueryResult<null>> {
  try {
    const { error } = await getClient()
      .from('user_flows')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', flowId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// BEHAVIOR ANALYTICS QUERIES
// ============================================================================

/**
 * Get user behavior summary
 */
export async function getUserBehaviorSummary(
  userId: string,
  fromDate?: string,
  toDate?: string
): Promise<
  QueryResult<{
    totalSessions: number;
    totalPageViews: number;
    totalClicks: number;
    averageSessionDuration: number;
    averageTimeOnPage: number;
    topPages: Array<{ page: string; views: number }>;
    topFlows: Array<{ flow: string; count: number; completionRate: number }>;
  }>
> {
  try {
    let sessionsQuery = getClient()
      .from('user_sessions')
      .select('id, duration_seconds')
      .eq('user_id', userId);

    if (fromDate) sessionsQuery = sessionsQuery.gte('started_at', fromDate);
    if (toDate) sessionsQuery = sessionsQuery.lte('started_at', toDate);

    const { data: sessions, error: sessionsError } = await sessionsQuery;
    if (sessionsError) throw sessionsError;

    let pageViewsQuery = getClient()
      .from('page_views')
      .select('page_path, time_on_page_seconds')
      .eq('user_id', userId);

    if (fromDate) pageViewsQuery = pageViewsQuery.gte('viewed_at', fromDate);
    if (toDate) pageViewsQuery = pageViewsQuery.lte('viewed_at', toDate);

    const { data: pageViews, error: pageViewsError } = await pageViewsQuery;
    if (pageViewsError) throw pageViewsError;

    let clicksQuery = getClient()
      .from('click_events')
      .select('id')
      .eq('user_id', userId);

    if (fromDate) clicksQuery = clicksQuery.gte('clicked_at', fromDate);
    if (toDate) clicksQuery = clicksQuery.lte('clicked_at', toDate);

    const { data: clicks, error: clicksError } = await clicksQuery;
    if (clicksError) throw clicksError;

    let flowsQuery = getClient()
      .from('user_flows')
      .select('flow_name, completed')
      .eq('user_id', userId);

    if (fromDate) flowsQuery = flowsQuery.gte('started_at', fromDate);
    if (toDate) flowsQuery = flowsQuery.lte('started_at', toDate);

    const { data: flows, error: flowsError } = await flowsQuery;
    if (flowsError) throw flowsError;

    // Calculate aggregates
    const totalSessions = sessions?.length || 0;
    const totalPageViews = pageViews?.length || 0;
    const totalClicks = clicks?.length || 0;

    const averageSessionDuration =
      totalSessions > 0
        ? Math.round(
            ((sessions || []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0) /
              totalSessions) *
              100
          ) / 100
        : 0;

    const averageTimeOnPage =
      totalPageViews > 0
        ? Math.round(
            ((pageViews || []).reduce((sum, p) => sum + (p.time_on_page_seconds || 0), 0) /
              totalPageViews) *
              100
          ) / 100
        : 0;

    // Top pages
    const pageMap: Record<string, number> = {};
    (pageViews || []).forEach((pv) => {
      pageMap[pv.page_path] = (pageMap[pv.page_path] || 0) + 1;
    });

    const topPages = Object.entries(pageMap)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Top flows
    const flowMap: Record<string, { count: number; completed: number }> = {};
    (flows || []).forEach((f) => {
      if (!flowMap[f.flow_name]) {
        flowMap[f.flow_name] = { count: 0, completed: 0 };
      }
      flowMap[f.flow_name].count += 1;
      if (f.completed) flowMap[f.flow_name].completed += 1;
    });

    const topFlows = Object.entries(flowMap)
      .map(([flow, data]) => ({
        flow,
        count: data.count,
        completionRate: data.count > 0 ? (data.completed / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      data: {
        totalSessions,
        totalPageViews,
        totalClicks,
        averageSessionDuration,
        averageTimeOnPage,
        topPages,
        topFlows,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get user flow completion rates
 */
export async function getFlowCompletionRates(
  fromDate?: string,
  toDate?: string
): Promise<
  QueryResult<
    Array<{
      flowName: string;
      totalFlows: number;
      completedFlows: number;
      completionRate: number;
    }>
  >
> {
  try {
    let query = getClient().from('user_flows').select('flow_name, completed');

    if (fromDate) query = query.gte('started_at', fromDate);
    if (toDate) query = query.lte('started_at', toDate);

    const { data, error } = await query;

    if (error) throw error;

    const flowMap: Record<string, { total: number; completed: number }> = {};

    (data || []).forEach((flow) => {
      if (!flowMap[flow.flow_name]) {
        flowMap[flow.flow_name] = { total: 0, completed: 0 };
      }
      flowMap[flow.flow_name].total += 1;
      if (flow.completed) flowMap[flow.flow_name].completed += 1;
    });

    const result = Object.entries(flowMap).map(([flowName, stats]) => ({
      flowName,
      totalFlows: stats.total,
      completedFlows: stats.completed,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
