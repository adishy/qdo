export type TaskStatus = 'queue' | 'working' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  url?: string;
  source?: string;
  dateAdded: number;
  dateModified: number;
  dateDue?: number;
  remindMe: boolean;
  status: TaskStatus;
  queueOrder: number;
  customProperties: Record<string, any>;
}

export interface SlotHistory {
  id: string;
  taskId: string;
  taskTitle: string;
  enteredSlotAt: number;
  exitedSlotAt: number | null;
}

export interface Settings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
}
