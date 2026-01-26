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
  { platform: "facebook", pattern: /(https?:\/\/(?:www\.)?facebook\.com\/share\/[^\s]+)/ },
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
        videoId: extractVideoId(platform, url),
      };
    }
  }
  return null;
}

function extractYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const result = matchPattern(url, pattern);
    if (result) return result;
  }
  return null;
}

/**
 * Try to match URL with a single pattern
 */
function matchPattern(url: string, pattern: RegExp): string | null {
  const match = url.match(pattern);
  return match?.[1] || null;
}

/**
 * Extract Facebook video ID from URL
 * Handles: /videos/123, /watch?v=123, /reel/123, fb.watch/xxx
 */
function extractFacebookVideoId(url: string): string | null {
  const patterns = [
    /facebook\.com\/(?:[^/]+\/)?videos\/(\d+)/,
    /facebook\.com\/watch\/?\?v=(\d+)/,
    /facebook\.com\/reel\/(\d+)/,
    /fb\.watch\/([a-zA-Z0-9_-]+)/,
    /facebook\.com\/share\/v\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const result = matchPattern(url, pattern);
    if (result) return result;
  }
  return null;
}

/**
 * Extract Instagram video ID from URL
 * Handles: /p/xxx, /reel/xxx, /reels/xxx, /tv/xxx
 */
function extractInstagramVideoId(url: string): string | null {
  const pattern = /instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/;
  const match = url.match(pattern);
  return match?.[1] || null;
}

/**
 * Extract LinkedIn video ID from URL
 * Handles: /posts/xxx, /feed/update/urn:li:activity:xxx, /video/xxx
 */
function extractLinkedInVideoId(url: string): string | null {
  const patterns = [
    /linkedin\.com\/posts\/[^/]+-(\d+)-/,
    /linkedin\.com\/feed\/update\/urn:li:(?:activity|ugcPost):(\d+)/,
    /linkedin\.com\/video\/[^/]+-(\d+)/,
    /linkedin\.com\/embed\/feed\/update\/urn:li:(?:share|ugcPost):(\d+)/,
  ];
  for (const pattern of patterns) {
    const result = matchPattern(url, pattern);
    if (result) return result;
  }
  return null;
}

/**
 * Extract video ID based on platform
 */
export function extractVideoId(platform: VideoPlatform, url: string): string | null {
  switch (platform) {
    case "youtube":
      return extractYouTubeVideoId(url);
    case "facebook":
      return extractFacebookVideoId(url);
    case "instagram":
      return extractInstagramVideoId(url);
    case "linkedin":
      return extractLinkedInVideoId(url);
    default:
      return null;
  }
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
