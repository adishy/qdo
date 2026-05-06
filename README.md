# QDO (Queue Todo)

A snappy, gamified, queue-based progressive web application (PWA) for high-performance personal task management.

## Overview
QDO is designed around the concept of a "Working Slot" and a "Queue". It forces deep focus by providing a single primary slot for the task you are currently doing, while the rest of your tasks wait in a prioritized queue.

### Key Features
- **Working Slot:** One slot, one task. Focus on what matters now with full details and Markdown support.
- **Prioritized Queue:** 
	- **List View:** Manual reordering via dedicated drag handles.
	- **Swipe View:** Tinder-style "Swipe Up to Work" triage system.
- **Command Center:** A prominent, glowing "Add Task" input with instant keyboard access.
- **Inline Editing:** No more clicks to edit—cards in the queue are always-open forms that auto-save as you type.
- **Gamified Interactions:** Drag-and-drop to "Work", and a satisfying "shredding" animation for completion.
- **Top Priority Return:** Moving a task back to the queue automatically pins it to the very top.
- **Smart Automations:** Auto-reorders tasks to the top when they become due.
- **Deep Insights:** Stats dashboard with a high-fidelity Gantt chart and customizable time resolutions (10m to 1yr).
- **PWA Ready:** Installable on mobile and desktop, works offline.

## Keyboard Shortcuts
- `⌘K` or `Ctrl+K`: Focus "Add Task" input.
- `/`: Focus "Add Task" input (when not already in an input).

## Tech Stack
- **Framework:** React 19 (TypeScript)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Markdown:** React Markdown + Remark GFM
- **Icons:** Lucide React
- **Storage:** Native IndexedDB
- **Build Tool:** Vite

## Project Structure
- `src/lib/db.ts`: IndexedDB wrapper and database schema management.
- `src/lib/TaskContext.tsx`: Main state engine, business logic, and background automation loops.
- `src/lib/SettingsContext.tsx`: Theme and app-wide preference management.
- `src/App.tsx`: Primary UI entry point, containing specialized components like `DraggableTaskItem`, `SwipeView`, and `StatsView`.
- `docs/`: Detailed architectural documentation (Obsidian Vault).
