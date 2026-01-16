/**
 * Callback Handler
 * 
 * Processes inline keyboard button clicks (category selection)
 */

import { Context } from 'grammy';
import { CallbackDataParser } from '../utils/callbackDataParser';
import { SanityService } from '../services/sanityService';
import { IStateStore, createStateKey } from '../services/stateManager';
import { VideoSubmission } from '../types/VideoSubmission';
import * as logger from '../utils/logger';

export class CallbackHandler {
  private callbackParser: CallbackDataParser;
  private sanityService: SanityService;
  private stateStore: IStateStore;
  
  constructor(
    sanityService: SanityService,
    stateStore: IStateStore
  ) {
    this.callbackParser = new CallbackDataParser();
    this.sanityService = sanityService;
    this.stateStore = stateStore;
  }
  
  /**
   * Handle callback query (category button click)
   * 
   * Flow:
   * 1. Parse callback data
   * 2. Lookup message state
   * 3. Validate user ID matches
   * 4. Create video submission
   * 5. Submit to Sanity
   * 6. Delete state
   * 7. Send confirmation
   */
  async handleCallback(ctx: Context): Promise<void> {
    try {
      const callbackData = ctx.callbackQuery?.data;
      const userId = ctx.from?.id;
      
      if (!callbackData || !userId) {
        await ctx.answerCallbackQuery();
        return;
      }
      
      const startTime = Date.now();
      
      // Parse callback data
      const parsed = this.callbackParser.parse(callbackData);
      
      if (!parsed) {
        logger.warn('Invalid callback data format', { callbackData });
        await ctx.answerCallbackQuery('❌ Invalid selection');
        return;
      }
      
      const { messageId, chatId, category } = parsed;
      
      logger.info('Category selected', { chatId, messageId, userId, category });
      
      // Lookup message state
      const stateKey = createStateKey(chatId, messageId);
      const state = await this.stateStore.get(stateKey);
      
      if (!state) {
        await ctx.answerCallbackQuery('⏰ Selection expired. Please share the video link again.');
        await ctx.editMessageText('⏰ Selection expired. Please share the video link again.');
        logger.warn('State not found or expired', { stateKey, userId });
        return;
      }
      
      // Validate user ID matches original message sender
      if (state.userId !== userId) {
        await ctx.answerCallbackQuery('❌ Only the person who shared the video can select its category');
        logger.warn('User mismatch', {
          stateUserId: state.userId,
          callbackUserId: userId,
          chatId,
          messageId,
        });
        return;
      }
      
      // Generate slug from title
      const slugify = (text: string): string => {
        return text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 96);
      };
      
      // Create video submission payload
      const submission: VideoSubmission = {
        _type: 'video',
        title: state.title,
        slug: {
          _type: 'slug',
          current: slugify(state.title),
        },
        youtubeUrl: state.youtubeUrl,
        youtubeId: state.youtubeId,
        category,
        ageRange: state.ageRange,
        tags: [],
      };
      
      // Submit to Sanity CMS
      const documentId = await this.sanityService.createVideo(submission);
      
      if (!documentId) {
        await ctx.answerCallbackQuery('❌ Submission failed');
        await ctx.editMessageText(
          '❌ Submission failed. Please try selecting the category again.'
        );
        logger.error('Sanity submission failed after retries', {
          youtubeId: state.youtubeId,
          category,
          ageRange: state.ageRange,
        });
        return;
      }
      
      // Delete state (submission complete)
      await this.stateStore.delete(stateKey);
      
      // Send success confirmation
      const duration = Date.now() - startTime;
      
      await ctx.answerCallbackQuery('✅ Video saved!');
      await ctx.editMessageText(
        `✅ *Video saved successfully!*\n\n` +
        `📁 Category: ${category}\n` +
        `👶 Age Range: ${state.ageRange}\n` +
        `📝 Status: Pending review\n\n` +
        `_Document ID: ${documentId}_`,
        { parse_mode: 'Markdown' }
      );
      
      logger.info('Video submission complete', {
        documentId,
        youtubeId: state.youtubeId,
        category,
        ageRange: state.ageRange,
        userId,
        durationMs: duration,
      });
      
    } catch (error) {
      logger.error('Callback handling error', error instanceof Error ? error : { message: String(error) });
      
      try {
        await ctx.answerCallbackQuery('❌ An error occurred');
        await ctx.editMessageText('❌ An error occurred. Please try again.');
      } catch (replyError) {
        logger.error('Failed to send error reply', replyError instanceof Error ? replyError : { message: String(replyError) });
      }
    }
  }
}
