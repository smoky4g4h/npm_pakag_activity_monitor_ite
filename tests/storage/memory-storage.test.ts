import { describe, it, expect } from 'vitest';
import { MemoryStorage } from '../../src/storage/memory-storage.js';

describe('MemoryStorage', () => {
  it('stores events in memory', async () => {
    const storage = new MemoryStorage();
    await storage.append({
      id: '1',
      name: 'evt',
      timestamp: Date.now(),
      appId: 'app',
      sessionId: 'session',
    });
    const events = await storage.retrieve();
    expect(events).toHaveLength(1);
  });

  it('enforces maxEvents', async () => {
    const storage = new MemoryStorage({ maxEvents: 2 });
    for (let i = 0; i < 5; i++) {
      await storage.append({
        id: `id-${i}`,
        name: 'e',
        timestamp: Date.now(),
        appId: 'a',
        sessionId: 's',
      });
    }
    const events = await storage.retrieve();
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('id-3');
    expect(events[1].id).toBe('id-4');
  });
});
