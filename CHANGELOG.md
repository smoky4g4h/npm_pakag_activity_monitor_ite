# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-11-22

### Added
- Initial release of `activity-tracker-lite`
- Core `ActivityTracker` class with session management
- Page view tracking with History API integration for SPA support
- Inactivity/idle detection based on mouse, keyboard, scroll, touch events
- Custom event tracking with metadata support
- Memory and LocalStorage adapters with max-event eviction policy
- Analytics engine computing stats, top pages, and event counts
- React integration via `ActivityTrackerProvider` and `useActivityTracker` hooks
- Complete Todo demonstration app with analytics dashboard (`examples/todo-demo`)
- Comprehensive Vitest test suite covering core modules
- ESM and CommonJS builds with TypeScript declarations

### Notes
- All computed times are estimated where direct measurement is not possible; see docs for details
- React is an optional peer dependency
