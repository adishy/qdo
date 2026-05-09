import type { Task, SlotHistory } from './types';

const DB_NAME = 'qdo-db';
const DB_VERSION = 1;

export const STORES = {
  TASKS: 'tasks',
  HISTORY: 'slotHistory',
  SETTINGS: 'settings',
};

export class QdoDB {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('queueOrder', 'queueOrder', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.HISTORY)) {
          const historyStore = db.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
          historyStore.createIndex('taskId', 'taskId', { unique: false });
          historyStore.createIndex('enteredSlotAt', 'enteredSlotAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
        }
      };
    });
  }

  async getAllTasks(): Promise<Task[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.TASKS, 'readonly');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTask(task: Task): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.TASKS, 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.put(task);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTask(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.TASKS, 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getHistory(): Promise<SlotHistory[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.HISTORY, 'readonly');
      const store = transaction.objectStore(STORES.HISTORY);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveHistory(history: SlotHistory): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.HISTORY, 'readwrite');
      const store = transaction.objectStore(STORES.HISTORY);
      const request = store.put(history);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TASKS, STORES.HISTORY, STORES.SETTINGS], 'readwrite');
      transaction.objectStore(STORES.TASKS).clear();
      transaction.objectStore(STORES.HISTORY).clear();
      transaction.objectStore(STORES.SETTINGS).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async exportData(): Promise<string> {
    const allTasks = await this.getAllTasks();
    const allHistory = await this.getHistory();
    return JSON.stringify({ tasks: allTasks, history: allHistory }, null, 2);
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    if (!data.tasks && !data.history) {
      throw new Error("Invalid data format");
    }
    
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TASKS, STORES.HISTORY], 'readwrite');
      const taskStore = transaction.objectStore(STORES.TASKS);
      const historyStore = transaction.objectStore(STORES.HISTORY);

      taskStore.clear();
      historyStore.clear();

      if (data.tasks) {
        data.tasks.forEach((task: Task) => taskStore.put(task));
      }
      if (data.history) {
        data.history.forEach((h: SlotHistory) => historyStore.put(h));
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async mergeTasks(tasks: Task[]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TASKS], 'readwrite');
      const taskStore = transaction.objectStore(STORES.TASKS);

      tasks.forEach((task: Task) => {
        // Simple merge: we can regenerate IDs to avoid collisions, or just keep them
        // Let's regenerate IDs to be safe so they don't overwrite local tasks
        const clonedTask = { ...task, id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) };
        taskStore.put(clonedTask);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const db = new QdoDB();
