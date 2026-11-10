/**
 * Small helpers for talking to Telegram safely.
 */

import type { Context } from "grammy";
import * as logger from "./logger.ts";

/** Readable details from a Telegram/grammY error (the raw object is too long to see in the logs). */
export function describeTelegramError(error: unknown): Record<string, unknown> {
  const e = error as { description?: string; error_code?: number; message?: string };
  return { description: e?.description ?? e?.message ?? String(error), errorCode: e?.error_code };
}

/** Answer a button press without letting an expired query ("query is too old") break the handler. */
export async function safeAnswer(ctx: Context, text?: string): Promise<void> {
  try {
    if (text) await ctx.answerCallbackQuery(text);
    else await ctx.answerCallbackQuery();
  } catch (error) {
    logger.warn("answerCallbackQuery failed", describeTelegramError(error));
  }
}
