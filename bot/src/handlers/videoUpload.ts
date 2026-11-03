/**
 * Video upload handler - Processes direct video file uploads
 * Uploads videos to Cloudinary and stores metadata for category selection
 */

import type { Context } from "grammy";
import * as logger from "../utils/logger.ts";
import { buildAgeRangeKeyboard } from "../utils/keyboard.ts";
import { createStateKey, setState, type MessageState } from "../types/state.ts";
import { uploadVideoFromUrl } from "../services/cloudinary.ts";
import { resolveSubmitter } from "../services/organization.ts";
import { handleLinkCommand } from "./organizationHandler.ts";
import {
  ERROR_UPLOAD_FAILED,
  PROMPT_SELECT_AGE_RANGE,
  PROMPT_UPLOADING,
  PROMPT_CLOUDINARY_DISABLED,
  LOG_VIDEO_UPLOADED,
  LOG_AGE_RANGE_BUTTONS_SENT,
  PARSE_MODE_MARKDOWN,
} from "./constants.ts";

/**
 * Check if Cloudinary credentials are configured
 * @returns True if all required Cloudinary env vars are present
 */
export function hasCloudinaryConfig(): boolean {
  return !!(
    Deno.env.get("CLOUDINARY_CLOUD_NAME") &&
    Deno.env.get("CLOUDINARY_API_KEY") &&
    Deno.env.get("CLOUDINARY_API_SECRET")
  );
}

/**
 * Handle direct video file uploads from Telegram
 * Uploads to Cloudinary and prompts for category selection
 * @param ctx - Grammy context object
 */
export async function handleVideoUpload(ctx: Context): Promise<void> {
  const message = ctx.message;
  if (!message || !("video" in message) || !message.video) return;

  const video = message.video;
  const messageId = message.message_id;
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const caption = message.caption || "Untitled Video";

  if (!chatId || !userId) return;

  logger.info(LOG_VIDEO_UPLOADED, {
    chatId,
    messageId,
    fileId: video.file_id,
    duration: video.duration,
    fileSize: video.file_size,
  });

  if (!hasCloudinaryConfig()) {
    await handleCloudinaryNotConfigured(ctx, messageId);
    return;
  }

  // Videos belong to a linked account; ask unlinked senders to link before uploading anything
  const submitter = await resolveSubmitter(ctx.chat?.type, chatId, userId);
  if (!submitter.submittedByUserId) {
    await handleLinkCommand(ctx);
    return;
  }

  await processVideoUpload(ctx, video, messageId, chatId, userId, caption, submitter);
}

/**
 * Handle case when Cloudinary is not configured
 */
async function handleCloudinaryNotConfigured(
  ctx: Context,
  messageId: number
): Promise<void> {
  logger.warn("Cloudinary not configured, skipping video upload");
  await ctx.reply(PROMPT_CLOUDINARY_DISABLED, { reply_to_message_id: messageId });
}

/**
 * Process video upload to Cloudinary
 */
async function processVideoUpload(
  ctx: Context,
  video: { file_id: string; duration?: number; file_size?: number },
  messageId: number,
  chatId: number,
  userId: number,
  caption: string,
  submitter: { organizationId?: string; submittedByUserId?: string }
): Promise<void> {
  const processingMsg = await ctx.reply(PROMPT_UPLOADING, {
    parse_mode: PARSE_MODE_MARKDOWN,
    reply_to_message_id: messageId,
  });

  try {
    const cloudinaryResult = await uploadToCloudinary(ctx, video.file_id);

    if (!cloudinaryResult) {
      await updateMessageWithError(ctx, chatId, processingMsg.message_id);
      return;
    }

    logger.info("Video uploaded to Cloudinary", {
      publicId: cloudinaryResult.publicId,
      duration: cloudinaryResult.duration,
    });

    const state = {
      ...buildVideoState(messageId, chatId, userId, caption, cloudinaryResult),
      ...submitter,
      submitterTelegramId: String(userId),
      submitterTelegramUsername: ctx.from?.username,
    };
    await setState(createStateKey(chatId, messageId), state);

    await sendAgeRangeSelection(ctx, chatId, processingMsg.message_id, caption, cloudinaryResult, messageId);

    logger.info(LOG_AGE_RANGE_BUTTONS_SENT, { chatId, messageId });
  } catch (error) {
    logger.error("Video upload error", {
      error: error instanceof Error ? error.message : String(error),
    });
    await updateMessageWithError(ctx, chatId, processingMsg.message_id);
  }
}

/**
 * Upload video to Cloudinary via Telegram file URL
 */
async function uploadToCloudinary(
  ctx: Context,
  fileId: string
): Promise<{
  publicId: string;
  secureUrl: string;
  thumbnailUrl: string;
  duration: number;
} | null> {
  const file = await ctx.api.getFile(fileId);
  const telegramUrl = `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${file.file_path}`;

  logger.info("Got Telegram file URL", { filePath: file.file_path });

  return await uploadVideoFromUrl(telegramUrl, {
    folder: "curatedreels/telegram-videos",
  });
}

/**
 * Build message state for uploaded video
 */
function buildVideoState(
  messageId: number,
  chatId: number,
  userId: number,
  caption: string,
  cloudinaryResult: {
    publicId: string;
    secureUrl: string;
    thumbnailUrl: string;
    duration: number;
  }
): MessageState {
  return {
    messageId,
    chatId,
    userId,
    videoUrl: cloudinaryResult.secureUrl,
    videoId: cloudinaryResult.publicId,
    title: caption,
    ageRange: "" as any, // Will be filled after age range selection
    createdAt: Date.now(),
    source: "telegram",
    cloudinaryUrl: cloudinaryResult.secureUrl,
    cloudinaryId: cloudinaryResult.publicId,
    thumbnailUrl: cloudinaryResult.thumbnailUrl,
    duration: cloudinaryResult.duration,
  };
}

/**
 * Update message with error state
 */
async function updateMessageWithError(
  ctx: Context,
  chatId: number,
  messageId: number
): Promise<void> {
  await ctx.api.editMessageText(chatId, messageId, ERROR_UPLOAD_FAILED, {
    parse_mode: PARSE_MODE_MARKDOWN,
  });
}

/**
 * Send age range selection keyboard after successful upload
 */
async function sendAgeRangeSelection(
  ctx: Context,
  chatId: number,
  processingMsgId: number,
  caption: string,
  cloudinaryResult: { duration: number },
  originalMessageId: number
): Promise<void> {
  const keyboard = buildAgeRangeKeyboard(originalMessageId, chatId);
  const durationStr = formatDuration(cloudinaryResult.duration);

  await ctx.api.editMessageText(
    chatId,
    processingMsgId,
    `✅ *Video uploaded successfully!*\n\n📹 ${caption}\n${durationStr}\n${PROMPT_SELECT_AGE_RANGE}`,
    { parse_mode: PARSE_MODE_MARKDOWN, reply_markup: keyboard }
  );
}

/**
 * Format duration in MM:SS format
 */
function formatDuration(duration: number): string {
  if (!duration) return "";
  const minutes = Math.floor(duration / 60);
  const seconds = String(Math.floor(duration % 60)).padStart(2, "0");
  return `⏱️ Duration: ${minutes}:${seconds}\n`;
}
