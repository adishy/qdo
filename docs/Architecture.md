# Architectural Overview

QDO utilizes a specialized client-side architecture to handle high-frequency auto-saving, complex animations, and mobile edge-cases.

## Data Layer (`src/lib/db.ts`)
- **IndexedDB:** Persistent storage for `tasks`, `slotHistory`, and `settings`.
- **JSON API:** Export/Import logic to dump and load the entire database state.

## State & Business Logic (`src/lib/TaskContext.tsx`)
- **Top Priority Logic:** `moveTask` ensures any task returning to the queue is placed at `queueOrder: 0`, and existing items are shifted.
- **Automation Loop:** Checks every 10 seconds for tasks that have reached their `dateDue` to trigger browser Notifications and auto-sorting.
- **History Engine:** Automatically records entry/exit timestamps when tasks move into the `working` status.
- **Safe APIs:** Implements a `generateId` fallback for `crypto.randomUUID` and wraps `Notification` calls in `typeof` checks to prevent crashes in non-secure contexts (like mobile local network access).

## UI Components (`src/App.tsx`)
- **DraggableTaskItem:** A wrapper that wires Framer Motion's `Reorder.Item` to allow free-form 2D dragging across the entire card. Uses a smart pointer-down interceptor to prevent drag interference with interactive child elements (inputs, buttons, links).
- **TaskItem:** The primary atom. It functions as an inline edit form. It auto-saves on `onBlur`, incorporates a default "Source" property, and uses `react-markdown` for rendering descriptions.
- **WorkingSlotTimer:** A localized component that actively polls the `taskHistory` to render a live count-up timer without re-rendering the entire app structure.
- **SwipeView:** A card-stack engine using `useMotionValue` and `useTransform` for Tinder-style interactions, with smooth exit animations for skipped cards.
- **StatsView:** A data visualization layer that uses SVG `foreignObject` to render a Gantt chart that stays responsive to task title lengths.

## Visual Styling
- **Tailwind CSS v4:** Integrated via the Vite plugin. Custom animations like `glow-pulse` are defined in `src/index.css`.
- **Framer Motion:** Used extensively for shared element transitions, free-form dragging, and collision feedback.

## Deployment & Packaging
- **Docker & Nginx:** The PWA is packaged using a multi-stage `Dockerfile`. The resulting static `dist/` is served by an `nginx:alpine` container using a custom `nginx.conf` optimized for SPA routing and aggressive asset caching.
- **Build Script:** An executable `build.sh` automates image creation, dynamically resolves the host network IP, and supports a `--run` flag for immediate deployment with existing container cleanup.