# Requirements & Specifications

## Core User Workflow
1. **Commanding:** User adds tasks via the central, glowing input (Quick focus via `⌘K`).
2. **Prioritization:** 
	- Manual reorder in List View using vertical drag handles.
	- Rapid triage in Swipe View (Swipe Up = Work, Left/Right = Skip).
3. **Inline Editing:** Task cards are expanded by default. Any change to title, description (Markdown), or URL is auto-saved on interaction or blur.
4. **Execution:** User drags a task from the queue and drops it into the "Working Slot". 
5. **Completion:** User marks a task done (triggering the shredder).
6. **Context Switching:** Moving a task from the slot back to the queue automatically moves it to the **top** of the queue for immediate later resumption.

## Functional Requirements
- **Persistence:** Every change auto-saves to IndexedDB.
- **Markdown:** Descriptions support full GFM (GitHub Flavored Markdown).
- **Collision Logic:** Draggable cards detect when they are hovered over the "Working Slot".
- **Notifications:** Browser-native reminders for due dates.
- **Auto-Sorting:** Overdue/Due tasks move to position 0 in the queue automatically.
- **Data Mobility:** Full JSON export/import for backup and cross-device sync.

## Visual & Interaction Specs
- **Aesthetic:** High-fidelity Dark Mode (default) with a classy indigo pulsing glow on the command bar.
- **Recently Done:** Collapsed section showing full emerald-tinted cards with "Time in Slot" stats.
- **Stats:** High-precision Gantt chart supporting resolutions from 10 minutes to 1 year.
