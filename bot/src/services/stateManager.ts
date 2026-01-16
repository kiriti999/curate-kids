/**
 * State Manager: In-memory message-callback correlation with TTL
 * 
 * Stores pending category selections with 24-hour expiration
 * Provides abstraction for future Redis migration
 */

import { MessageState } from '../types/MessageState';
import * as logger from '../utils/logger';

const TTL_HOURS = 24;
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

/**
 * State store interface for message-callback correlation
 * 
 * Abstracted to allow future Redis migration without code changes
 */
export interface IStateStore {
  /**
   * Store a pending video submission state
   * @param key - Unique key (chatId:messageId)
   * @param state - Message state to store
   */
  set(key: string, state: MessageState): Promise<void>;
  
  /**
   * Retrieve a pending submission state
   * @param key - Unique key (chatId:messageId)
   * @returns MessageState if found and not expired, null otherwise
   */
  get(key: string): Promise<MessageState | null>;
  
  /**
   * Delete a submission state (after processing or expiration)
   * @param key - Unique key (chatId:messageId)
   */
  delete(key: string): Promise<void>;
  
  /**
   * Remove all expired states (TTL cleanup)
   * @returns Number of states deleted
   */
  cleanup(): Promise<number>;
  
  /**
   * Get current number of active states (for monitoring)
   * @returns Count of non-expired states
   */
  size(): Promise<number>;
}

/**
 * In-memory implementation of state store
 * 
 * Uses Map with TTL for MVP. Redis-ready architecture allows
 * seamless migration when needed.
 */
export class MemoryStateStore implements IStateStore {
  private store: Map<string, MessageState> = new Map();
  
  async set(key: string, state: MessageState): Promise<void> {
    this.store.set(key, state);
    logger.info('State stored', { key, userId: state.userId, youtubeId: state.youtubeId });
  }
  
  async get(key: string): Promise<MessageState | null> {
    const state = this.store.get(key);
    
    if (!state) {
      logger.warn('State not found', { key });
      return null;
    }
    
    // Check expiration
    if (Date.now() > state.expiresAt) {
      logger.warn('State expired', { key, expiresAt: new Date(state.expiresAt).toISOString() });
      this.store.delete(key);
      return null;
    }
    
    return state;
  }
  
  async delete(key: string): Promise<void> {
    const deleted = this.store.delete(key);
    if (deleted) {
      logger.info('State deleted', { key });
    }
  }
  
  async cleanup(): Promise<number> {
    const now = Date.now();
    let deleted = 0;
    
    for (const [key, state] of this.store.entries()) {
      if (now > state.expiresAt) {
        this.store.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      logger.info('State cleanup completed', { deletedCount: deleted, remainingCount: this.store.size });
    }
    
    // Alert if memory leak suspected
    if (this.store.size > 10000) {
      logger.error('Potential memory leak detected', { stateCount: this.store.size });
    }
    
    return deleted;
  }
  
  async size(): Promise<number> {
    return this.store.size;
  }
}

/**
 * Create state key from chat ID and message ID
 */
export function createStateKey(chatId: number, messageId: number): string {
  return `${chatId}:${messageId}`;
}

/**
 * Create MessageState with automatic expiration
 */
export function createMessageState(
  messageId: number,
  chatId: number,
  userId: number,
  youtubeUrl: string,
  youtubeId: string,
  title: string,
  ageRange: string
): MessageState {
  const timestamp = Date.now();
  
  return {
    messageId,
    chatId,
    userId,
    youtubeUrl,
    youtubeId,
    title,
    timestamp,
    expiresAt: timestamp + TTL_MS,
    ageRange: ageRange as any,
  };
}
