import { describe, it, expect } from 'vitest';
import { ActivityTracker } from '../../src/index.js';
import type { TrackingEvent } from '../../src/types/index.js';

describe('ActivityTracker', () => {
  const config = {
    appId: 'demo-app',
    sessionTimeout: 30 * 60 * 1000,
    inactivityTimeout: 60 * 1000,
    trackPageViews: true,
    storage: 'memory' as const,
  };

  it('initializes without errors', () => {
    const tracker = new ActivityTracker(config);
    expect(tracker).toBeDefined();
  });

  it('tracks custom events', async () => {
    const tracker = new ActivityTracker(config);
    tracker.track('task_created', { priority: 'high' });
    const events = await tracker.getEvents();
    expect(events.some(e => e.name === 'task_created')).toBe(true);
  });

  it('returns user state', () => {
    const tracker = new ActivityTracker(config);
    expect(['active', 'idle']).toContain(tracker.getUserState());
  });
});
