import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Task, SlotHistory, TaskStatus } from './types';
import { db } from './db';

interface TaskContextType {
  tasks: Task[];
  history: SlotHistory[];
  addTask: (title: string, details?: Partial<Task>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<void>;
  reorderTasks: (ids: string[]) => Promise<void>;
  clearData: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Safe ID generator fallback for non-secure contexts
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<SlotHistory[]>([]);

  const loadData = useCallback(async () => {
    const allTasks = await db.getAllTasks();
    const allHistory = await db.getHistory();
    setTasks(allTasks);
    setHistory(allHistory);
  }, []);

  const reorderTasks = useCallback(async (ids: string[]) => {
    const queueTasks = tasks.filter(t => t.status === 'queue');
    const updates = ids.map((id, index) => {
      const task = queueTasks.find(t => t.id === id);
      if (task) {
        return db.saveTask({ ...task, queueOrder: index, dateModified: Date.now() });
      }
      return Promise.resolve();
    });
    await Promise.all(updates);
    await loadData();
  }, [tasks, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Notification & Auto-sorting logic
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      let hasChanges = false;
      const queueTasks = tasks.filter(t => t.status === 'queue').sort((a, b) => a.queueOrder - b.queueOrder);
      
      for (const task of tasks) {
        // 1. Notifications
        if (task.remindMe && task.dateDue && task.dateDue <= now && task.status !== 'done') {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('QDO Task Due', {
              body: `Task "${task.title}" is due now!`,
              icon: '/vite.svg'
            });
            // Disable reminder after it fires
            await db.saveTask({ ...task, remindMe: false });
            hasChanges = true;
          }
        }
      }

      // Simple auto-sort: if any task is due and not at top of queue
      const dueButNotTop = queueTasks.some((t, i) => t.dateDue && t.dateDue <= now && i > 0);
      if (dueButNotTop) {
        const sorted = [...queueTasks].sort((a, b) => {
          const aDue = a.dateDue && a.dateDue <= now;
          const bDue = b.dateDue && b.dateDue <= now;
          if (aDue && !bDue) return -1;
          if (!aDue && bDue) return 1;
          return a.queueOrder - b.queueOrder;
        });
        await reorderTasks(sorted.map(t => t.id));
      } else if (hasChanges) {
        await loadData();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks, loadData, reorderTasks]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const addTask = async (title: string, details?: Partial<Task>) => {
    const newTask: Task = {
      id: generateId(),
      title,
      description: '',
      dateAdded: Date.now(),
      dateModified: Date.now(),
      status: 'queue',
      queueOrder: tasks.filter(t => t.status === 'queue').length,
      remindMe: false,
      customProperties: {},
      ...details,
    };
    await db.saveTask(newTask);
    await loadData();
  };

  const updateTask = async (task: Task) => {
    const updatedTask = { ...task, dateModified: Date.now() };
    await db.saveTask(updatedTask);
    await loadData();
  };

  const deleteTask = async (id: string) => {
    await db.deleteTask(id);
    await loadData();
  };

  const moveTask = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const oldStatus = task.status;
    if (oldStatus === newStatus) return;

    // Handle history if moving into or out of 'working'
    if (newStatus === 'working') {
      // Exit current working task if any
      const currentWorking = tasks.find(t => t.status === 'working');
      if (currentWorking) {
        await moveTask(currentWorking.id, 'queue');
      }

      const historyItem: SlotHistory = {
        id: generateId(),
        taskId: task.id,
        taskTitle: task.title,
        enteredSlotAt: Date.now(),
        exitedSlotAt: null,
      };
      await db.saveHistory(historyItem);
    } else if (oldStatus === 'working') {
      const activeHistory = history.find(h => h.taskId === id && h.exitedSlotAt === null);
      if (activeHistory) {
        await db.saveHistory({ ...activeHistory, exitedSlotAt: Date.now() });
      }
    }

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      dateModified: Date.now(),
      // If moving into queue, place at top (0), otherwise -1
      queueOrder: newStatus === 'queue' ? 0 : -1,
    };

    // If moving into queue, increment all other queue tasks' order
    if (newStatus === 'queue') {
      const queueTasks = tasks.filter(t => t.status === 'queue' && t.id !== id);
      const updates = queueTasks.map(t => 
        db.saveTask({ ...t, queueOrder: t.queueOrder + 1 })
      );
      await Promise.all(updates);
    }

    await db.saveTask(updatedTask);
    await loadData();
  };

  const clearData = async () => {
    await db.clearAll();
    await loadData();
  };

  const exportData = async () => {
    return await db.exportData();
  };

  const importData = async (json: string) => {
    await db.importData(json);
    await loadData();
  };

  return (
    <TaskContext.Provider value={{ tasks, history, addTask, updateTask, deleteTask, moveTask, reorderTasks, clearData, exportData, importData }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};
