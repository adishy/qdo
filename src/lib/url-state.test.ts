import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from './url-state';
import type { Task } from './types';

describe('URL State encoding/decoding', () => {
  const mockTasks: Task[] = [
    {
      id: 'test-1',
      title: 'Shared Task',
      status: 'queue',
      queueOrder: 0,
      dateAdded: 1600000000000,
      dateModified: 1600000000000,
      remindMe: false,
      customProperties: { test: 'prop' },
      description: '- [x] some description\n- [ ] todo',
    }
  ];

  it('should encode and decode tasks successfully', () => {
    const encoded = encodeState(mockTasks);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeState(encoded);
    expect(decoded).toEqual(mockTasks);
  });

  it('should handle empty arrays', () => {
    const encoded = encodeState([]);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual([]);
  });

  it('should return null for invalid encoded strings', () => {
    const decoded = decodeState('invalid-encoded-string---');
    expect(decoded).toBeNull();
  });
});
