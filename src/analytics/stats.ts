import type { TrackingEvent } from '../types/index.js';
import type { BasicStats, FullAnalytics } from '../types/index.js';
import { nowMs as nowMsUtil } from '../core/session-helpers.js';

/**
 * Compute basic aggregate statistics from a snapshot of stored events and the
 * session manager. Only reads data; never mutates storage.
 */
export function computeStats(
  events: TrackingEvent[],
  sessionManager: import('../core/session-manager.js').SessionManager,
): FullAnalytics {
  const basics = computeBasicStats(events);
  const topPages = computeTopPages(events);
  const eventCounts = computeEventCounts(events);
  // Mark that estimates may appear when idle time or duration relies on session
  // boundaries rather than directly measured interaction spans.
  const includesEstimates = true;
  return { basics, topPages, eventCounts, includesEstimates };
}

function computeBasicStats(events: TrackingEvent[]): BasicStats {
  let totalPageViews = 0;
  let totalSessions = 0;
  let totalCustomEvents = 0;

  for (const ev of events) {
    switch (ev.name) {
      case 'page_view':
        totalPageViews++;
        break;
      case 'session_start':
        totalSessions++;
        break;
      default:
        if (ev.name !== 'user_idle' && ev.name !== 'user_active') {
          totalCustomEvents++;
        }
        break;
    }
  }

  const totalEvents = totalPageViews + totalSessions + totalCustomEvents;
  const avgDuration = estimateAverageSessionDurationMs(events);

  return {
    totalPageViews,
    totalSessions,
    totalEvents,
    totalActiveTimeMs: estimateActiveTimeMs(events),
    totalIdleTimeMs: estimateIdleTimeMs(events, avgDuration),
    averageSessionDurationMs: avgDuration,
  };
}

function computeTopPages(events: TrackingEvent[]): import('../types/index.js').PageVisitStat[] {
  const map = new Map<string, number>();
  for (const ev of events) {
    if (ev.name === 'page_view' && 'properties' in ev && ev.properties) {
      const url = String((ev.properties as Record<string, unknown>).url ?? '');
      if (url) map.set(url, (map.get(url) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([url, count]) => ({ url, count }));
}

function computeEventCounts(events: TrackingEvent[]): import('../types/index.js').EventCountStat[] {
  const map = new Map<string, number>();
  for (const ev of events) {
    map.set(ev.name, (map.get(ev.name) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([eventName, count]) => ({ eventName, count }));
}

/** Approximate active time by counting non-idle/non-session-start events weighted by inactivity timeout */
function estimateActiveTimeMs(events: TrackingEvent[]): number {
  const sample = events.filter(e => e.name !== 'user_idle' && e.name !== 'session_start');
  if (sample.length === 0) return 0;
  // Heuristic: assume each tracked action represents ~30 seconds of active engagement.
  const msPerSample = 30_000;
  return sample.length * msPerSample;
}

/** Approximate idle span using session start events and total event window size */
function estimateIdleTimeMs(events: TrackingEvent[], avgDurationMs: number): number {
  const starts = events.filter(e => e.name === 'session_start');
  if (starts.length === 0 || avgDurationMs <= 0) return 0;
  return starts.length * avgDurationMs * 0.25;
}

function estimateAverageSessionDurationMs(events: TrackingEvent[]): number {
  const starts = events.filter(e => e.name === 'session_start');
  if (starts.length === 0) return 0;
  const windowMs = Math.max(nowMsUtil() - starts[0].timestamp, 60_000);
  return Math.round(windowMs / starts.length);
}
