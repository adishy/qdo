# QDO Architecture & Decisions

## Overview
QDO is a snappy, gamified queue-based todo application built with React, Vite, and Tailwind CSS. It focuses on maintaining a "single task at a time" mindset via a specialized queue mechanism and a focused "Working Slot".

## State Management
- **TaskContext**: Uses React Context to provide global access to tasks and history.
- **IndexedDB**: Powered by a custom wrapper (`src/lib/db.ts`), ensuring all user data is stored safely offline. It uses `IDBDatabase` under the hood. 
- **Data Model**:
  - `tasks`: Core object store tracking title, descriptions, `TaskStatus` (`queue`, `working`, `done`), timestamps, etc.
  - `slotHistory`: Tracking time spent on tasks inside the working slot for statistical analysis.

## Core Features & Offline Capabilities
1. **PWA & Offline Mode**: 
   - Managed via `vite-plugin-pwa`. It heavily caches all core assets (JS, CSS, SVGs, PNGs).
   - `App.tsx` actively listens to `navigator.onLine` and sets a visible `OFFLINE` badge.
   - You can explicitly clear caches via "Force Refresh App" in settings. This purges Workbox caches but safely leaves IndexedDB data untouched.
2. **Interactive Markdown Checkboxes**:
   - Instead of complex controlled React components inside `react-markdown`, QDO generates HTML natively using `marked` and renders using `dangerouslySetInnerHTML`.
   - Event delegation on the parent container intercepts native clicks to flip the markdown's text-based checkbox state. This bypasses React's virtual DOM reconciliation loop, providing pixel-perfect interaction.
3. **Sharing via URL State**:
   - Encoding: Tasks are compressed into a URL-safe string using `lz-string` base64 algorithms. 
   - When visiting `/#state={base64}`, QDO prompts the user to import tasks. Imported tasks automatically merge into the current DB with fresh IDs.

## Deployment & Testing
- **Vitest**: Integrated with `fake-indexeddb` to run data-model regression tests across contexts.
- **GitHub Actions**: Tests are automatically run on push to `main`. If they pass, the app is built and deployed directly to GitHub Pages on `qdo.adishy.com` via a custom `CNAME`.

## Design Constraints
- Mobile zooming on input fields is disabled natively by using standard `16px` font sizing (via Tailwind's `text-base` class) specifically for mobile devices.
