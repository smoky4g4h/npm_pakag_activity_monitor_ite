import type { TrackingEvent } from '../types/index.js';
import type { EventManager } from '../core/event-manager.js';
import type { SessionManager } from '../core/session-manager.js';
import type { TrackerConfig } from '../types/index.js';
import { createEvent } from '../core/event-manager.js';
import { nowMs } from '../core/session-helpers.js';
import { nowMs as nowMsUtil } from '../core/session-helpers.js';

/**
 * Watches the browser history API to emit page_view events on navigation.
 * Supports HTML5 popstate and pushState/replaceState for SPA routing.
 */
export class PageTracker {
  private config: Required<TrackerConfig>;
  private eventManager: EventManager;
  private sessionManager: SessionManager;
  private lastRecordedUrl: string | null = null;
  private boundHandler: (() => void) | null = null;
  private active = false;

  constructor(config: Required<TrackerConfig>, eventManager: EventManager, sessionManager: SessionManager) {
    this.config = config;
    this.eventManager = eventManager;
    this.sessionManager = sessionManager;
  }

  /** Start observing the History API (no-op if already active or disabled) */
  start(): void {
    if (!this.config.trackPageViews || !this.config.trackNavigation || this.active) return;
    if (!globalThis.history || !globalThis.window) return;

    this.active = true;
    // Record an initial view on mount
    void this.recordCurrentView();

    this.boundHandler = () => this.onNavigate();

    globalThis.window.addEventListener('popstate', this.boundHandler);
    const origPush = globalThis.history.pushState.bind(globalThis.history);
    const origReplace = globalThis.history.replaceState.bind(globalThis.history);

    globalThis.history.pushState = (...args) => {
      origPush(...args);
      void this.onNavigate();
    };
    globalThis.history.replaceState = (...args) => {
      origReplace(...args);
      void this.onNavigate();
    };
  }

  /** Manually track a page view */
  async trackManual(path: string, title?: string): Promise<void> {
    if (!this.config.trackPageViews) return;
    const url = path.startsWith('/') ? new URL(path, globalThis.location?.href ?? 'http://localhost').href : path;
    await this.emitPageView(url, title);
  }

  /** Clean up listeners and state */
  destroy(): void {
    if (this.boundHandler && globalThis.window) {
      globalThis.window.removeEventListener('popstate', this.boundHandler);
    }
    this.active = false;
    this.boundHandler = null;
  }

  // ─── internals ──────────────────────────────────────────────────────────

  private async onNavigate(): Promise<void> {
    await this.recordCurrentView();
  }

  private async recordCurrentView(): Promise<void> {
    const href = globalThis.location?.href ?? '';
    if (this.lastRecordedUrl === href) return;
    this.lastRecordedUrl = href;
    await this.emitPageView(href);
  }

  private async emitPageView(url: string, titleArg?: string): Promise<void> {
    this.sessionManager.recordActivity(nowMs());
    const event = createEvent(
      'page_view',
      { url, title: titleArg ?? globalThis.document?.title },
      this.config,
      this.sessionManager,
    );
    this.eventManager.emit(event);
  }
}
