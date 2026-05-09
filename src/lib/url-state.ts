import LZString from 'lz-string';
import type { Task } from './types';

export function encodeState(tasks: Task[]): string {
  try {
    const json = JSON.stringify(tasks);
    return LZString.compressToEncodedURIComponent(json);
  } catch (error) {
    console.error('Failed to encode state', error);
    return '';
  }
}

export function decodeState(encoded: string): Task[] | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as Task[];
  } catch (error) {
    console.error('Failed to decode state', error);
    return null;
  }
}
