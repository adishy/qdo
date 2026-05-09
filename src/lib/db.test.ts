import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import type { Task, SlotHistory } from './types';

describe('Database Operations', () => {
  beforeEach(async () => {
    await db.clearAll();
  });

  const mockTask: Task = {
    id: 'test-1',
    title: 'Test Task',
    status: 'queue',
    queueOrder: 0,
    dateAdded: Date.now(),
    dateModified: Date.now(),
    remindMe: false,
    customProperties: {},
  };

  it('should save and retrieve a task', async () => {
    await db.saveTask(mockTask);
    const tasks = await db.getAllTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toEqual(mockTask);
  });

  it('should export and import data correctly', async () => {
    await db.saveTask(mockTask);
    const history: SlotHistory = {
      id: 'h-1',
      taskId: 'test-1',
      taskTitle: 'Test Task',
      enteredSlotAt: Date.now(),
      exitedSlotAt: Date.now() + 1000
    };
    await db.saveHistory(history);

    const exportedJSON = await db.exportData();
    expect(exportedJSON).toContain('test-1');

    await db.clearAll();
    let tasks = await db.getAllTasks();
    expect(tasks).toHaveLength(0);

    await db.importData(exportedJSON);
    tasks = await db.getAllTasks();
    const importedHistory = await db.getHistory();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('test-1');
    expect(importedHistory).toHaveLength(1);
    expect(importedHistory[0].id).toBe('h-1');
  });

  it('should reject invalid import data', async () => {
    const invalidJson = JSON.stringify({ notTasks: [], notHistory: [] });
    await expect(db.importData(invalidJson)).rejects.toThrow();
  });
});
