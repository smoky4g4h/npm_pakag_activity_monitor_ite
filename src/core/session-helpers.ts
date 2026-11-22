import type { Session } from '../types/index.js';

/** Generate a UUID-v4 style session identifier */
export function generateSessionId(): string {
  // Try native crypto in browser
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  // Fallback for browser / older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Return the current timestamp in milliseconds */
export function nowMs(): number {
  return Date.now();
}

/** Build a fresh session object seeded at creation time */
export function createSession(initialTimestamp?: number): Session {
  return {
    id: generateSessionId(),
    startTime: initialTimestamp ?? nowMs(),
    lastActivityTime: initialTimestamp ?? nowMs(),
  };
}
