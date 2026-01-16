/**
 * Message Handler
 * 
 * Processes incoming messages with video links from:
 * - YouTube
 * - Facebook
 * - Instagram
 * - LinkedIn
 */

import { Context } from 'grammy';
import { VideoUrlParser, VideoPlatform } from '../utils/urlParser';
import { YouTubeService } from '../services/youtubeService';
import { CategoryKeyboard } from '../utils/categoryKeyboard';
import { IStateStore, createStateKey, createMessageState } from '../services/stateManager';
import { getAgeRange } from '../config/ageRangeGroups';
import * as logger from '../utils/logger';

export class MessageHandler {
  private urlParser: VideoUrlParser;
  private youtubeService: YouTubeService;
  private categoryKeyboard: CategoryKeyboard;
  private stateStore: IStateStore;
  
  constructor(
    youtubeService: YouTubeService,
    stateStore: IStateStore
  ) {
    this.urlParser = new VideoUrlParser();
    this.youtubeService = youtubeService;
    this.categoryKeyboard = new CategoryKeyboard();
    this.stateStore = stateStore;
  }
  
  /**
   * Handle incoming message
   * 
   * Flow:
   * 1. Check for video URL (YouTube, Facebook, Instagram, LinkedIn)
   * 2. Extract video info
   * 3. Fetch metadata (YouTube only)
   * 4. Store state
   * 5. Send category selection buttons
   */
  async handleMessage(ctx: Context): Promise<void> {
    try {
      const messageText = ctx.message?.text;
      const messageId = ctx.message?.message_id;
      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      
      // Validate message structure
      if (!messageText || !messageId || !chatId || !userId) {
        return;
      }
      
      const startTime = Date.now();
      
      // Check if message contains any supported video URL
      if (!this.urlParser.hasVideoUrl(messageText)) {
        return; // Ignore non-video messages
      }
      
      // Parse video URL
      const parsed = this.urlParser.parseVideoUrl(messageText);
      
      if (!parsed) {
        return;
      }
      
      const { platform, url, videoId } = parsed;
      const platformName = VideoUrlParser.getPlatformDisplayName(platform);
      
      logger.info('Video link detected', { platform, chatId, messageId, userId });
      
      // Get age range from chat ID
      const ageRange = getAgeRange(chatId);
      
      // Fetch metadata (YouTube only)
      let title = url;
      if (platform === 'youtube' && videoId) {
        const metadata = await this.youtubeService.getVideoMetadata(videoId);
        if (metadata?.title) {
          title = metadata.title;
        } else {
          logger.warn('Using URL as title (YouTube API unavailable)', { videoId });
        }
      }
      
      // Create and store message state
      const state = createMessageState(
        messageId,
        chatId,
        userId,
        url,
        videoId || url, // Use URL as ID for non-YouTube platforms
        title,
        ageRange
      );
      
      const stateKey = createStateKey(chatId, messageId);
      await this.stateStore.set(stateKey, state);
      
      // Build category selection keyboard
      const keyboard = this.categoryKeyboard.build(messageId, chatId);
      
      // Send category selection message
      const platformEmoji = this.getPlatformEmoji(platform);
      await ctx.reply(
        `${platformEmoji} *${platformName} video detected:*\n${title}\n\n📁 Please select a category:`,
        {
          reply_markup: keyboard,
          parse_mode: 'Markdown',
        }
      );
      
      const duration = Date.now() - startTime;
      logger.info('Category buttons sent', {
        platform,
        chatId,
        messageId,
        userId,
        videoId: videoId || 'N/A',
        ageRange,
        durationMs: duration,
      });
      
    } catch (error) {
      logger.error('Message handling error', error instanceof Error ? error : { message: String(error) });
      
      try {
        await ctx.reply('❌ An error occurred. Please try again.');
      } catch (replyError) {
        logger.error('Failed to send error reply', replyError instanceof Error ? replyError : { message: String(replyError) });
      }
    }
  }
  
  private getPlatformEmoji(platform: VideoPlatform): string {
    const emojis: Record<VideoPlatform, string> = {
      youtube: '🎬',
      facebook: '📘',
      instagram: '📸',
      linkedin: '💼',
    };
    return emojis[platform];
  }
}
