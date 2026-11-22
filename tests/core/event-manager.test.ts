import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventManager } from '../../src/core/event-manager.js';
import { SessionManager } from '../../src/core/session-manager.js';
import { MemoryStorage } from '../../src/storage/memory-storage.js';
import type { TrackerConfig } from '../../src/types/index.js';

describe('EventManager', () => {
  const onEventMock = vi.fn();
  const config: Required<TrackerConfig> = {
    appId: 'test-app',
    sessionTimeout: 30 * 60 * 1000,
    inactivityTimeout: 60 * 1000,
    trackPageViews: true,
    storage: 'memory',
    maxEvents: 10000,
    retentionMs: 7 * 24 * 60 * 60 * 1000,
    trackNavigation: true,
    onEvent: onEventMock,
  };
  const storage = new MemoryStorage();
  const sm = new SessionManager(config);
  let em: EventManager;

  beforeEach(() => {
    storage.clear();
    onEventMock.mockClear();
    em = new EventManager(config, storage, sm);
  });

  it('emits valid events', async () => {
    const event = {
      id: 'test-id-1',
      name: 'custom_event',
      timestamp: Date.now(),
      appId: 'test-app',
      sessionId: sm.currentSession.id,
      properties: { key: 'value' },
    };
    em.emit(event);
    const events = await em.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('custom_event');
    expect(onEventMock).toHaveBeenCalled();
  });

  it('rejects invalid events', () => {
    em.emit({ id: 'x', name: '', timestamp: Date.now(), appId: 't', sessionId: 's' } as any);
    expect(onEventMock).not.toHaveBeenCalled();
  });

  it('prevents duplicate event IDs', async () => {
    const event = { id: 'dup', name: 'evt', timestamp: Date.now(), appId: 'a', sessionId: 's' };
    em.emit(event);
    em.emit(event); // duplicate
    const events = await em.getEvents();
    expect(events).toHaveLength(1);
  });

  it('clears events and known IDs', async () => {
    await em.emit({ id: 'del', name: 'evt', timestamp: Date.now(), appId: 'a', sessionId: 's' });
    await em.clearEvents();
    const events = await em.getEvents();
    expect(events).toHaveLength(0);
  });
});
