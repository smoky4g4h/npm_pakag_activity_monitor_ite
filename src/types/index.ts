export interface BaseEvent {
  id: string;
  name: string;
  timestamp: number;
  appId: string;
  sessionId: string;
}

export interface PageViewEvent extends BaseEvent {
  name: 'page_view';
  properties: {
    url: string;
    title: string;
    referrer?: string;
  };
}

export interface CustomEvent extends BaseEvent {
  name: string;
  properties?: Record<string, unknown>;
}

export interface SessionStartEvent extends BaseEvent {
  name: 'session_start';
  properties: Record<string, never>;
}

export interface UserStateEvent extends BaseEvent {
  name: 'user_idle' | 'user_active';
  properties: Record<string, never>;
}

export type TrackingEvent =
  | PageViewEvent
  | CustomEvent
  | SessionStartEvent
  | UserStateEvent;

export interface Session {
  id: string;
  startTime: number;
  lastActivityTime: number;
  duration?: number;
}

export type StorageType = 'memory' | 'localStorage';

export interface TrackerConfig {
  appId: string;
  sessionTimeout?: number;
  inactivityTimeout?: number;
  trackPageViews?: boolean;
  storage?: StorageType;
  maxEvents?: number;
  retentionMs?: number;
  trackNavigation?: boolean;
  onEvent?: (event: TrackingEvent) => void;
}

export interface BasicStats {
  totalPageViews: number;
  totalSessions: number;
  totalEvents: number;
  totalActiveTimeMs: number;
  totalIdleTimeMs: number;
  averageSessionDurationMs: number;
}

export interface PageVisitStat {
  url: string;
  count: number;
}

export interface EventCountStat {
  eventName: string;
  count: number;
}

export interface FullAnalytics {
  basics: BasicStats;
  topPages: PageVisitStat[];
  eventCounts: EventCountStat[];
  includesEstimates: boolean;
}

export type UserState = 'active' | 'idle';

import type { ActivityTracker } from '../index.js';

export interface ActivityTrackerContextValue {
  tracker: ActivityTracker;
}
