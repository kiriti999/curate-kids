/**
 * Telegram Bot - Main Entry Point (Deno)
 * 
 * Deploy to Deno Deploy for free unlimited hosting
 */

import { Bot } from "grammy";
import * as logger from "./utils/logger.ts";
import { hasVideoUrl, parseVideoUrl, getPlatformDisplayName, getPlatformEmoji } from "./utils/urlParser.ts";
import { buildCategoryKeyboard, parseCallbackData } from "./utils/keyboard.ts";
import { getAgeRange } from "./config/ageRangeGroups.ts";
import { createStateKey, setState, getState, deleteState, cleanupExpiredStates, MessageState } from "./types/state.ts";
import { getYouTubeMetadata } from "./services/youtube.ts";
import { createVideo, slugify, VideoSubmission } from "./services/sanity.ts";

// Validate environment
function validateEnv(): void {
  const required = [
    "TELEGRAM_BOT_TOKEN",
    "SANITY_PROJECT_ID",
    "SANITY_DATASET",
    "SANITY_TOKEN",
    "GROUP_0_2",
    "GROUP_3_5",
    "GROUP_6_8",
    "GROUP_9_12",
    "GROUP_13_PLUS",
  ];
  
  const missing = required.filter((key) => !Deno.env.get(key));
  
  if (missing.length > 0) {
    logger.error("Missing environment variables", { missing });
    throw new Error(`Missing: ${missing.join(", ")}`);
  }
  
  logger.info("Environment validated");
}

// Main
async function main(): Promise<void> {
  validateEnv();
  
  const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN")!);
  
  logger.info("Bot initialized");
  
  // Handle text messages
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const messageId = ctx.message.message_id;
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    
    if (!hasVideoUrl(text)) return;
    
    const parsed = parseVideoUrl(text);
    if (!parsed) return;
    
    const { platform, url, videoId } = parsed;
    const platformName = getPlatformDisplayName(platform);
    const emoji = getPlatformEmoji(platform);
    
    logger.info("Video detected", { platform, chatId, messageId });
    
    // Get metadata for YouTube
    let title = url;
    if (platform === "youtube" && videoId) {
      const metadata = await getYouTubeMetadata(videoId);
      if (metadata?.title) title = metadata.title;
    }
    
    // Store state
    const state: MessageState = {
      messageId,
      chatId,
      userId,
      videoUrl: url,
      videoId: videoId || url,
      title,
      ageRange: getAgeRange(chatId),
      createdAt: Date.now(),
    };
    
    setState(createStateKey(chatId, messageId), state);
    
    // Send category keyboard
    const keyboard = buildCategoryKeyboard(messageId, chatId);
    
    await ctx.reply(
      `${emoji} *${platformName} video detected:*\n${title}\n\n📁 Please select a category:`,
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
    
    logger.info("Category buttons sent", { platform, chatId, messageId });
  });
  
  // Handle callback queries (category selection)
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    
    const parsed = parseCallbackData(data);
    if (!parsed) {
      await ctx.answerCallbackQuery("❌ Invalid selection");
      return;
    }
    
    const { messageId, chatId, category } = parsed;
    const stateKey = createStateKey(chatId, messageId);
    const state = getState(stateKey);
    
    if (!state) {
      await ctx.answerCallbackQuery("⏰ Selection expired");
      await ctx.editMessageText("⏰ Selection expired. Please share the video again.");
      return;
    }
    
    if (state.userId !== userId) {
      await ctx.answerCallbackQuery("❌ Only the original sender can select");
      return;
    }
    
    logger.info("Category selected", { chatId, messageId, category });
    
    // Submit to Sanity
    const submission: VideoSubmission = {
      _type: "video",
      title: state.title,
      slug: { _type: "slug", current: slugify(state.title) },
      youtubeUrl: state.videoUrl,
      youtubeId: state.videoId,
      category: category as VideoSubmission["category"],
      ageRange: state.ageRange,
      tags: [],
    };
    
    const documentId = await createVideo(submission);
    
    if (!documentId) {
      await ctx.answerCallbackQuery("❌ Submission failed");
      await ctx.editMessageText("❌ Submission failed. Please try again.");
      return;
    }
    
    deleteState(stateKey);
    
    await ctx.answerCallbackQuery("✅ Video saved!");
    await ctx.editMessageText(
      `✅ *Video saved!*\n\n📁 Category: ${category}\n👶 Age: ${state.ageRange}\n\n_ID: ${documentId}_`,
      { parse_mode: "Markdown" }
    );
    
    logger.info("Video submitted", { documentId, category, ageRange: state.ageRange });
  });
  
  // Error handler
  bot.catch((err) => {
    logger.error("Bot error", err.error instanceof Error ? err.error : { message: String(err.error) });
  });
  
  // Cleanup scheduler
  setInterval(() => {
    const deleted = cleanupExpiredStates();
    if (deleted > 0) logger.info("Cleaned up states", { deleted });
  }, 60 * 60 * 1000);
  
  // Start polling
  logger.info("Starting bot (long-polling)");
  await bot.start();
}

main();
