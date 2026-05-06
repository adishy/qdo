# QDO (Queue Todo)

A snappy, gamified, queue-based progressive web application (PWA) for high-performance personal task management.

## Overview
QDO is designed around the concept of a "Working Slot" and a "Queue". Unlike traditional list-based todo apps, QDO forces focus by providing a single primary slot for the task you are currently doing, while the rest of your tasks wait in a prioritized queue.

### Key Features
- **Working Slot:** One slot, one task. Focus on what matters now.
- **Prioritized Queue:** Drag-and-drop reordering or Tinder-style "Swipe View" for fast triaging.
- **Gamified Interactions:** "Swipe up to work" cards and a "shredding" animation for completed tasks.
- **Flexible Data Model:** Native IndexedDB storage with support for arbitrary custom properties on tasks.
- **Smart Automations:** Auto-reorders tasks to the top when they become due.
- **Local Notifications:** Browser-native reminders for due dates.
- **Stats Dashboard:** Gantt chart visualization of your work history and productivity metrics.
- **PWA Ready:** Installable on mobile and desktop, works offline.

## Tech Stack
- **Framework:** React 19 (TypeScript)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Storage:** Native IndexedDB (via custom wrapper)
- **Build Tool:** Vite

## Development Instructions

### Prerequisites
- Node.js (Latest LTS recommended)
- npm

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

### Key Commands
- `npm run dev`: Start local development server.
- `npm run build`: Type-check and build for production (generates PWA assets).
- `npm run preview`: Preview the production build locally.

## Project Structure
- `src/lib/db.ts`: IndexedDB wrapper and database schema management.
- `src/lib/TaskContext.tsx`: Main state engine, business logic, and background automation loops.
- `src/lib/SettingsContext.tsx`: Theme and app-wide preference management.
- `src/App.tsx`: Primary UI entry point, view routing, and component definitions.
- `docs/`: Detailed architectural documentation (Obsidian Vault).
