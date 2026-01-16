/**
 * Category keyboard builder
 */

import { InlineKeyboard } from "grammy";

export const CATEGORIES = [
  { value: "education", label: "📚 Education" },
  { value: "entertainment", label: "🎭 Entertainment" },
  { value: "music", label: "🎵 Music" },
  { value: "science", label: "🔬 Science" },
  { value: "arts-crafts", label: "🎨 Arts & Crafts" },
  { value: "sports", label: "⚽ Sports" },
  { value: "nature", label: "🌿 Nature" },
  { value: "stories", label: "📖 Stories" },
] as const;

export type VideoCategory = typeof CATEGORIES[number]["value"];

export function buildCategoryKeyboard(messageId: number, chatId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    const row: { text: string; callback_data: string }[] = [];
    
    row.push({
      text: CATEGORIES[i].label,
      callback_data: `cat:${messageId}:${chatId}:${CATEGORIES[i].value}`,
    });
    
    if (CATEGORIES[i + 1]) {
      row.push({
        text: CATEGORIES[i + 1].label,
        callback_data: `cat:${messageId}:${chatId}:${CATEGORIES[i + 1].value}`,
      });
    }
    
    keyboard.row(...row.map(btn => InlineKeyboard.text(btn.text, btn.callback_data)));
  }
  
  return keyboard;
}

export function parseCallbackData(data: string): { messageId: number; chatId: number; category: string } | null {
  const parts = data.split(":");
  if (parts.length !== 4 || parts[0] !== "cat") return null;
  
  return {
    messageId: parseInt(parts[1], 10),
    chatId: parseInt(parts[2], 10),
    category: parts[3],
  };
}
