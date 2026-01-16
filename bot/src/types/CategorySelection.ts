/**
 * CategorySelection: Represents inline keyboard button selection from curator
 * 
 * Lifecycle: Exists only during callback handling (not persisted)
 */

import { VideoCategory } from './VideoSubmission';

export interface CategorySelection {
  // Callback identification
  callbackQueryId: string;     // Telegram callback query ID
  
  // Selection data
  category: VideoCategory;     // Selected category value
  
  // Reference to original message
  chatId: number;              // From callback query
  messageId: number;           // From callback query
  userId: number;              // User who clicked button
}
