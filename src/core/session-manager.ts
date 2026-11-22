import type { Session, TrackerConfig } from '../types/index.js';
import { createSession, generateSessionId, nowMs } from './session-helpers.js';

export class SessionManager {
  private config: Required<TrackerConfig>;
  private session: Session;
  private timerRef: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Required<TrackerConfig>) {
    this.config = {
      appId: config.appId,
      sessionTimeout: config.sessionTimeout ?? 30 * 60 * 1000, // 30 min
      inactivityTimeout: config.inactivityTimeout ?? 60 * 1000, // 5 min
      trackPageViews: config.trackPageViews ?? true,
      storage: config.storage ?? 'memory',
      maxEvents: config.maxEvents ?? 10_000,
      retentionMs: config.retentionMs ?? 7 * 24 * 60 * 60 * 1000,
      trackNavigation: config.trackNavigation ?? true,
      onEvent: config.onEvent,
    };
    this.session = createSession(nowMs());
    this.scheduleExpirationCheck();
  }

  /** Returns the currently active session */
  get currentSession(): Session {
    return this.session;
  }

  /** Returns a read-only snapshot of the current session */
  getSessionSnapshot(): Session {
    const { ...copy } = this.session;
    return copy;
  }

  /** Records that the user performed some activity */
  recordActivity(timestamp?: number): void {
    const t = timestamp ?? nowMs();
    this.session.lastActivityTime = t;

    // If the previous session was considered expired, roll over into a new one.
    if (this.session.duration !== undefined && this.isExpired(this.session)) {
      this.startNewSession(t);
    } else {
      this.updateDuration(t);
    }
  }

  /**
   * Calculate how long the current session has been active.
   * If the session has already been marked complete, returns its final duration.
   */
  getDuration(): number {
    if (this.session.duration !== undefined) return this.session.duration;
    return nowMs() - this.session.startTime;
  }

  /** Expire the current session and mark it complete */
  expireSession(timestamp?: number): Session {
    const t = timestamp ?? nowMs();
    this.updateDuration(t);
    this.clearTimer();
    return this.getSessionSnapshot();
  }

  /** Start a brand-new session */
  startNewSession(timestamp?: number): Session {
    const t = timestamp ?? nowMs();
    this.session = createSession(t);
    this.scheduleExpirationCheck();
    return this.getSessionSnapshot();
  }

  /** Clean up any pending timers */
  destroy(): void {
    this.clearTimer();
  }

  // ─── internals ───────────────────────────────────────────────────────────

  private scheduleExpirationCheck(): void {
    this.clearTimer();
    this.timerRef = setTimeout(() => {
      this.expireSession();
    }, this.config.sessionTimeout);
  }

  private clearTimer(): void {
    if (this.timerRef !== null) {
      clearTimeout(this.timerRef);
      this.timerRef = null;
    }
  }

  private updateDuration(timestamp: number): void {
    this.session.duration = timestamp - this.session.startTime;
  }

  private isExpired(session: Session): boolean {
    return nowMs() - session.lastActivityTime >= this.config.sessionTimeout;
  }
}
