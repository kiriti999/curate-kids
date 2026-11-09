/**
 * Callback query handler - Processes age range and category selection from inline keyboards
 * Submits videos to PayloadCMS after both selections
 */

import type { Context } from "grammy";
import * as logger from "../utils/logger.ts";
import { parseCallbackData, parseAgeRangeData, buildCategoryKeyboard } from "../utils/keyboard.ts";
import { createStateKey, getState, deleteState, setState, type MessageState } from "../types/state.ts";
import {
  createVideo,
  createTelegramVideo,
  slugify,
  type VideoSubmission,
  type TelegramVideoSubmission,
} from "../services/payload.ts";
import {
  findOrganizationByGroupId,
  shouldAutoApproveVideos,
} from "../services/organization.ts";
import { findUserByTelegramId } from "../services/organization.ts";
import {
  buildAddToPlaylistKeyboard,
  handlePlaylistCallback,
  isPlaylistCallback,
} from "./playlistHandler.ts";
import {
  ERROR_INVALID_SELECTION,
  ERROR_SELECTION_EXPIRED,
  ERROR_SELECTION_EXPIRED_MSG,
  ERROR_SUBMISSION_FAILED,
  ERROR_SUBMISSION_FAILED_MSG,
  ERROR_UNAUTHORIZED,
  SUCCESS_VIDEO_SAVED,
  PROMPT_SELECT_CATEGORY,
  LOG_AGE_RANGE_SELECTED,
  LOG_CATEGORY_SELECTED,
  LOG_VIDEO_SUBMITTED,
  PARSE_MODE_MARKDOWN,
} from "./constants.ts";

/** Readable details from a Telegram/grammY error (the raw object is too long to see in the logs). */
function describeTelegramError(error: unknown): Record<string, unknown> {
  const e = error as { description?: string; error_code?: number; message?: string };
  return { description: e?.description ?? e?.message ?? String(error), errorCode: e?.error_code };
}

/** Answer a button press without letting an expired query ("query is too old") break the handler. */
async function safeAnswer(ctx: Context, text?: string): Promise<void> {
  try {
    if (text) await ctx.answerCallbackQuery(text);
    else await ctx.answerCallbackQuery();
  } catch (error) {
    logger.warn("answerCallbackQuery failed", describeTelegramError(error));
  }
}

/**
 * Handle callback queries from age range and category selection buttons
 * Validates user authorization and submits video to PayloadCMS
 * @param ctx - Grammy context object
 */
export async function handleCallbackQuery(ctx: Context): Promise<void> {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !("data" in callbackQuery) || !callbackQuery.data) return;

  const data = callbackQuery.data as string;
  const userId = ctx.from?.id;

  if (!userId) return;

  // Playlist actions (pl:/pla:/pln:)
  if (isPlaylistCallback(data)) {
    await handlePlaylistCallback(ctx, data);
    return;
  }

  // Check if it's an age range selection (age:msgId:chatId:range)
  if (data.startsWith("age:")) {
    await handleAgeRangeSelection(ctx, data, userId);
    return;
  }

  // Otherwise it's a category selection (cat:msgId:chatId:category)
  if (data.startsWith("cat:")) {
    await handleCategorySelection(ctx, data, userId);
    return;
  }

  await ctx.answerCallbackQuery(ERROR_INVALID_SELECTION);
}

/**
 * Handle age range selection
 */
async function handleAgeRangeSelection(ctx: Context, data: string, userId: number): Promise<void> {
  const parsed = parseAgeRangeData(data);
  if (!parsed) {
    await ctx.answerCallbackQuery(ERROR_INVALID_SELECTION);
    return;
  }

  const { messageId, chatId, ageRange } = parsed;
  const stateKey = createStateKey(chatId, messageId);
  const state = await getState(stateKey);

  if (!state) {
    await handleExpiredSelection(ctx);
    return;
  }

  if (state.userId !== userId) {
    await ctx.answerCallbackQuery(ERROR_UNAUTHORIZED);
    return;
  }

  logger.info(LOG_AGE_RANGE_SELECTED, { chatId, messageId, ageRange, source: state.source });

  // Update state with age range
  const updatedState: MessageState = {
    ...state,
    ageRange: ageRange as any,
  };
  await setState(stateKey, updatedState);

  // Show category selection
  const keyboard = buildCategoryKeyboard(messageId, chatId);
  const text = `👶 *Age Range: ${ageRange}*\n\n${PROMPT_SELECT_CATEGORY}`;

  // Acknowledge the tap straight away so Telegram doesn't expire it while we edit the message.
  await safeAnswer(ctx, `Age range: ${ageRange}`);

  try {
    await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: PARSE_MODE_MARKDOWN });
  } catch (error) {
    const details = describeTelegramError(error);
    logger.error("Error updating message with category selection", details);
    if (String(details.description).includes("message is not modified")) return; // already showing categories

    // Don't leave the user stuck: send the category choices as a new message instead.
    try {
      await ctx.reply(text, { reply_markup: keyboard, parse_mode: PARSE_MODE_MARKDOWN });
    } catch (replyError) {
      logger.error("Fallback category message failed", describeTelegramError(replyError));
    }
  }
}

/**
 * Handle category selection
 */
async function handleCategorySelection(ctx: Context, data: string, userId: number): Promise<void> {
  const parsed = parseCallbackData(data);
  if (!parsed) {
    await ctx.answerCallbackQuery(ERROR_INVALID_SELECTION);
    return;
  }

  const { messageId, chatId, category } = parsed;
  const stateKey = createStateKey(chatId, messageId);
  const state = await getState(stateKey);

  if (!state) {
    await handleExpiredSelection(ctx);
    return;
  }

  if (state.userId !== userId) {
    await ctx.answerCallbackQuery(ERROR_UNAUTHORIZED);
    return;
  }

  // Ensure age range is set
  if (!state.ageRange) {
    await ctx.answerCallbackQuery("❌ Please select age range first");
    return;
  }

  logger.info(LOG_CATEGORY_SELECTED, { chatId, messageId, category, ageRange: state.ageRange, source: state.source });

  const documentId = await submitToPayload(state, category);

  if (!documentId) {
    await handleSubmissionFailure(ctx);
    return;
  }

  // Check for duplicate video response
  if (documentId.startsWith("DUPLICATE:")) {
    await handleDuplicateVideo(ctx, stateKey, documentId, category, state.ageRange);
    return;
  }

  await handleSubmissionSuccess(ctx, stateKey, state, category, documentId);
}

/**
 * Handle expired selection state
 */
async function handleExpiredSelection(ctx: Context): Promise<void> {
  await safeAnswer(ctx, ERROR_SELECTION_EXPIRED);
  await ctx.editMessageText(ERROR_SELECTION_EXPIRED_MSG);
}

/**
 * Handle submission failure
 */
async function handleSubmissionFailure(ctx: Context): Promise<void> {
  await safeAnswer(ctx, ERROR_SUBMISSION_FAILED);
  await ctx.editMessageText(ERROR_SUBMISSION_FAILED_MSG);
}

/**
 * Handle duplicate video detection
 */
async function handleDuplicateVideo(
  ctx: Context,
  stateKey: string,
  duplicateInfo: string,
  category: string,
  ageRange: string
): Promise<void> {
  // Parse duplicate info: DUPLICATE:id:title
  const parts = duplicateInfo.split(":");
  const existingTitle = parts.slice(2).join(":"); // In case title contains colons

  await deleteState(stateKey);
  await ctx.answerCallbackQuery("⚠️ Duplicate video!");

  try {
    await ctx.editMessageText(
      `⚠️ *Duplicate Video Detected*\n\n` +
      `This video already exists in:\n` +
      `📁 Category: ${category}\n` +
      `👶 Age: ${ageRange}\n\n` +
      `_Existing video: "${existingTitle}"_`,
      { parse_mode: PARSE_MODE_MARKDOWN }
    );
  } catch {
    // Ignore "message not modified" errors
  }

  logger.warn("Duplicate video submission blocked", {
    category,
    ageRange,
    existingTitle,
  });
}

/**
 * Handle successful submission
 */
async function handleSubmissionSuccess(
  ctx: Context,
  stateKey: string,
  state: MessageState,
  category: string,
  documentId: string
): Promise<void> {
  await deleteState(stateKey);
  await ctx.answerCallbackQuery(SUCCESS_VIDEO_SAVED);

  try {
    const sourceEmoji = state.source === "telegram" ? "📤" : "🔗";
    const sourceLabel = state.source === "telegram" ? "Uploaded" : "Link";

    await ctx.editMessageText(
      `✅ *Video saved!*\n\n📁 Category: ${category}\n👶 Age: ${state.ageRange}\n${sourceEmoji} Source: ${sourceLabel}\n\n_ID: ${documentId}_`,
      {
        parse_mode: PARSE_MODE_MARKDOWN,
        // Playlists belong to linked accounts only
        reply_markup: (await canUsePlaylists(state))
          ? buildAddToPlaylistKeyboard(documentId)
          : undefined,
      }
    );
  } catch {
    // Ignore "message not modified" errors
  }

  logger.info(LOG_VIDEO_SUBMITTED, {
    documentId,
    category,
    ageRange: state.ageRange,
    source: state.source,
  });
}

/**
 * Whether the submitter has a linked account (required to own playlists)
 */
async function canUsePlaylists(state: MessageState): Promise<boolean> {
  if (state.submittedByUserId) return true;
  return !!(await findUserByTelegramId(String(state.userId)));
}

/**
 * Submit video to PayloadCMS based on source type
 * @param state - Message state containing video details
 * @param category - Selected category
 * @returns Document ID or null on failure
 */
async function submitToPayload(
  state: MessageState,
  category: string
): Promise<string | null> {
  if (isTelegramVideo(state)) {
    return await submitTelegramVideo(state, category);
  }
  return await submitUrlVideo(state, category);
}

/**
 * Check if state represents a Telegram-uploaded video
 */
function isTelegramVideo(state: MessageState): boolean {
  return !!(state.source === "telegram" && state.cloudinaryUrl && state.cloudinaryId);
}

/**
 * Submit Telegram-uploaded video to PayloadCMS
 */
async function submitTelegramVideo(
  state: MessageState,
  category: string
): Promise<string | null> {
  // Fetch organization to check auto-approve setting
  const org = state.organizationId
    ? await findOrganizationByGroupId(String(state.chatId))
    : null;
  const autoApprove = shouldAutoApproveVideos(org);

  const submission: TelegramVideoSubmission = {
    title: state.title,
    slug: slugify(state.title),
    cloudinaryUrl: state.cloudinaryUrl!,
    cloudinaryId: state.cloudinaryId!,
    thumbnailUrl: state.thumbnailUrl || "",
    duration: state.duration || 0,
    category: category as TelegramVideoSubmission["category"],
    ageRange: state.ageRange,
    tags: [],
    source: "telegram",
    // Organization fields
    organizationId: state.organizationId,
    submittedByUserId: state.submittedByUserId,
    submitterTelegramId: state.submitterTelegramId,
    submitterTelegramUsername: state.submitterTelegramUsername,
    autoApprove,
  };
  return await createTelegramVideo(submission);
}

/**
 * Submit URL-based video to PayloadCMS
 */
async function submitUrlVideo(
  state: MessageState,
  category: string
): Promise<string | null> {
  // Fetch organization to check auto-approve setting
  const org = state.organizationId
    ? await findOrganizationByGroupId(String(state.chatId))
    : null;
  const autoApprove = shouldAutoApproveVideos(org);

  const submission: VideoSubmission = {
    title: state.title,
    slug: slugify(state.title),
    videoUrl: state.videoUrl,
    platform: state.platform || "youtube",
    videoId: state.videoId,
    category: category as VideoSubmission["category"],
    ageRange: state.ageRange,
    tags: [],
    source: "url",
    // Organization fields
    organizationId: state.organizationId,
    submittedByUserId: state.submittedByUserId,
    submitterTelegramId: state.submitterTelegramId,
    submitterTelegramUsername: state.submitterTelegramUsername,
    autoApprove,
  };
  return await createVideo(submission);
}
