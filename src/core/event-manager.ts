import type { TrackingEvent } from '../types/index.js';
import type { EventStorageAdapter } from '../storage/storage-interface.js';
import { nowMs } from './session-helpers.js';
import type { SessionManager } from './session-manager.js';
import type { TrackerConfig } from '../types/index.js';

let callCounter = 0;

function makeId(): string {
  return `${Date.now()}-${++callCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export class EventManager {
  private config: Required<TrackerConfig>;
  private storage: EventStorageAdapter;
  private sessionManager: SessionManager;
  private knownIds = new Set<string>();

  constructor(config: Required<TrackerConfig>, storage: EventStorageAdapter, sessionManager: SessionManager) {
    this.config = config;
    this.storage = storage;
    this.sessionManager = sessionManager;
  }

  /** Emit a tracking event into the pipeline */
  emit(event: TrackingEvent): void {
    if (!this.isValidEvent(event)) return;
    if (this.knownIds.has(event.id)) return;

    this.knownIds.add(event.id);
    void this.storage.append(event);
    this.config.onEvent?.(event);
  }

  /** Retrieve all stored events (newest-first) */
  async getEvents(): Promise<TrackingEvent[]> {
    return this.storage.retrieve();
  }

  /** Remove all stored events and forget tracked IDs */
  async clearEvents(): Promise<void> {
    await this.storage.clear();
    this.knownIds.clear();
  }

  /** Persist events to an external target; returns raw JSON-stringified payload */
  async exportEvents(): Promise<string> {
    const events = await this.getEvents();
    return JSON.stringify(events, null, 2);
  }

  // ─── internals ───────────────────────────────────────────────────────────

  private isValidEvent(event: TrackingEvent): boolean {
    if (!event.name || typeof event.name !== 'string') {
      console.warn('[ActivityTracker] Invalid event: missing or invalid name');
      return false;
    }
    if (!event.timestamp || typeof event.timestamp !== 'number') {
      console.warn('[ActivityTracker] Invalid event: missing or invalid timestamp');
      return false;
    }
    return true;
  }
}

export function createEvent(
  name: string,
  properties: Record<string, unknown> = {},
  config: TrackerConfig,
  sessionManager: SessionManager,
): TrackingEvent {
  const base = {
    id: makeId(),
    name,
    timestamp: nowMs(),
    appId: config.appId,
    sessionId: sessionManager.currentSession.id,
  };

  switch (name) {
    case 'page_view':
      return {
        ...base,
        name: 'page_view',
        properties: {
          url: String(properties.url ?? globalThis.location?.href ?? ''),
          title: String(properties.title ?? globalThis.document?.title ?? ''),
          ...(properties.referrer ? { referrer: String(properties.referrer) } : {}),
        },
      } as const;
    case 'session_start':
      return { ...base, name: 'session_start', properties: {} } as const;
    case 'user_idle':
    case 'user_active':
      return { ...base, name, properties: {} } as const;
    default:
      return { ...base, name, properties } as const;
  }
}
