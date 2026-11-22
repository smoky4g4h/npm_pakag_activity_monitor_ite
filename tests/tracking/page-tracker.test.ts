import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PageTracker } from '../../src/tracking/page-tracker.js';
import { EventManager } from '../../src/core/event-manager.js';
import { SessionManager } from '../../src/core/session-manager.js';
import { MemoryStorage } from '../../src/storage/memory-storage.js';

describe('PageTracker', () => {
  const config = {
    appId: 'test',
    trackPageViews: true,
    trackNavigation: true,
    onEvent: vi.fn(),
  };

  // Mock global history and location
  const originalHistory = globalThis.history;
  const originalLocation = globalThis.location;

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).history = {
      pushState: vi.fn(),
      replaceState: vi.fn(),
    };
    (globalThis as any).location = {
      href: 'http://localhost/',
    };
    (globalThis as any).window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (globalThis as any).document = {
      title: 'Test Title',
    };
  });

  afterEach(() => {
    globalThis.history = originalHistory;
    (globalThis as any).location = originalLocation;
  });

  it('emits page_view on start', async () => {
    const storage = new MemoryStorage();
    const sm = new SessionManager(config as any);
    const em = new EventManager(config as any, storage, sm);
    const pt = new PageTracker(config as any, em, sm);

    pt.start();
    const events = await storage.retrieve();
    expect(events).toHaveLength(1);
  });

  it('tracks manual page views', async () => {
    const storage = new MemoryStorage();
    const sm = new SessionManager(config as any);
    const em = new EventManager(config as any, storage, sm);
    const pt = new PageTracker(config as any, em, sm);

    await pt.trackManual('/new-page', 'New Title');
    const events = await storage.retrieve();
    expect(events.some(e => e.name === 'page_view' && (e as any).properties.url.includes('/new-page'))).toBe(true);
  });
});
