/**
 * Callback Data Parser
 * 
 * Parses callback data from inline keyboard buttons
 */

import { VideoCategory } from '../types/VideoSubmission';

export interface ParsedCallbackData {
  messageId: number;
  chatId: number;
  category: VideoCategory;
}

export class CallbackDataParser {
  /**
   * Parse callback data from inline keyboard button
   * 
   * Expected format: "cat:{messageId}:{chatId}:{category}"
   * 
   * @param data - Raw callback data string
   * @returns Parsed data or null if invalid format
   */
  parse(data: string): ParsedCallbackData | null {
    // Check prefix
    if (!data.startsWith('cat:')) {
      return null;
    }
    
    // Remove prefix and split
    const parts = data.substring(4).split(':');
    
    if (parts.length !== 3) {
      return null;
    }
    
    const [messageIdStr, chatIdStr, category] = parts;
    
    // Parse numbers
    const messageId = parseInt(messageIdStr, 10);
    const chatId = parseInt(chatIdStr, 10);
    
    // Validate parsing
    if (isNaN(messageId) || isNaN(chatId)) {
      return null;
    }
    
    // Validate category
    const validCategories: VideoCategory[] = [
      'education',
      'entertainment',
      'music',
      'science',
      'arts-crafts',
      'sports',
      'nature',
      'stories',
    ];
    
    if (!validCategories.includes(category as VideoCategory)) {
      return null;
    }
    
    return {
      messageId,
      chatId,
      category: category as VideoCategory,
    };
  }
}
