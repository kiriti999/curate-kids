/**
 * Count total videos in Sanity CMS
 * Usage: deno run --allow-net --allow-env scripts/count-sanity-videos.ts
 */

import * as logger from "../src/utils/logger.ts";

interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
  apiVersion: string;
}

/**
 * Get Sanity configuration from environment
 */
function getSanityConfig(): SanityConfig | null {
  const projectId = Deno.env.get("SANITY_PROJECT_ID");
  const dataset = Deno.env.get("SANITY_DATASET");
  const token = Deno.env.get("SANITY_TOKEN");

  if (!projectId || !dataset || !token) {
    logger.error("Sanity configuration missing", {
      hasProjectId: !!projectId,
      hasDataset: !!dataset,
      hasToken: !!token,
    });
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
): Promise<unknown> {
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
  logger.info("🔍 Counting videos in Sanity CMS...");

  const config = getSanityConfig();
  if (!config) {
    logger.error("Cannot proceed without Sanity configuration");
    Deno.exit(1);
  }

  try {
    // Count query
    const countQuery = `count(*[_type == "video"])`;
    const count = await querySanity(config, countQuery);

    logger.info(`✅ Total videos in Sanity: ${count}`);
    
    // Estimate migration time
    const estimatedMinutes = Math.ceil(Number(count) / 100);
    logger.info(`⏱️  Estimated migration time: ${estimatedMinutes} minutes (at ~100 records/minute)`);

    Deno.exit(0);
  } catch (error) {
    logger.error("Failed to count videos", {
      error: error instanceof Error ? error.message : String(error),
    });
    Deno.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
