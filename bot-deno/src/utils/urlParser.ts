/**
 * Video URL Parser
 * Supports: YouTube, Facebook, Instagram, LinkedIn
 */

export type VideoPlatform = "youtube" | "facebook" | "instagram" | "linkedin";

export interface ParsedVideo {
  platform: VideoPlatform;
  url: string;
  videoId: string | null;
}

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

const PLATFORM_PATTERNS: { platform: VideoPlatform; pattern: RegExp }[] = [
  { platform: "youtube", pattern: /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|m\.youtube\.com)[^\s]+)/ },
  { platform: "facebook", pattern: /(https?:\/\/(?:www\.)?(?:facebook\.com|fb\.watch|fb\.com)[^\s]*(?:video|watch|reel)[^\s]*)/ },
  { platform: "facebook", pattern: /(https?:\/\/(?:www\.)?facebook\.com\/[^\s]+\/videos\/[^\s]+)/ },
  { platform: "facebook", pattern: /(https?:\/\/fb\.watch\/[^\s]+)/ },
  { platform: "instagram", pattern: /(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/[^\s]+)/ },
  { platform: "linkedin", pattern: /(https?:\/\/(?:www\.)?linkedin\.com\/(?:posts|feed|video)\/[^\s]+)/ },
];

export function hasVideoUrl(text: string): boolean {
  return PLATFORM_PATTERNS.some(({ pattern }) => pattern.test(text));
}

export function parseVideoUrl(text: string): ParsedVideo | null {
  for (const { platform, pattern } of PLATFORM_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const url = match[1];
      return {
        platform,
        url,
        videoId: platform === "youtube" ? extractYouTubeVideoId(url) : null,
      };
    }
  }
  return null;
}

function extractYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function getPlatformDisplayName(platform: VideoPlatform): string {
  const names: Record<VideoPlatform, string> = {
    youtube: "YouTube",
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
  };
  return names[platform];
}

export function getPlatformEmoji(platform: VideoPlatform): string {
  const emojis: Record<VideoPlatform, string> = {
    youtube: "🎬",
    facebook: "📘",
    instagram: "📸",
    linkedin: "💼",
  };
  return emojis[platform];
}
