/**
 * Category and age range keyboard builders
 */

import { InlineKeyboard } from "grammy";
import { AGE_RANGES } from "../handlers/constants.ts";

export const CATEGORIES = [
  { value: "education", label: "📚 Education" },
  { value: "entertainment", label: "🎭 Entertainment" },
  { value: "music", label: "🎵 Music" },
  { value: "science", label: "🔬 Science" },
  { value: "arts-crafts", label: "🎨 Arts & Crafts" },
  { value: "sports", label: "⚽ Sports" },
  { value: "nature", label: "🌿 Nature" },
  { value: "stories", label: "📖 Stories" },
  { value: "spiritual", label: "🕉️ Spiritual" },
  { value: "friendship", label: "🤝 Friendship" },
  { value: "morals", label: "🧭 Morals" },
  { value: "safety", label: "🛡️ Safety" },
] as const;

/** A category button: `value` is the slug stored on videos, `label` is what the user sees. */
export interface CategoryChoice {
  value: string;
  label: string;
}

/** Categories can be created from Telegram, so any slug is valid (not just the built-in ones). */
export type VideoCategory = string;
export const NEW_CATEGORY_PREFIX = "catnew";
export type AgeRange = typeof AGE_RANGES[number]["value"];

/**
 * Build inline keyboard for age range selection
 */
export function buildAgeRangeKeyboard(messageId: number, chatId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Display in rows of 3
  for (let i = 0; i < AGE_RANGES.length; i += 3) {
    const row: { text: string; callback_data: string }[] = [];

    for (let j = 0; j < 3 && i + j < AGE_RANGES.length; j++) {
      const ageRange = AGE_RANGES[i + j];
      row.push({
        text: ageRange.label,
        callback_data: `age:${messageId}:${chatId}:${ageRange.value}`,
      });
    }

    keyboard.row(...row.map(btn => InlineKeyboard.text(btn.text, btn.callback_data)));
  }

  return keyboard;
}

/**
 * Build inline keyboard for category selection
 */
export function buildCategoryKeyboard(
  messageId: number,
  chatId: number,
  categories: readonly CategoryChoice[] = CATEGORIES,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (let i = 0; i < categories.length; i += 2) {
    const row = [categories[i], categories[i + 1]]
      .filter((c): c is CategoryChoice => Boolean(c))
      .map((c) => InlineKeyboard.text(c.label, `cat:${messageId}:${chatId}:${c.value}`));
    keyboard.row(...row);
  }

  // Lets the sender add a category that isn't listed.
  keyboard.row(InlineKeyboard.text("➕ New category", `${NEW_CATEGORY_PREFIX}:${messageId}:${chatId}`));
  return keyboard;
}

/** Parse the "New category" button data: catnew:<messageId>:<chatId> */
export function parseNewCategoryData(data: string): { messageId: number; chatId: number } | null {
  const parts = data.split(":");
  if (parts.length !== 3 || parts[0] !== NEW_CATEGORY_PREFIX) return null;
  const messageId = parseInt(parts[1], 10);
  const chatId = parseInt(parts[2], 10);
  return Number.isNaN(messageId) || Number.isNaN(chatId) ? null : { messageId, chatId };
}

/**
 * Parse category callback data
 */
export function parseCallbackData(data: string): { messageId: number; chatId: number; category: string } | null {
  const parts = data.split(":");
  if (parts.length !== 4 || parts[0] !== "cat") return null;

  return {
    messageId: parseInt(parts[1], 10),
    chatId: parseInt(parts[2], 10),
    category: parts[3],
  };
}

/**
 * Parse age range callback data
 */
export function parseAgeRangeData(data: string): { messageId: number; chatId: number; ageRange: string } | null {
  const parts = data.split(":");
  if (parts.length !== 4 || parts[0] !== "age") return null;

  return {
    messageId: parseInt(parts[1], 10),
    chatId: parseInt(parts[2], 10),
    ageRange: parts[3],
  };
}
