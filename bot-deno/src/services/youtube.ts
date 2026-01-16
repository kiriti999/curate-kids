/**
 * YouTube API service
 */

import * as logger from "../utils/logger.ts";

export interface VideoMetadata {
  title: string;
  description: string;
  duration: number;
}

export async function getYouTubeMetadata(videoId: string): Promise<VideoMetadata | null> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  
  if (!apiKey) {
    logger.warn("YouTube API key not configured");
    return null;
  }
  
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`;
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
    
    return {
      title: item.snippet.title,
      description: item.snippet.description,
      duration: parseDuration(item.contentDetails.duration),
    };
  } catch (error) {
    logger.error("YouTube API fetch error", error instanceof Error ? error : { message: String(error) });
    return null;
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}
