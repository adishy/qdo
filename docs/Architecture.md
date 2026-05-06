# Architectural Overview

QDO utilizes a specialized client-side architecture to handle high-frequency auto-saving and complex animations.

## Data Layer (`src/lib/db.ts`)
- **IndexedDB:** Persistent storage for `tasks`, `slotHistory`, and `settings`.
- **JSON API:** Export/Import logic to dump and load the entire database state.

## State & Business Logic (`src/lib/TaskContext.tsx`)
- **Top Priority Logic:** `moveTask` ensures any task returning to the queue is placed at `queueOrder: 0`, and existing items are shifted.
- **Automation Loop:** Checks every 10 seconds for tasks that have reached their `dateDue` to trigger browser Notifications and auto-sorting.
- **History Engine:** Automatically records entry/exit timestamps when tasks move into the `working` status.

## UI Components (`src/App.tsx`)
- **DraggableTaskItem:** A wrapper that wires Framer Motion's `Reorder.Item` to a dedicated `GripVertical` drag handle. It handles collision detection with the Working Slot drop zone.
- **TaskItem:** The primary atom. It functions as an inline edit form. It auto-saves on `onBlur` and uses `react-markdown` for rendering descriptions.
- **SwipeView:** A card-stack engine using `useMotionValue` and `useTransform` for Tinder-style interactions.
- **StatsView:** A data visualization layer that uses SVG `foreignObject` to render a Gantt chart that stays responsive to task title lengths.

## Visual Styling
- **Tailwind CSS v4:** Integrated via the Vite plugin. Custom animations like `glow-pulse` are defined in `src/index.css`.
- **Framer Motion:** Used extensively for shared element transitions, manual reordering, and drag-and-drop collision feedback.
