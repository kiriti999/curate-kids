/**
 * YouTube API service
 */

import * as logger from "../utils/logger.ts";

export interface VideoMetadata {
  title: string;
  description: string;
  duration: number;
  embeddable: boolean;
  thumbnailUrl: string;
}

export async function getYouTubeMetadata(videoId: string): Promise<VideoMetadata | null> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");

  if (!apiKey) {
    logger.warn("YouTube API key not configured");
    return null;
  }

  try {
    // Added 'status' part to get embeddable flag
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,status`;
    const response = await fetch(url);

    if (!response.ok) {
      logger.error("YouTube API error", { status: response.status });
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      logger.warn("Video not found", { videoId });
      return null;
    }

    const item = data.items[0];
    const embeddable = item.status?.embeddable ?? false;

    // Get best available thumbnail
    const thumbnails = item.snippet.thumbnails;
    const thumbnailUrl = thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url || "";

    logger.info("YouTube metadata fetched", {
      videoId,
      title: item.snippet.title,
      embeddable
    });

    return {
      title: item.snippet.title,
      description: item.snippet.description,
      duration: parseDuration(item.contentDetails.duration),
      embeddable,
      thumbnailUrl,
    };
  } catch (error) {
    logger.error("YouTube API fetch error", error instanceof Error ? error : { message: String(error) });
    return null;
  }
}

/**
 * Check if a video can be embedded on external websites
 */
export async function isVideoEmbeddable(videoId: string): Promise<boolean> {
  const metadata = await getYouTubeMetadata(videoId);
  return metadata?.embeddable ?? false;
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

