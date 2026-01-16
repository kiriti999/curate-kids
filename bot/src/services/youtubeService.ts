/**
 * YouTube Service
 * 
 * Fetches video metadata using YouTube Data API v3
 */

import { youtube_v3 } from '@googleapis/youtube';
import * as logger from '../utils/logger';

export interface VideoMetadata {
  title: string;
  videoId: string;
}

export class YouTubeService {
  private youtube: youtube_v3.Youtube;
  
  constructor(apiKey: string) {
    this.youtube = new youtube_v3.Youtube({
      auth: apiKey,
    });
  }
  
  /**
   * Get video metadata from YouTube API
   * 
   * @param videoId - 11-character YouTube video ID
   * @returns Video metadata or null if API call fails
   */
  async getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    try {
      logger.info('Fetching YouTube metadata', { videoId });
      
      const response = await this.youtube.videos.list({
        part: ['snippet'],
        id: [videoId],
      });
      
      const video = response.data.items?.[0];
      
      if (!video || !video.snippet?.title) {
        logger.warn('Video not found or missing title', { videoId });
        return null;
      }
      
      const metadata: VideoMetadata = {
        title: video.snippet.title,
        videoId,
      };
      
      logger.info('YouTube metadata fetched successfully', { videoId, title: metadata.title });
      
      return metadata;
      
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof Error && error.message.includes('quotaExceeded')) {
        logger.warn('YouTube API quota exceeded', { videoId, error: error.message });
        return null;
      }
      
      logger.error('YouTube API error', error instanceof Error ? error : { message: String(error) });
      return null;
    }
  }
}
