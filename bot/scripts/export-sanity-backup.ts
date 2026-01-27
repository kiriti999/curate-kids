/**
 * Export all Sanity data to JSON backup file
 * Usage: deno run --allow-net --allow-env --allow-write scripts/export-sanity-backup.ts
 */

import * as logger from "../src/utils/logger.ts";

interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
  apiVersion: string;
}

interface SanityVideo {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  title: string;
  slug: { current: string };
  youtubeUrl?: string;
  youtubeId?: string;
  cloudinaryUrl?: string;
  cloudinaryId?: string;
  thumbnailUrl?: string;
  duration?: number;
  category: string;
  ageRange: string;
  tags?: string[];
  source: string;
}

/**
 * Get Sanity configuration from environment
 */
function getSanityConfig(): SanityConfig | null {
  const projectId = Deno.env.get("SANITY_PROJECT_ID");
  const dataset = Deno.env.get("SANITY_DATASET");
  const token = Deno.env.get("SANITY_TOKEN");

  if (!projectId || !dataset || !token) {
    logger.error("Sanity configuration missing");
    return null;
  }

  return {
    projectId,
    dataset,
    token,
    apiVersion: "2023-05-03",
  };
}

/**
 * Query Sanity API
 */
async function querySanity(
  config: SanityConfig,
  query: string
): Promise<SanityVideo[]> {
  const url = `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sanity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.result;
}

/**
 * Main function
 */
async function main() {
  logger.info("📦 Exporting Sanity data backup...");

  const config = getSanityConfig();
  if (!config) {
    logger.error("Cannot proceed without Sanity configuration");
    Deno.exit(1);
  }

  try {
    // Query all videos
    const query = `*[_type == "video"]{
      _id,
      _createdAt,
      _updatedAt,
      title,
      slug,
      youtubeUrl,
      youtubeId,
      cloudinaryUrl,
      cloudinaryId,
      thumbnailUrl,
      duration,
      category,
      ageRange,
      tags,
      source
    }`;

    logger.info("Fetching all videos from Sanity...");
    const videos = await querySanity(config, query);

    logger.info(`✅ Exported ${videos.length} videos`);

    // Write to file
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const filename = `/Users/arjun/curatekids-bot/sanity-backup-${timestamp}.json`;
    
    const backupData = {
      exportDate: new Date().toISOString(),
      totalRecords: videos.length,
      source: {
        projectId: config.projectId,
        dataset: config.dataset,
      },
      videos,
    };

    await Deno.writeTextFile(filename, JSON.stringify(backupData, null, 2));
    logger.info(`💾 Backup saved to: ${filename}`);

    Deno.exit(0);
  } catch (error) {
    logger.error("Failed to export backup", {
      error: error instanceof Error ? error.message : String(error),
    });
    Deno.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
