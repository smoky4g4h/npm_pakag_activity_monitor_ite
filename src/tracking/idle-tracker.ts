import type { TrackerConfig } from '../types/index.js';
import type { EventManager } from '../core/event-manager.js';
import type { SessionManager } from '../core/session-manager.js';
import { UserState } from '../types/index.js';
import { createEvent } from '../core/event-manager.js';
import { nowMs } from '../core/session-helpers.js';

const ACTIVE_EVENTS = ['mousemove', 'mousedown', 'mouseup', 'click', 'keydown', 'keypress', 'keyup', 'scroll', 'touchstart', 'touchend'];

/**
 * Detects user inactivity based on mouse, keyboard, scroll, and touch events.
 * Emits `user_active` / `user_idle` transitions when thresholds are crossed.
 */
export class IdleTracker {
  private config: Required<TrackerConfig>;
  private eventManager: EventManager;
  private sessionManager: SessionManager;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private active = false;
  private state: UserState = 'active';

  constructor(config: Required<TrackerConfig>, eventManager: EventManager, sessionManager: SessionManager) {
    this.config = config;
    this.eventManager = eventManager;
    this.sessionManager = sessionManager;
  }

  /** Begin monitoring user interaction events */
  start(): void {
    if (this.active) return;
    this.active = true;
    this.state = 'active';
    // Don't force idle on start — only transition after inactivity period

    ACTIVE_EVENTS.forEach(evt => {
      globalThis.document?.addEventListener(evt, this.onUserActivity, { passive: true });
    });
    globalThis.document?.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** Return current known user state ('active' | 'idle') */
  getState(): UserState {
    return this.state;
  }

  /** Tear down all listeners and timers */
  destroy(): void {
    if (!this.active) return;
    this.active = false;
    this.clearIdleTimer();

    ACTIVE_EVENTS.forEach(evt => {
      globalThis.document?.removeEventListener(evt, this.onUserActivity);
    });
    globalThis.document?.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  // ─── internals ──────────────────────────────────────────────────────────

  private onUserActivity = (): void => {
    if (!this.active) return;
    this.sessionManager.recordActivity(nowMs());
    if (this.state !== 'active') {
      this.state = 'active';
      this.eventManager.emit(createEvent('user_active', {}, this.config, this.sessionManager));
    }
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      void this.transitionToIdleIfNeeded(true);
    }, this.config.inactivityTimeout);
  };

  private onVisibilityChange = (): void => {
    if (globalThis.document?.hidden) {
      this.clearIdleTimer();
    } else {
      // Tab visible again — treat as activity unless already actively monitoring
      if (this.active) this.onUserActivity();
    }
  };

  private clearIdleTimer(): void {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private async transitionToIdleIfNeeded(emitEvent: boolean): Promise<void> {
    if (this.state !== 'idle') {
      this.state = 'idle';
      if (emitEvent) {
        this.eventManager.emit(createEvent('user_idle', {}, this.config, this.sessionManager));
      }
    }
  }
}
