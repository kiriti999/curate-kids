/**
 * Text message handler - Processes video URLs from text messages
 * Detects YouTube, Facebook, Instagram, and LinkedIn video links
 */

import type { Context } from "grammy";
import * as logger from "../utils/logger.ts";
import { hasVideoUrl, parseVideoUrl, getPlatformDisplayName, getPlatformEmoji } from "../utils/urlParser.ts";
import { buildAgeRangeKeyboard } from "../utils/keyboard.ts";
import { createStateKey, setState, type MessageState } from "../types/state.ts";
import { getYouTubeMetadata } from "../services/youtube.ts";
import { checkCanSubmit, handleLinkCommand } from "./organizationHandler.ts";
import { resolveSubmitter } from "../services/organization.ts";
import { handlePlaylistNameReply } from "./playlistHandler.ts";
import { handleCategoryNameReply } from "./categoryHandler.ts";
import {
  PROMPT_SELECT_AGE_RANGE,
  LOG_VIDEO_DETECTED,
  LOG_AGE_RANGE_BUTTONS_SENT,
  PARSE_MODE_MARKDOWN,
} from "./constants.ts";

// Error messages
const ERROR_VIDEO_NOT_EMBEDDABLE = "⚠️ *This video cannot be embedded on websites.*\n\nThe video owner or copyright holder has blocked it from being displayed on external sites.\n\nPlease try a different video.";

/** Escape legacy Telegram Markdown special chars so URLs/titles with _ or * don't fail parsing */
function escapeMarkdown(value: string): string {
  return value.replace(/([_*`\[])/g, "\\$1");
}

/**
 * Handle incoming text messages containing video URLs
 * Detects platform, fetches metadata for YouTube, and prompts for age range selection
 * @param ctx - Grammy context object
 */
export async function handleTextMessage(ctx: Context): Promise<void> {
  const message = ctx.message;
  if (!message || !("text" in message)) return;

  const text = message.text as string;
  const messageId = message.message_id;
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  if (!chatId || !userId || !text) return;

  // A reply to the "type a new category name" or "name your playlist" prompt takes priority over link detection
  if (!hasVideoUrl(text) && !text.startsWith("/")) {
    if (await handleCategoryNameReply(ctx, text)) return;
    if (await handlePlaylistNameReply(ctx, text)) return;
  }

  if (!hasVideoUrl(text)) return;

  const parsed = parseVideoUrl(text);
  if (!parsed) return;

  const { platform, url, videoId } = parsed;
  const platformName = getPlatformDisplayName(platform);
  const emoji = getPlatformEmoji(platform);

  logger.info(LOG_VIDEO_DETECTED, { platform, chatId, messageId });

  // Check if user can submit (organization linking)
  // Only check in group chats
  let organizationId: string | undefined;
  let submittedByUserId: string | undefined;

  if (ctx.chat?.type !== "private") {
    const { canSubmit, organization, user } = await checkCanSubmit(ctx);
    if (!canSubmit) {
      // checkCanSubmit already sent an error message
      return;
    }

    // Store organization info for later use
    organizationId = organization?.id;
    submittedByUserId = user?.id;

    logger.info("User authorized to submit", {
      userId,
      orgId: organizationId,
      userRole: user?.role,
    });
  } else {
    // Private chat: the video belongs to the sender's linked account
    ({ organizationId, submittedByUserId } = await resolveSubmitter("private", chatId, userId));
    if (!submittedByUserId) {
      // Not linked yet: send the "link your account" button instead of saving an ownerless video
      await handleLinkCommand(ctx);
      return;
    }
  }

  // Fetch metadata and check embeddability for YouTube
  const { title, embeddable } = await fetchVideoMetadata(platform, url, videoId);

  // Block non-embeddable YouTube videos
  if (platform === "youtube" && !embeddable) {
    logger.warn("Video not embeddable, rejecting", { videoId, chatId });
    await ctx.reply(ERROR_VIDEO_NOT_EMBEDDABLE, {
      parse_mode: PARSE_MODE_MARKDOWN,
      // @ts-ignore - reply_to_message_id is valid
      reply_to_message_id: messageId
    });
    return;
  }

  const state: MessageState = {
    messageId,
    chatId,
    userId,
    videoUrl: url,
    videoId: videoId || url,
    title,
    ageRange: "" as any, // Will be filled after age range selection
    createdAt: Date.now(),
    platform,
    source: "url",
    // Organization/multi-tenant fields
    organizationId,
    submittedByUserId,
    submitterTelegramId: String(userId),
    submitterTelegramUsername: ctx.from?.username,
  };

  await setState(createStateKey(chatId, messageId), state);

  const keyboard = buildAgeRangeKeyboard(messageId, chatId);

  await ctx.reply(
    `${emoji} *${platformName} video detected:*\n${escapeMarkdown(title)}\n\n${PROMPT_SELECT_AGE_RANGE}`,
    { reply_markup: keyboard, parse_mode: PARSE_MODE_MARKDOWN }
  );

  logger.info(LOG_AGE_RANGE_BUTTONS_SENT, { platform, chatId, messageId });
}

/**
 * Fetch video metadata from platform API
 * @param platform - Video platform identifier
 * @param url - Video URL
 * @param videoId - Platform-specific video ID
 * @returns Object with title and embeddable flag
 */
async function fetchVideoMetadata(
  platform: string,
  url: string,
  videoId: string | null
): Promise<{ title: string; embeddable: boolean }> {
  if (platform === "youtube" && videoId) {
    const metadata = await getYouTubeMetadata(videoId);
    if (metadata) {
      return {
        title: metadata.title,
        embeddable: metadata.embeddable,
      };
    }
  }
  // For non-YouTube platforms, assume embeddable (we can't check)
  return { title: url, embeddable: true };
}
