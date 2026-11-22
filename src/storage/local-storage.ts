import type { TrackingEvent } from '../types/index.js';
import type { EventStorageAdapter } from './storage-interface.js';

const STORAGE_KEY = 'activity_tracker_events';

function readFromStore(): TrackingEvent[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStore(events: TrackingEvent[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn('[ActivityTracker] Failed to persist events to localStorage:', err);
  }
}

export class LocalStorageAdapter implements EventStorageAdapter {
  private maxEvents?: number;

  constructor(options?: { maxEvents?: number }) {
    this.maxEvents = options?.maxEvents;
  }

  async append(event: TrackingEvent): Promise<void> {
    const events = readFromStore();
    // Dedup by id
    if (!events.some(e => e.id === event.id)) {
      events.push(event);
    }
    if (this.maxEvents !== undefined && events.length > this.maxEvents) {
      events.splice(0, events.length - this.maxEvents);
    }
    writeToStore(events);
  }

  async retrieve(): Promise<TrackingEvent[]> {
    return readFromStore();
  }

  async clear(): Promise<void> {
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // ignore — best effort cleanup
    }
  }
}
