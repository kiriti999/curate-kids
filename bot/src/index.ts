/**
 * Telegram Bot Entry Point
 * 
 * Initializes bot, registers handlers, and starts long-polling
 */

import 'dotenv/config';
import { Bot } from 'grammy';
import { YouTubeService } from './services/youtubeService';
import { SanityService } from './services/sanityService';
import { MemoryStateStore } from './services/stateManager';
import { MessageHandler } from './handlers/messageHandler';
import { CallbackHandler } from './handlers/callbackHandler';
import * as logger from './utils/logger';

// Environment variable validation
function validateEnvironment(): void {
  const required = [
    'TELEGRAM_BOT_TOKEN',
    'YOUTUBE_API_KEY',
    'SANITY_PROJECT_ID',
    'SANITY_DATASET',
    'SANITY_TOKEN',
    'GROUP_0_2',
    'GROUP_3_5',
    'GROUP_6_8',
    'GROUP_9_12',
    'GROUP_13_PLUS',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  logger.info('Environment validation passed');
}

// Main bot initialization
async function main(): Promise<void> {
  try {
    // Validate environment
    validateEnvironment();
    
    // Initialize bot
    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);
    
    logger.info('Bot initialized', {
      environment: process.env.NODE_ENV || 'development',
    });
    
    // Initialize services
    const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY!);
    
    const sanityService = new SanityService(
      process.env.SANITY_PROJECT_ID!,
      process.env.SANITY_DATASET!,
      process.env.SANITY_TOKEN!
    );
    
    const stateStore = new MemoryStateStore();
    
    // Initialize handlers
    const messageHandler = new MessageHandler(youtubeService, stateStore);
    const callbackHandler = new CallbackHandler(sanityService, stateStore);
    
    // Register message handler (all text messages)
    bot.on('message:text', (ctx) => messageHandler.handleMessage(ctx));
    
    // Register callback handler (inline keyboard buttons)
    bot.on('callback_query:data', (ctx) => callbackHandler.handleCallback(ctx));
    
    // Global error handler
    bot.catch((err) => {
      const ctx = err.ctx;
      const error = err.error instanceof Error ? err.error : new Error(String(err.error));
      
      logger.error('Bot error', {
        error: error.message,
        stack: error.stack,
        update: ctx.update,
      });
    });
    
    // State cleanup scheduler (runs every 1 hour)
    const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    
    setInterval(async () => {
      try {
        const deletedCount = await stateStore.cleanup();
        const remainingCount = await stateStore.size();
        
        logger.info('Scheduled state cleanup completed', {
          deletedCount,
          remainingCount,
        });
      } catch (error) {
        logger.error('State cleanup error', error instanceof Error ? error : { message: String(error) });
      }
    }, CLEANUP_INTERVAL_MS);
    
    logger.info('State cleanup scheduler started', {
      intervalMinutes: CLEANUP_INTERVAL_MS / (60 * 1000),
    });
    
    // Start bot (long-polling mode)
    logger.info('Starting bot (long-polling mode)');
    await bot.start();
    
  } catch (error) {
    logger.error('Fatal error during bot initialization', error instanceof Error ? error : { message: String(error) });
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the bot
main();
