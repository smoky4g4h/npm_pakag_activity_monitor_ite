import { describe, it, expect } from 'vitest';
import { computeStats } from '../../src/analytics/stats.js';
import { SessionManager } from '../../src/core/session-manager.js';
import type { TrackingEvent } from '../../src/types/index.js';

describe('computeStats', () => {
  const config = { appId: 'test' };
  const sm = new SessionManager(config as any);

  const events: TrackingEvent[] = [
    { id: '1', name: 'page_view', timestamp: Date.now() - 100000, appId: 'test', sessionId: sm.currentSession.id, properties: { url: '/home', title: 'Home' } },
    { id: '2', name: 'page_view', timestamp: Date.now() - 90000, appId: 'test', sessionId: sm.currentSession.id, properties: { url: '/about', title: 'About' } },
    { id: '3', name: 'session_start', timestamp: Date.now() - 200000, appId: 'test', sessionId: sm.currentSession.id },
    { id: '4', name: 'task_created', timestamp: Date.now() - 80000, appId: 'test', sessionId: sm.currentSession.id, properties: { task: 'Buy milk' } },
  ];

  it('computes page view count', () => {
    const stats = computeStats(events, sm);
    expect(stats.basics.totalPageViews).toBe(2);
  });

  it('computes event counts', () => {
    const stats = computeStats(events, sm);
    const tc = stats.eventCounts.find(e => e.eventName === 'task_created');
    expect(tc?.count).toBe(1);
  });

  it('includes estimates flag', () => {
    const stats = computeStats(events, sm);
    expect(stats.includesEstimates).toBe(true);
  });
});
