/**
 * Video URL Parser
 * Only YouTube links are accepted. Any other link is detected so the bot can
 * reply that it isn't supported.
 */

export type VideoPlatform = "youtube";

export interface ParsedVideo {
  platform: VideoPlatform;
  url: string;
  videoId: string;
}

const YOUTUBE_URL_PATTERN = /(https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s]+)/;

const YOUTUBE_ID_PATTERNS = [
  /youtube\.com\/watch\?(?:[^\s]*&)?v=([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/(?:embed|live|shorts|v)\/([a-zA-Z0-9_-]{11})/,
];

/** True if the text contains any http(s) link */
export function hasLink(text: string): boolean {
  return /https?:\/\/\S+/.test(text);
}

/** Parse a YouTube video link from text; returns null for anything else */
export function parseVideoUrl(text: string): ParsedVideo | null {
  const url = text.match(YOUTUBE_URL_PATTERN)?.[1];
  if (!url) return null;
  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const videoId = url.match(pattern)?.[1];
    if (videoId) return { platform: "youtube", url, videoId };
  }
  return null;
}
