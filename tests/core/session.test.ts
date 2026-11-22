import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager } from '../../src/core/session-manager.js';
import { TrackerConfig } from '../../src/types/index.js';

describe('SessionManager', () => {
  const config: TrackerConfig = { appId: 'test-app' };

  it('initializes a session', () => {
    const sm = new SessionManager(config);
    expect(sm.currentSession.id).toBeDefined();
  });

  it('tracks activity', () => {
    const sm = new SessionManager(config);
    const start = sm.currentSession.lastActivityTime;
    sm.recordActivity(start + 1000);
    expect(sm.currentSession.lastActivityTime).toBe(start + 1000);
  });
});
