import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IdleTracker } from '../../src/tracking/idle-tracker.js';
import { EventManager } from '../../src/core/event-manager.js';
import { SessionManager } from '../../src/core/session-manager.js';
import { MemoryStorage } from '../../src/storage/memory-storage.js';

describe('IdleTracker', () => {
  const config = {
    appId: 'test',
    inactivityTimeout: 1000,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(globalThis, 'document', {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        get hidden() { return false; },
      },
      writable: false,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes in active state', () => {
    const storage = new MemoryStorage();
    const sm = new SessionManager(config as any);
    const em = new EventManager(config as any, storage, sm);
    const it = new IdleTracker(config as any, em, sm);

    it.start();
    expect(it.getState()).toBe('active');
  });

  it('transitions to idle after timeout', async () => {
    const storage = new MemoryStorage();
    const sm = new SessionManager(config as any);
    const em = new EventManager(config as any, storage, sm);
    const it = new IdleTracker(config as any, em, sm);

    it.start();
    // Trigger start activity to schedule idle timer
    (it as any).onUserActivity();
    vi.advanceTimersByTime(1500);
    expect(it.getState()).toBe('idle');
    const events = await storage.retrieve();
    expect(events.some(e => e.name === 'user_idle')).toBe(true);
  });
});
