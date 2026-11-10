/**
 * "New category" flow, so a sender can add a category right from Telegram.
 *
 *   catnew:<messageId>:<chatId>   ask the sender to type a name (force-reply prompt)
 *   <their next text reply>       create the category, then show the category buttons again
 *                                 (now including it) so they tap it to finish saving the video
 */

import type { Context } from "grammy";
import { buildCategoryKeyboard, parseNewCategoryData } from "../utils/keyboard.ts";
import { safeAnswer } from "../utils/telegram.ts";
import { createStateKey, getState } from "../types/state.ts";
import { setPendingCategory, takePendingCategory } from "../types/pendingCategory.ts";
import { createCategory, listCategories } from "../services/category.ts";
import {
  ERROR_INVALID_SELECTION,
  ERROR_SELECTION_EXPIRED,
  ERROR_SELECTION_EXPIRED_MSG,
  ERROR_UNAUTHORIZED,
  PARSE_MODE_MARKDOWN,
  PROMPT_SELECT_CATEGORY,
} from "./constants.ts";

const PROMPT_NAME_CATEGORY = "✍️ Type the name of the new category (for example: Yoga):";
const FORCE_REPLY = { force_reply: true, selective: true, input_field_placeholder: "Category name" } as const;

/** Handles a tap on "➕ New category". */
export async function handleNewCategoryRequest(ctx: Context, data: string, userId: number): Promise<void> {
  const parsed = parseNewCategoryData(data);
  const chatId = ctx.chat?.id;
  if (!parsed || !chatId) {
    await safeAnswer(ctx, ERROR_INVALID_SELECTION);
    return;
  }

  const state = await getState(createStateKey(parsed.chatId, parsed.messageId));
  if (!state) {
    await safeAnswer(ctx, ERROR_SELECTION_EXPIRED);
    return;
  }
  if (state.userId !== userId) {
    await safeAnswer(ctx, ERROR_UNAUTHORIZED);
    return;
  }

  await setPendingCategory(chatId, userId, parsed.messageId);
  await safeAnswer(ctx);
  await ctx.reply(PROMPT_NAME_CATEGORY, { reply_markup: FORCE_REPLY });
}

function outcomeMessage(result: Awaited<ReturnType<typeof createCategory>>): string {
  switch (result.status) {
    case "created":
      return `✅ Created category *${result.name}*.`;
    case "exists":
      return `ℹ️ *${result.name}* already exists.`;
    case "limit":
      return "⚠️ There are already too many categories. Please pick one below.";
    case "rate_limited":
      return "⏳ Please wait a few seconds before creating another category.";
    default:
      return "❌ Couldn't create the category. Please pick one below.";
  }
}

/**
 * Consumes the sender's typed reply if they just tapped "New category".
 * Returns true when the message was handled here (so it isn't treated as anything else).
 */
export async function handleCategoryNameReply(ctx: Context, text: string): Promise<boolean> {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  if (!chatId || !userId) return false;

  const messageId = await takePendingCategory(chatId, userId);
  if (messageId === undefined) return false;

  const state = await getState(createStateKey(chatId, messageId));
  if (!state || state.userId !== userId) {
    await ctx.reply(ERROR_SELECTION_EXPIRED_MSG);
    return true;
  }

  const result = await createCategory(text, userId);

  if (result.status === "invalid") {
    // Keep waiting so they can simply type another name.
    await setPendingCategory(chatId, userId, messageId);
    await ctx.reply(`⚠️ ${result.reason}\n\nType the category name again:`, { reply_markup: FORCE_REPLY });
    return true;
  }

  const keyboard = buildCategoryKeyboard(messageId, chatId, await listCategories());
  await ctx.reply(`${outcomeMessage(result)}\n\n${PROMPT_SELECT_CATEGORY}`, {
    reply_markup: keyboard,
    parse_mode: PARSE_MODE_MARKDOWN,
  });
  return true;
}
