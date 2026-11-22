import type { TrackerConfig, FullAnalytics, TrackingEvent, UserState } from './types/index.js';
import { SessionManager } from './core/session-manager.js';
import { EventManager } from './core/event-manager.js';
import { PageTracker } from './tracking/page-tracker.js';
import { IdleTracker } from './tracking/idle-tracker.js';
import { CustomTracker } from './tracking/custom-tracker.js';
import { createStorage } from './storage/factory.js';
import { computeStats } from './analytics/stats.js';

export class ActivityTracker {
  private config: Required<TrackerConfig>;
  private sessionManager: SessionManager;
  private eventManager: EventManager;
  private pageTracker: PageTracker;
  private idleTracker: IdleTracker;
  private customTracker: CustomTracker;

  constructor(config: TrackerConfig) {
    this.config = {
      appId: config.appId,
      sessionTimeout: config.sessionTimeout ?? 30 * 60 * 1000,
      inactivityTimeout: config.inactivityTimeout ?? 60 * 1000,
      trackPageViews: config.trackPageViews ?? true,
      storage: config.storage ?? 'memory',
      maxEvents: config.maxEvents ?? 10000,
      retentionMs: config.retentionMs ?? 7 * 24 * 60 * 60 * 1000,
      trackNavigation: config.trackNavigation ?? true,
      onEvent: config.onEvent ?? (() => {}),
    };

    const storage = createStorage(this.config);
    this.sessionManager = new SessionManager(this.config);
    this.eventManager = new EventManager(this.config, storage, this.sessionManager);
    this.pageTracker = new PageTracker(this.config, this.eventManager, this.sessionManager);
    this.idleTracker = new IdleTracker(this.config, this.eventManager, this.sessionManager);
    this.customTracker = new CustomTracker(this.config, this.eventManager, this.sessionManager);
  }

  init(): void {
    this.pageTracker.start();
    this.idleTracker.start();
    this.eventManager.emit({
      id: `${Date.now()}-init`,
      name: 'session_start',
      timestamp: Date.now(),
      appId: this.config.appId,
      sessionId: this.sessionManager.currentSession.id,
    });
  }

  destroy(): void {
    this.pageTracker.destroy();
    this.idleTracker.destroy();
    this.sessionManager.destroy();
  }

  track(eventName: string, properties?: Record<string, unknown>): void {
    this.customTracker.track(eventName, properties);
  }

  trackPageView(path: string, title?: string): void {
    void this.pageTracker.trackManual(path, title);
  }

  async getEvents(): Promise<TrackingEvent[]> {
    return this.eventManager.getEvents();
  }

  async getStats(): Promise<FullAnalytics> {
    const events = await this.eventManager.getEvents();
    return computeStats(events, this.sessionManager);
  }

  getSession() {
    return this.sessionManager.getSessionSnapshot();
  }

  getUserState(): UserState {
    return this.idleTracker.getState();
  }

  async clearEvents(): Promise<void> {
    await this.eventManager.clearEvents();
  }

  async exportEvents(): Promise<string> {
    return this.eventManager.exportEvents();
  }
}
