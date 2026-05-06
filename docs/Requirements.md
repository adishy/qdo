# Requirements & Specifications

## Core User Workflow
1. **Queueing:** User adds tasks to the queue.
2. **Prioritization:** User reorders tasks (List View) or triages them (Swipe View).
3. **Execution:** User pulls a single task into the "Working Slot".
4. **Completion:** User marks a task done (triggering the shredder) or returns it to the queue.

## Functional Requirements
- **Local Persistence:** All data must save on every action.
- **Flexibility:** Tasks must support arbitrary custom key-value properties.
- **Snappy UI:** Interactions must feel instantaneous.
- **Notifications:** Local browser-based reminders for due tasks.
- **Automated Sorting:** Tasks with due dates should auto-promote to the top of the queue when due.
- **Export/Import:** Support for full database backup/restore via JSON.

## Visual & Interaction Specs
- **Default Theme:** Dark mode.
- **Swipe View:** Tinder-style interaction (Swipe Up = Work, Swipe Left/Right = Skip).
- **Done Animation:** Gamified "shredding" effect for card completion.
- **Stats:** Sequential Gantt chart showing "Working Slot" utilization over a selectable 7 or 30 day period.
