import type { TrackingEvent } from '../types/index.js';
import type { EventStorageAdapter } from './storage-interface.js';

export class MemoryStorage implements EventStorageAdapter {
  private store: TrackingEvent[] = [];
  private maxEvents?: number;

  constructor(options?: { maxEvents?: number }) {
    this.maxEvents = options?.maxEvents;
  }

  async append(event: TrackingEvent): Promise<void> {
    if (this.maxEvents !== undefined && this.store.length >= this.maxEvents) {
      // Evict oldest entries to make room
      this.store.shift();
    }
    this.store.push(event);
  }

  async retrieve(): Promise<TrackingEvent[]> {
    return [...this.store];
  }

  async clear(): Promise<void> {
    this.store = [];
  }
}
