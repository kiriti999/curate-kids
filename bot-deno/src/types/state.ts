/**
 * Message state types
 */

import { AgeRange } from "../config/ageRangeGroups.ts";

export interface MessageState {
  messageId: number;
  chatId: number;
  userId: number;
  videoUrl: string;
  videoId: string;
  title: string;
  ageRange: AgeRange;
  createdAt: number;
}

// In-memory state store with TTL
const STATE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const stateStore = new Map<string, MessageState>();

export function createStateKey(chatId: number, messageId: number): string {
  return `${chatId}:${messageId}`;
}

export function setState(key: string, state: MessageState): void {
  stateStore.set(key, state);
}

export function getState(key: string): MessageState | undefined {
  const state = stateStore.get(key);
  if (state && Date.now() - state.createdAt > STATE_TTL_MS) {
    stateStore.delete(key);
    return undefined;
  }
  return state;
}

export function deleteState(key: string): void {
  stateStore.delete(key);
}

export function cleanupExpiredStates(): number {
  let deleted = 0;
  const now = Date.now();
  
  for (const [key, state] of stateStore.entries()) {
    if (now - state.createdAt > STATE_TTL_MS) {
      stateStore.delete(key);
      deleted++;
    }
  }
  
  return deleted;
}
