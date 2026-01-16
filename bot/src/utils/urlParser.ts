/**
 * Video URL Parser
 * 
 * Extracts video URLs from various platforms:
 * - YouTube
 * - Facebook
 * - Instagram
 * - LinkedIn
 */

export type VideoPlatform = 'youtube' | 'facebook' | 'instagram' | 'linkedin';

export interface ParsedVideo {
  platform: VideoPlatform;
  url: string;
  videoId: string | null;  // Only available for YouTube
}

export class VideoUrlParser {
  // YouTube URL patterns (extracts video ID)
  private static readonly YOUTUBE_PATTERNS = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  // Platform detection patterns
  private static readonly PLATFORM_PATTERNS: { platform: VideoPlatform; pattern: RegExp }[] = [
    { platform: 'youtube', pattern: /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|m\.youtube\.com)[^\s]+)/ },
    { platform: 'facebook', pattern: /(https?:\/\/(?:www\.)?(?:facebook\.com|fb\.watch|fb\.com)[^\s]+(?:video|watch|reel)[^\s]*)/ },
    { platform: 'facebook', pattern: /(https?:\/\/(?:www\.)?facebook\.com\/[^\s]+\/videos\/[^\s]+)/ },
    { platform: 'facebook', pattern: /(https?:\/\/fb\.watch\/[^\s]+)/ },
    { platform: 'instagram', pattern: /(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/[^\s]+)/ },
    { platform: 'linkedin', pattern: /(https?:\/\/(?:www\.)?linkedin\.com\/(?:posts|feed|video)\/[^\s]+)/ },
  ];

  /**
   * Check if message contains any supported video URL
   */
  hasVideoUrl(text: string): boolean {
    return VideoUrlParser.PLATFORM_PATTERNS.some(({ pattern }) => pattern.test(text));
  }

  /**
   * Parse video URL from message text
   * @returns ParsedVideo with platform, url, and videoId (for YouTube)
   */
  parseVideoUrl(text: string): ParsedVideo | null {
    for (const { platform, pattern } of VideoUrlParser.PLATFORM_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const url = match[1];
        return {
          platform,
          url,
          videoId: platform === 'youtube' ? this.extractYouTubeVideoId(url) : null,
        };
      }
    }
    return null;
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeVideoId(url: string): string | null {
    for (const pattern of VideoUrlParser.YOUTUBE_PATTERNS) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Get display name for platform
   */
  static getPlatformDisplayName(platform: VideoPlatform): string {
    const names: Record<VideoPlatform, string> = {
      youtube: 'YouTube',
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
    };
    return names[platform];
  }
}

// Backward compatibility alias
export { VideoUrlParser as YouTubeUrlParser };
