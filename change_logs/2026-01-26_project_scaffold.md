# Project scaffold setup (2026-01-26)

## What changed
- Added Vite + CRXJS + React 18 + TypeScript scaffolding for MV3 Chrome extension builds.
- Created MV3 manifest with side panel, background service worker, and content script entry points.
- Stubbed core architecture folders (background, content, sidepanel, db, types) with minimal implementations.
- Wired TailwindCSS styling for the side panel UI with a presentational placeholder.

## Why
- Establish a runnable, buildable Chrome extension skeleton aligned with the architecture spec.
- Provide a foundation for future feature work without implementing product behavior yet.
