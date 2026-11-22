import { describe, it, expect, vi, afterEach } from 'vitest';
import { LocalStorageAdapter } from '../../src/storage/local-storage.js';

describe('LocalStorageAdapter', () => {
  // Mock localStorage
  const localStorageMock = (function() {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value.toString(); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; }
    };
  })();

  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

  const adapter = new LocalStorageAdapter();

  afterEach(async () => {
    await adapter.clear();
  });

  it('stores and retrieves events', async () => {
    await adapter.append({
      id: '1',
      name: 'event',
      timestamp: Date.now(),
      appId: 'app',
      sessionId: 'session',
    });
    const events = await adapter.retrieve();
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('1');
  });

  it('deduplicates by ID', async () => {
    const event = { id: 'dup', name: 'e', timestamp: Date.now(), appId: 'a', sessionId: 's' };
    await adapter.append(event);
    await adapter.append(event);
    const events = await adapter.retrieve();
    expect(events).toHaveLength(1);
  });
});
