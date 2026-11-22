import type { TrackingEvent, TrackerConfig } from '../types/index.js';
import type { EventStorageAdapter } from '../storage/storage-interface.js';
import { MemoryStorage } from './memory-storage.js';
import { LocalStorageAdapter } from './local-storage.js';

/** Factory that resolves the configured storage adapter */
export function createStorage(config: TrackerConfig): EventStorageAdapter {
  switch (config.storage) {
    case 'localStorage':
      return new LocalStorageAdapter({ maxEvents: config.maxEvents });
    case 'memory':
    default:
      return new MemoryStorage({ maxEvents: config.maxEvents });
  }
}
