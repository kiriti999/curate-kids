/**
 * Telegram Bot - Main Entry Point (Deno) - Lazy Initialization Version
 * 
 * Supports both webhook mode (production) and long polling (local dev)
 * Set USE_POLLING=true in .env for local development
 * 
 * This version uses lazy initialization to allow deployment without env vars set
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
import { checkDatabase } from "./services/organization.ts";

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
 * Check if environment variables are configured
 */
function areEnvVarsConfigured(): boolean {
  return REQUIRED_ENV_VARS.every((key) => Deno.env.get(key));
}

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

// ============================================================================
// LAZY INITIALIZATION - Bot is only created when env vars are available
// ============================================================================

let botInstance: Bot | null = null;
let webhookConfigured = false;

/**
 * Get or create bot instance (lazy initialization)
 */
async function getBot(): Promise<Bot> {
  if (!botInstance) {
    logger.info("Initializing bot for the first time...");
    botInstance = await initBot();
    
    // Configure webhook if in webhook mode
    if (!USE_POLLING && WEBHOOK_URL && !webhookConfigured) {
      try {
        await botInstance.api.setWebhook(WEBHOOK_URL);
        logger.info("Webhook set successfully", { url: WEBHOOK_URL });
        webhookConfigured = true;
      } catch (err) {
        logger.error("Failed to set webhook", { error: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  return botInstance;
}

// ============================================================================
// STARTUP LOGIC
// ============================================================================

if (USE_POLLING) {
  // Polling mode - initialize immediately (for local development)
  logger.info("Starting bot in long polling mode...");
  const bot = await initBot();
  
  // Delete any existing webhook first
  await bot.api.deleteWebhook();
  
  bot.start({
    onStart: (botInfo) => {
      logger.info(`Bot @${botInfo.username} started in polling mode`);
    },
  });
} else {
  // Webhook mode - use lazy initialization for production (Deno Deploy)
  logger.info("Starting HTTP server for webhook mode...");
  
  // Check if env vars are configured
  const envConfigured = areEnvVarsConfigured();
  
  if (!envConfigured) {
    logger.warn("Environment variables not configured yet. Bot will initialize when first request arrives.");
    logger.warn("Required variables: " + REQUIRED_ENV_VARS.join(", "));
  }
  
  // HTTP server for Deno Deploy
  Deno.serve(async (req: Request) => {
    const url = new URL(req.url);
    
    // Health check endpoint - works even without env vars
    if (req.method === "GET" && url.pathname === "/") {
      if (!areEnvVarsConfigured()) {
        return new Response(
          "⚠️ Bot deployed but not configured\n\n" +
          "Missing environment variables:\n" +
          REQUIRED_ENV_VARS.filter(k => !Deno.env.get(k)).join(", ") + "\n\n" +
          "Please configure them in the Deno Deploy dashboard.",
          { status: 503 }
        );
      }
      return new Response("CuratedReels Bot is running! 🤖", { status: 200 });
    }

    // Reports whether the database login works. Public and minimal on purpose: details stay in the logs.
    if (req.method === "GET" && url.pathname === "/health") {
      const database = areEnvVarsConfigured() && (await checkDatabase());
      return Response.json(
        { bot: "running", database: database ? "ok" : "unavailable" },
        { status: database ? 200 : 503 },
      );
    }
    
    // Webhook endpoint - requires env vars
    if (req.method === "POST" && url.pathname === "/webhook") {
      try {
        // Lazy initialize bot on first webhook request
        const bot = await getBot();
        const handleUpdate = webhookCallback(bot, "std/http");
        return await handleUpdate(req);
      } catch (err) {
        logger.error("Webhook error", err instanceof Error ? { message: err.message } : { message: String(err) });
        
        // Check if it's a missing env vars error
        if (err instanceof Error && err.message.includes("Missing:")) {
          return new Response(
            `Bot not configured: ${err.message}\n\nPlease set environment variables in Deno Deploy dashboard.`,
            { status: 503 }
          );
        }
        
        return new Response("Error", { status: 500 });
      }
    }
    
    return new Response("Not Found", { status: 404 });
  });
  
  logger.info("HTTP server started. Waiting for requests...");
}
