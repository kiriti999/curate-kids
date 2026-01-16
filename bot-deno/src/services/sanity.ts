/**
 * Sanity CMS service
 */

import * as logger from "../utils/logger.ts";
import { AgeRange } from "../config/ageRangeGroups.ts";
import { VideoCategory } from "../utils/keyboard.ts";

export interface VideoSubmission {
  _type: "video";
  title: string;
  slug: { _type: "slug"; current: string };
  youtubeUrl: string;
  youtubeId: string;
  category: VideoCategory;
  ageRange: AgeRange;
  tags: string[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export async function createVideo(submission: VideoSubmission): Promise<string | null> {
  const projectId = Deno.env.get("SANITY_PROJECT_ID");
  const dataset = Deno.env.get("SANITY_DATASET");
  const token = Deno.env.get("SANITY_TOKEN");
  
  if (!projectId || !dataset || !token) {
    logger.error("Sanity configuration missing");
    return null;
  }
  
  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info("Submitting to Sanity", { attempt, videoId: submission.youtubeId });
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          mutations: [{ create: submission }],
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sanity API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      const documentId = result.results?.[0]?.id;
      
      logger.info("Video created in Sanity", { documentId, videoId: submission.youtubeId });
      return documentId;
      
    } catch (error) {
      logger.error("Sanity submission error", {
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
      
      if (attempt === MAX_RETRIES) {
        logger.error("All retry attempts failed", { videoId: submission.youtubeId });
        return null;
      }
      
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 96);
}
