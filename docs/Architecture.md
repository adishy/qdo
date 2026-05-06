# Architectural Overview

QDO is a client-side only Progressive Web Application. It uses a modular architecture to separate data persistence, state management, and the presentation layer.

## Data Layer (`src/lib/db.ts`)
- **IndexedDB:** The source of truth. All data is persisted locally in the browser.
- **Stores:**
	- `tasks`: Stores all task items (Queue, Working, Done).
	- `slotHistory`: Stores entry/exit timestamps for tasks in the working slot.
	- `settings`: Stores user preferences.
- **Async API:** The database wrapper provides a Promise-based API for all CRUD operations.

## Business Logic & State (`src/lib/TaskContext.tsx`)
- **React Context:** Orchestrates the app state by bridging IndexedDB and the UI.
- **Automation Loop:** A background `setInterval` checks for due tasks to trigger notifications and handle auto-sorting (moving due items to the top of the queue).
- **History Tracking:** Automatically records `SlotHistory` entries when tasks move into or out of the 'working' status.

## UI & Presentation (`src/App.tsx`)
- **Modular Components:** UI is split into functional components like `TaskItem`, `SwipeView`, and `StatsView`.
- **Framer Motion:** Handles all gamified interactions, including manual reordering, the card-stack swipe engine, and specialized animations like the "shredder".
- **Tailwind v4:** Provides a utility-first styling system integrated via the Vite plugin for high performance.

## Navigation & Routing
- Single-page navigation managed via a simple `activeTab` state, allowing for zero-latency switching between the App, Stats, and Settings.
