import type { TrackingEvent, TrackerConfig } from '../types/index.js';
import type { EventManager } from '../core/event-manager.js';
import type { SessionManager } from '../core/session-manager.js';
import { createEvent } from '../core/event-manager.js';
import { nowMs } from '../core/session-helpers.js';

export class CustomTracker {
  private config: Required<TrackerConfig>;
  private eventManager: EventManager;
  private sessionManager: SessionManager;

  constructor(config: Required<TrackerConfig>, eventManager: EventManager, sessionManager: SessionManager) {
    this.config = config;
    this.eventManager = eventManager;
    this.sessionManager = sessionManager;
  }

  /** Track an arbitrary named event with optional properties */
  track(eventName: string, properties?: Record<string, unknown>): void {
    if (!eventName || typeof eventName !== 'string') {
      console.warn('[ActivityTracker] Invalid event name provided to custom tracker');
      return;
    }
    this.sessionManager.recordActivity(nowMs());
    const event = createEvent(eventName, properties ?? {}, this.config, this.sessionManager);
    this.eventManager.emit(event);
  }
}
