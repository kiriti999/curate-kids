/**
 * MessageState: Tracks pending category selections for YouTube videos
 * 
 * Lifecycle:
 * - Created when valid YouTube link detected
 * - Deleted after category selection or 24h expiration
 */

export type AgeRange = '0-2' | '3-5' | '6-8' | '9-12' | '13+';

export interface MessageState {
  // Message identification
  messageId: number;           // Telegram message ID
  chatId: number;              // Telegram chat ID (group)
  userId: number;              // Telegram user ID (curator)
  
  // Video metadata (extracted from YouTube)
  youtubeUrl: string;          // Full YouTube URL
  youtubeId: string;           // Extracted 11-character ID
  title: string;               // Video title from YouTube API
  
  // State tracking
  timestamp: number;           // Unix timestamp (ms) when message received
  expiresAt: number;           // Unix timestamp (ms) when state expires (timestamp + 24h)
  
  // Group context
  ageRange: AgeRange;          // Determined from chat ID mapping
}
