/**
 * Sanity Service
 * 
 * Submits video documents to Sanity CMS with retry logic
 */

import { createClient, SanityClient } from '@sanity/client';
import { VideoSubmission } from '../types/VideoSubmission';
import * as logger from '../utils/logger';

export class SanityService {
  private client: SanityClient;
  private maxRetries: number;
  private retryDelayMs: number;
  
  constructor(
    projectId: string,
    dataset: string,
    token: string,
    maxRetries: number = 3,
    retryDelayMs: number = 2000
  ) {
    this.client = createClient({
      projectId,
      dataset,
      token,
      apiVersion: '2024-01-01',
      useCdn: false, // Ensure fresh data for mutations
    });
    
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }
  
  /**
   * Create video document in Sanity CMS
   * 
   * Includes exponential backoff retry logic:
   * - Attempt 1: Immediate
   * - Attempt 2: 2s delay
   * - Attempt 3: 4s delay
   * 
   * @param submission - Video submission payload
   * @returns Created document ID or null if all retries fail
   */
  async createVideo(submission: VideoSubmission): Promise<string | null> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info('Submitting video to Sanity', {
          attempt,
          youtubeId: submission.youtubeId,
          category: submission.category,
          ageRange: submission.ageRange,
        });
        
        const result = await this.client.create(submission);
        
        logger.info('Video submitted successfully', {
          documentId: result._id,
          youtubeId: submission.youtubeId,
          category: submission.category,
          ageRange: submission.ageRange,
        });
        
        return result._id;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error('Sanity submission error', {
          attempt,
          maxRetries: this.maxRetries,
          error: errorMessage,
          youtubeId: submission.youtubeId,
        });
        
        // If this was the last attempt, return null
        if (attempt === this.maxRetries) {
          logger.error('All retry attempts failed', {
            youtubeId: submission.youtubeId,
            totalAttempts: attempt,
          });
          return null;
        }
        
        // Calculate exponential backoff delay
        const delay = this.retryDelayMs * attempt;
        
        logger.info('Retrying after delay', {
          attempt,
          nextAttempt: attempt + 1,
          delayMs: delay,
        });
        
        await this.sleep(delay);
      }
    }
    
    return null;
  }
  
  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
