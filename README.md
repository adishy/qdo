# QDO (Queue Todo)

A snappy, gamified, queue-based progressive web application (PWA) for high-performance personal task management.

## Overview
QDO is designed around the concept of a "Working Slot" and a "Queue". It forces deep focus by providing a single primary slot for the task you are currently doing, while the rest of your tasks wait in a prioritized queue.

### Key Features
- **Working Slot:** One slot, one task. Focus on what matters now with full details, Markdown support, and a live active timer.
- **Prioritized Queue:** 
	- **List View:** Manual reordering with full-card drag areas (smartly ignoring inputs/buttons).
	- **Swipe View:** Tinder-style "Swipe Up to Work" triage system.
- **Command Center:** A prominent, glowing "Add Task" input with instant keyboard access.
- **Inline Editing:** No more clicks to edit—cards in the queue are always-open forms that auto-save as you type. Includes a default "Source" property for easy tracking.
- **Batch Controls:** Expand or collapse the entire queue instantly via controls on the right side of the queue header.
- **Gamified Interactions:** Free-form 2D drag-and-drop to "Work", and a satisfying "shredding" animation for completion.
- **Top Priority Return:** Moving a task back to the queue automatically pins it to the very top.
- **Smart Automations:** Auto-reorders tasks to the top when they become due.
- **Deep Insights:** Stats dashboard with a high-fidelity Gantt chart and customizable time resolutions (10m to 1yr).
- **PWA & Mobile Ready:** Installable on mobile/desktop, works offline, and includes safe fallbacks for Web Crypto and Notification APIs when testing on non-secure local IPs.

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
- **Deployment:** Multi-stage Docker + Nginx (SPA configured)

## Project Structure
- `src/lib/db.ts`: IndexedDB wrapper and database schema management.
- `src/lib/TaskContext.tsx`: Main state engine, business logic, automation loops, and safe API fallbacks.
- `src/lib/SettingsContext.tsx`: Theme and app-wide preference management.
- `src/App.tsx`: Primary UI entry point, containing specialized components like `DraggableTaskItem`, `SwipeView`, and `StatsView`.
- `build.sh`: Smart Docker build script with dynamic host IP resolution and `--run` capabilities.
- `docs/`: Detailed architectural documentation (Obsidian Vault).
