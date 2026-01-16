/**
 * Category Keyboard Builder
 * 
 * Creates inline keyboard with category selection buttons
 */

import { InlineKeyboard } from 'grammy';
import { categoryButtons } from '../config/categories';

export class CategoryKeyboard {
  /**
   * Build inline keyboard with category buttons
   * 
   * Layout: 2 columns × 4 rows
   * Callback data format: "cat:{messageId}:{chatId}:{category}"
   * 
   * @param messageId - Telegram message ID for state lookup
   * @param chatId - Telegram chat ID for state lookup
   * @returns InlineKeyboard with category buttons
   */
  build(messageId: number, chatId: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    categoryButtons.forEach((button, index) => {
      // Callback data format: "cat:messageId:chatId:category"
      const callbackData = `cat:${messageId}:${chatId}:${button.value}`;
      
      keyboard.text(button.text, callbackData);
      
      // New row after every 2 buttons (2-column layout)
      if ((index + 1) % 2 === 0) {
        keyboard.row();
      }
    });
    
    return keyboard;
  }
}
