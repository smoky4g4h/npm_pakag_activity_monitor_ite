# activity-tracker-lite

A lightweight, framework-independent user activity tracking library for modern web applications.

## Features

- 🕒 **Session Management**: Automatic session IDs, duration tracking, and expiration.
- 🖱️ **Inactivity Detection**: Detect when users go idle based on configurable timeouts and browser events.
- 📄 **Page View Tracking**: Automatic tracking for MPAs and SPAs (History API support).
- 🏷️ **Custom Events**: Track any user action with optional metadata.
- 💾 **Storage Adapters**: Support for Memory and LocalStorage, with an extensible interface.
- 📊 **Analytics Engine**: Built-in functions for calculating active time, top pages, and event counts.
- ⚛️ **React Ready**: First-class React integration with hooks and providers.
- 📦 **Zero External Dependencies**: Core library is tiny and has no dependencies.

## Installation

```bash
npm install activity-tracker-lite
```

## Quick Start

### Basic Usage (Vanilla JS)

```javascript
import { ActivityTracker } from 'activity-tracker-lite';

const tracker = new ActivityTracker({
  appId: 'my-cool-app',
  storage: 'localStorage',
  trackPageViews: true,
});

tracker.init();

// Track a custom event
tracker.track('button_clicked', { color: 'blue' });

// Get current stats
const stats = await tracker.getStats();
console.log(stats.basics.totalActiveTimeMs);
```

### React Integration

```tsx
import { ActivityTrackerProvider, useActivityTracker } from 'activity-tracker-lite/react';

function App() {
  return (
    <ActivityTrackerProvider config={{ appId: 'my-react-app' }}>
      <MyComponent />
    </ActivityTrackerProvider>
  );
}

function MyComponent() {
  const tracker = useActivityTracker();
  
  return (
    <button onClick={() => tracker.track('action_performed')}>
      Click Me
    </button>
  );
}
```

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `appId` | `string` | **Required** | Unique identifier for your application |
| `sessionTimeout` | `number` | `1800000` (30m) | Inactivity before starting a new session |
| `inactivityTimeout` | `number` | `300000` (5m) | Time before user is marked as 'idle' |
| `trackPageViews` | `boolean` | `true` | Automatically track page views |
| `storage` | `'memory' \| 'localStorage'` | `'memory'` | Persistence layer for events |
| `maxEvents` | `number` | `10000` | Maximum events to keep in storage |
| `onEvent` | `(event) => void` | `undefined` | Callback for every emitted event |

## API Reference

### `tracker.init()`
Starts trackers (idle, page views) and emits a `session_start` event.

### `tracker.destroy()`
Cleans up all event listeners and timers. Use in `useEffect` cleanup or `ngOnDestroy`.

### `tracker.track(name, properties)`
Record a custom event.

### `tracker.trackPageView(path, title)`
Manually record a page view.

### `tracker.getStats()`
Returns a promise resolving to computed analytics:
- `basics`: Total counts for events, sessions, page views, and active/idle time.
- `topPages`: Array of most visited URLs.
- `eventCounts`: Count of occurrences per event name.

### `tracker.getSession()`
Returns current session metadata (ID, start time, duration).

### `tracker.getUserState()`
Returns `'active'` or `'idle'`.

## Todo Demo

A complete demonstration app is located in `examples/todo-demo`. It features:
- Task management (CRUD)
- Real-time activity tracking
- A visually polished analytics dashboard with charts

To run it:
```bash
cd examples/todo-demo
npm install
npm run dev
```

## Privacy Considerations

This library is designed to be privacy-friendly:
- It does not collect PII (Personally Identifiable Information) automatically.
- IP addresses, User Agents, and precise locations are NOT tracked by default.
- Developers are encouraged to avoid passing sensitive data in custom event properties.

## License

MIT
