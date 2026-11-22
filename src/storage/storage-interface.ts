import type { TrackingEvent } from '../types/index.js';

/** Abstract contract for event persistence back-ends */
export interface EventStorageAdapter {
  /** Append an event to persistent or in-memory storage */
  append(event: TrackingEvent): Promise<void>;

  /** Retrieve all events stored so far (order is not guaranteed) */
  retrieve(): Promise<TrackingEvent[]>;

  /** Remove every event */
  clear(): Promise<void>;
}
