# Requirements & Specifications

## Core User Workflow
1. **Commanding:** User adds tasks via the central, glowing input (Quick focus via `⌘K`).
2. **Prioritization:** 
	- Manual reorder in List View using the entire task card as a free-form 2D drag handle (smartly ignoring inputs/buttons).
	- Rapid triage in Swipe View (Swipe Up = Work, Left/Right = Skip).
3. **Queue Management:** User can quickly "Expand All" or "Collapse All" using batch controls located on the far right of the Queue header.
4. **Inline Editing:** Task cards are expanded by default. Any change to title, description (Markdown), URL, or the default "Source" dropdown is auto-saved on interaction or blur.
5. **Execution:** User drags a task from the queue and drops it into the "Working Slot". The slot displays a live active timer counting up from entry.
6. **Completion:** User marks a task done (triggering the shredder).
7. **Context Switching:** Moving a task from the slot back to the queue automatically moves it to the **top** of the queue for immediate later resumption.

## Functional Requirements
- **Persistence:** Every change auto-saves to IndexedDB.
- **Markdown:** Descriptions support full GFM (GitHub Flavored Markdown).
- **Collision Logic:** Draggable cards detect when they are hovered over the "Working Slot".
- **Notifications:** Browser-native reminders for due dates.
- **Auto-Sorting:** Overdue/Due tasks move to position 0 in the queue automatically.
- **Mobile Compatibility:** Includes safe fallbacks for UUID generation (`Math.random`) and Notifications when running on non-secure local network IPs.
- **Data Mobility:** Full JSON export/import for backup and cross-device sync.

## Visual & Interaction Specs
- **Aesthetic:** High-fidelity Dark Mode (default) with a classy indigo pulsing glow on the command bar.
- **Recently Done:** Collapsed section showing full emerald-tinted cards with "Time in Slot" badges.
- **Stats:** High-precision Gantt chart using SVG `foreignObject` for reliable text rendering, supporting resolutions from 10 minutes to 1 year.
