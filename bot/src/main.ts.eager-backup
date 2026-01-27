/**
 * Telegram Bot - Main Entry Point (Deno)
 * 
 * Supports both webhook mode (production) and long polling (local dev)
 * Set USE_POLLING=true in .env for local development
 */

import { Bot, webhookCallback } from "grammy";
import * as logger from "./utils/logger.ts";
import { handleTextMessage, handleVideoUpload, handleCallbackQuery } from "./handlers/index.ts";
import {
  handleBotAddedToGroup,
  handleBotRemovedFromGroup,
  handleNewMember,
  handleMemberRemoved,
  handleLinkCommand,
  handleStatusCommand,
} from "./handlers/organizationHandler.ts";
import { validateConnection as validatePayloadConnection } from "./services/payload.ts";

// Check if we should use polling mode (for local development)
const USE_POLLING = Deno.env.get("USE_POLLING") === "true";

// Webhook URL for production (e.g., https://curate-kids-bots.deno.dev/webhook)
const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL");

// Required environment variables (reduced - group IDs now optional with multi-tenant)
const REQUIRED_ENV_VARS = [
  "TELEGRAM_BOT_TOKEN",
  "MONGODB_URI",
] as const;

/**
 * Validate that all required environment variables are present
 * @throws Error if any required variables are missing
 */
function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !Deno.env.get(key));

  if (missing.length > 0) {
    logger.error("Missing environment variables", { missing });
    throw new Error(`Missing: ${missing.join(", ")}`);
  }

  logger.info("Environment validated");
}

/**
 * Initialize bot with handlers
 * Sets up message handlers for text, video, and callback queries
 * @returns Configured Bot instance
 */
async function initBot(): Promise<Bot> {
  validateEnv();

  // Validate MongoDB connection
  logger.info("Validating MongoDB connection...");
  const isConnected = await validatePayloadConnection();

  if (!isConnected) {
    logger.error("MongoDB connection validation failed - bot may not function correctly");
    // Continue anyway to allow health check endpoint to work
  }

  const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN")!);

  logger.info(`Bot initialized (${USE_POLLING ? 'polling' : 'webhook'} mode)`);

  // === COMMANDS ===
  bot.command("link", handleLinkCommand);
  bot.command("status", handleStatusCommand);
  bot.command("start", async (ctx) => {
    // If in group, treat as bot added
    if (ctx.chat?.type !== "private") {
      await handleBotAddedToGroup(ctx);
    } else {
      await ctx.reply(
        "👋 Welcome to CuratedReels Bot!\n\n" +
        "Add me to a Telegram group to start curating videos.\n\n" +
        "Commands:\n" +
        "/link - Link your Telegram account\n" +
        "/status - Check your account status"
      );
    }
  });

  // === GROUP EVENTS ===
  // Bot added to or removed from group (my_chat_member event)
  bot.on("my_chat_member", async (ctx) => {
    const newStatus = ctx.myChatMember.new_chat_member.status;
    const oldStatus = ctx.myChatMember.old_chat_member.status;
    const chatId = ctx.chat?.id;

    logger.info("my_chat_member event received", {
      chatId,
      oldStatus,
      newStatus,
      chatType: ctx.chat?.type
    });

    // Bot was added to group (wasn't a member before, now is)
    if (
      (oldStatus === "left" || oldStatus === "kicked") &&
      (newStatus === "member" || newStatus === "administrator")
    ) {
      await handleBotAddedToGroup(ctx);
    }

    // Bot was removed from group (was a member, now isn't)
    if (
      (oldStatus === "member" || oldStatus === "administrator") &&
      (newStatus === "left" || newStatus === "kicked")
    ) {
      await handleBotRemovedFromGroup(ctx);
    }
  });

  // New member joins or member leaves group
  bot.on("chat_member", async (ctx) => {
    const newStatus = ctx.chatMember.new_chat_member.status;
    const oldStatus = ctx.chatMember.old_chat_member.status;

    // Member joined
    if (newStatus === "member") {
      await handleNewMember(ctx);
    }

    // Member left or was kicked
    if (
      (oldStatus === "member" || oldStatus === "administrator" || oldStatus === "creator") &&
      (newStatus === "left" || newStatus === "kicked")
    ) {
      await handleMemberRemoved(ctx);
    }
  });

  // === MESSAGE HANDLERS ===
  bot.on("message:text", handleTextMessage);
  bot.on("message:video", handleVideoUpload);
  bot.on("callback_query:data", handleCallbackQuery);

  // Error handler
  bot.catch((err) => {
    logger.error("Bot error", err.error instanceof Error ? err.error : { message: String(err.error) });
  });

  return bot;
}

// Initialize bot
const bot = await initBot();

// Use polling for local development, webhook for production
if (USE_POLLING) {
  // Long polling mode - for local development
  logger.info("Starting bot in long polling mode...");

  // Delete any existing webhook first
  await bot.api.deleteWebhook();

  bot.start({
    onStart: (botInfo) => {
      logger.info(`Bot @${botInfo.username} started in polling mode`);
    },
  });
} else {
  // Webhook mode - for production (Deno Deploy)

  // Auto-set webhook if WEBHOOK_URL is provided
  if (WEBHOOK_URL) {
    try {
      await bot.api.setWebhook(WEBHOOK_URL);
      logger.info("Webhook set successfully", { url: WEBHOOK_URL });
    } catch (err) {
      logger.error("Failed to set webhook", { error: err instanceof Error ? err.message : String(err) });
    }
  } else {
    logger.warn("WEBHOOK_URL not set - webhook must be configured manually");
  }

  const handleUpdate = webhookCallback(bot, "std/http");

  // HTTP server for Deno Deploy
  Deno.serve(async (req: Request) => {
    const url = new URL(req.url);

    // Health check endpoint
    if (req.method === "GET" && url.pathname === "/") {
      return new Response("CuratedReels Bot is running! 🤖", { status: 200 });
    }

    // Webhook endpoint
    if (req.method === "POST" && url.pathname === "/webhook") {
      try {
        return await handleUpdate(req);
      } catch (err) {
        logger.error("Webhook error", err instanceof Error ? { message: err.message } : { message: String(err) });
        return new Response("Error", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  });
}

