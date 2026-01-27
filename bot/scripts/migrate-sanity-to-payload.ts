/**
 * Migrate videos from Sanity CMS to PayloadCMS
 * 
 * Features:
 * - Paginated migration (configurable batch size)
 * - Progress tracking and logging
 * - Retry logic with exponential backoff
 * - Dry-run mode for testing
 * - Resume capability with checkpoints
 * - Data transformation and validation
 * 
 * Usage:
 *   Dry run: MIGRATION_DRY_RUN=true deno run --allow-net --allow-env --allow-write scripts/migrate-sanity-to-payload.ts
 *   Production: deno run --allow-net --allow-env --allow-write scripts/migrate-sanity-to-payload.ts
 */

import * as logger from "../src/utils/logger.ts";
import { slugify } from "../src/services/payload.ts";

// Configuration
interface MigrationConfig {
  sanityProjectId: string;
  sanityDataset: string;
  sanityToken: string;
  payloadApiUrl: string;
  payloadApiKey: string;
  batchSize: number;
  dryRun: boolean;
  checkpointFile: string;
}

// Sanity video structure
interface SanityVideo {
  _id: string;
  _createdAt: string;
  title: string;
  slug: { current: string } | string;
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

// PayloadCMS video structure
interface PayloadVideo {
  title: string;
  slug: string;
  youtubeUrl?: string | null;
  youtubeId?: string | null;
  cloudinaryUrl?: string | null;
  cloudinaryId?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  category: string;
  ageRange: string;
  tags?: string[];
  source: string;
  createdAt: string;
}

// Migration statistics
interface MigrationStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
  skipped: number;
  startTime: number;
  lastCheckpoint: number;
}

// Checkpoint data
interface Checkpoint {
  lastProcessedIndex: number;
  stats: MigrationStats;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

/**
 * Get migration configuration from environment
 */
function getMigrationConfig(): MigrationConfig | null {
  const sanityProjectId = Deno.env.get("SANITY_PROJECT_ID");
  const sanityDataset = Deno.env.get("SANITY_DATASET");
  const sanityToken = Deno.env.get("SANITY_TOKEN");
  const payloadApiUrl = Deno.env.get("PAYLOAD_API_URL");
  const payloadApiKey = Deno.env.get("PAYLOAD_API_KEY");

  if (!sanityProjectId || !sanityDataset || !sanityToken) {
    logger.error("Sanity configuration missing");
    return null;
  }

  if (!payloadApiUrl || !payloadApiKey) {
    logger.error("PayloadCMS configuration missing");
    return null;
  }

  return {
    sanityProjectId,
    sanityDataset,
    sanityToken,
    payloadApiUrl,
    payloadApiKey,
    batchSize: parseInt(Deno.env.get("MIGRATION_BATCH_SIZE") || "100"),
    dryRun: Deno.env.get("MIGRATION_DRY_RUN") === "true",
    checkpointFile: "/Users/arjun/curatekids-bot/migration-checkpoint.json",
  };
}

/**
 * Load checkpoint from file
 */
async function loadCheckpoint(file: string): Promise<Checkpoint | null> {
  try {
    const data = await Deno.readTextFile(file);
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save checkpoint to file
 */
async function saveCheckpoint(file: string, checkpoint: Checkpoint): Promise<void> {
  await Deno.writeTextFile(file, JSON.stringify(checkpoint, null, 2));
}

/**
 * Fetch all videos from Sanity
 */
async function fetchSanityVideos(config: MigrationConfig): Promise<SanityVideo[]> {
  const query = `*[_type == "video"] | order(_createdAt asc) {
    _id,
    _createdAt,
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

  const url = `https://${config.sanityProjectId}.api.sanity.io/v2023-05-03/data/query/${config.sanityDataset}?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.sanityToken}`,
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
 * Transform Sanity video to PayloadCMS format
 */
function transformVideo(sanityVideo: SanityVideo): PayloadVideo {
  // Extract slug from object or use string directly
  const slug = typeof sanityVideo.slug === "object" && sanityVideo.slug !== null
    ? sanityVideo.slug.current
    : String(sanityVideo.slug);

  // Ensure slug is valid
  const validSlug = slug || slugify(sanityVideo.title);

  // Infer source if null (based on available fields)
  let source = sanityVideo.source;
  if (!source || source === "") {
    if (sanityVideo.youtubeId || sanityVideo.youtubeUrl) {
      source = "url";
      logger.warn(`Inferring source=url for video with youtubeId`, { slug: validSlug });
    } else if (sanityVideo.cloudinaryId || sanityVideo.cloudinaryUrl) {
      source = "telegram";
      logger.warn(`Inferring source=telegram for video with cloudinaryId`, { slug: validSlug });
    } else {
      // Default to url if no clear indicator
      source = "url";
      logger.warn(`Defaulting to source=url for video with unclear source`, { slug: validSlug });
    }
  }

  // Validate enums
  const validCategories = [
    "education",
    "entertainment",
    "music",
    "science",
    "arts-crafts",
    "sports",
    "nature",
    "stories",
  ];
  const validAgeRanges = ["0-2", "3-5", "6-8", "9-12", "13+"];

  if (!validCategories.includes(sanityVideo.category)) {
    logger.warn(`Invalid category: ${sanityVideo.category}, defaulting to 'entertainment'`);
  }

  if (!validAgeRanges.includes(sanityVideo.ageRange)) {
    logger.warn(`Invalid ageRange: ${sanityVideo.ageRange}, defaulting to '6-8'`);
  }

  return {
    title: sanityVideo.title,
    slug: validSlug,
    youtubeUrl: source === "url" ? (sanityVideo.youtubeUrl || null) : null,
    youtubeId: source === "url" ? (sanityVideo.youtubeId || null) : null,
    cloudinaryUrl: source === "telegram" ? (sanityVideo.cloudinaryUrl || null) : null,
    cloudinaryId: source === "telegram" ? (sanityVideo.cloudinaryId || null) : null,
    thumbnailUrl: sanityVideo.thumbnailUrl || null,
    duration: sanityVideo.duration || null,
    category: validCategories.includes(sanityVideo.category) ? sanityVideo.category : "entertainment",
    ageRange: validAgeRanges.includes(sanityVideo.ageRange) ? sanityVideo.ageRange : "6-8",
    tags: sanityVideo.tags || [],
    source: source,
    createdAt: sanityVideo._createdAt,
  };
}

/**
 * Import video to PayloadCMS with retry logic
 */
async function importToPayload(
  config: MigrationConfig,
  video: PayloadVideo,
  retryCount = 0
): Promise<boolean> {
  const url = `${config.payloadApiUrl}/api/videos`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `users API-Key ${config.payloadApiKey}`,
      },
      body: JSON.stringify(video),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayloadCMS API error: ${response.status} - ${errorText}`);
    }

    return true;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
      logger.warn(`Retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`, {
        slug: video.slug,
        error: error instanceof Error ? error.message : String(error),
      });
      await sleep(delay);
      return await importToPayload(config, video, retryCount + 1);
    }

    logger.error("Import failed after retries", {
      slug: video.slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a batch of videos
 */
async function processBatch(
  config: MigrationConfig,
  videos: SanityVideo[],
  stats: MigrationStats
): Promise<void> {
  for (const sanityVideo of videos) {
    try {
      // Transform video
      const payloadVideo = transformVideo(sanityVideo);

      if (config.dryRun) {
        logger.info("DRY RUN: Would import video", {
          title: payloadVideo.title,
          slug: payloadVideo.slug,
          source: payloadVideo.source,
        });
        stats.success++;
      } else {
        // Import to PayloadCMS
        const success = await importToPayload(config, payloadVideo);

        if (success) {
          stats.success++;
          logger.info("✅ Imported video", {
            title: payloadVideo.title,
            slug: payloadVideo.slug,
          });
        } else {
          stats.failed++;
          logger.error("❌ Failed to import video", {
            title: payloadVideo.title,
            slug: payloadVideo.slug,
          });
        }
      }

      stats.processed++;

      // Progress update every 10 videos
      if (stats.processed % 10 === 0) {
        const elapsed = Date.now() - stats.startTime;
        const rate = stats.processed / (elapsed / 1000 / 60); // videos per minute
        const remaining = stats.total - stats.processed;
        const estimatedMinutes = remaining / rate;

        logger.info(`📊 Progress: ${stats.processed}/${stats.total} (${Math.round(stats.processed / stats.total * 100)}%)`, {
          success: stats.success,
          failed: stats.failed,
          rate: `${Math.round(rate)} videos/min`,
          estimated: `${Math.round(estimatedMinutes)} min remaining`,
        });
      }
    } catch (error) {
      stats.failed++;
      logger.error("Error processing video", {
        videoId: sanityVideo._id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  logger.info("🚀 Starting Sanity to PayloadCMS migration...");

  // Load configuration
  const config = getMigrationConfig();
  if (!config) {
    logger.error("Cannot proceed without configuration");
    Deno.exit(1);
  }

  if (config.dryRun) {
    logger.info("🔍 DRY RUN MODE - No data will be imported");
  }

  // Load checkpoint if exists
  const checkpoint = await loadCheckpoint(config.checkpointFile);
  const startIndex = checkpoint?.lastProcessedIndex || 0;

  // Fetch all videos from Sanity
  logger.info("📥 Fetching videos from Sanity...");
  const sanityVideos = await fetchSanityVideos(config);
  logger.info(`Found ${sanityVideos.length} videos in Sanity`);

  if (startIndex > 0) {
    logger.info(`📍 Resuming from checkpoint at index ${startIndex}`);
  }

  // Initialize stats
  const stats: MigrationStats = checkpoint?.stats || {
    total: sanityVideos.length,
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now(),
    lastCheckpoint: 0,
  };

  // Process in batches
  for (let i = startIndex; i < sanityVideos.length; i += config.batchSize) {
    const batch = sanityVideos.slice(i, i + config.batchSize);
    const batchNum = Math.floor(i / config.batchSize) + 1;
    const totalBatches = Math.ceil(sanityVideos.length / config.batchSize);

    logger.info(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} videos)`);

    await processBatch(config, batch, stats);

    // Save checkpoint
    if (!config.dryRun) {
      await saveCheckpoint(config.checkpointFile, {
        lastProcessedIndex: i + batch.length,
        stats,
      });
    }
  }

  // Final summary
  const elapsed = Date.now() - stats.startTime;
  const minutes = Math.round(elapsed / 1000 / 60);

  logger.info("🎉 Migration complete!", {
    total: stats.total,
    success: stats.success,
    failed: stats.failed,
    skipped: stats.skipped,
    duration: `${minutes} minutes`,
    successRate: `${Math.round(stats.success / stats.total * 100)}%`,
  });

  if (stats.failed > 0) {
    logger.warn(`⚠️  ${stats.failed} videos failed to migrate - review logs for details`);
    Deno.exit(1);
  }

  // Clean up checkpoint file on success
  if (!config.dryRun && stats.failed === 0) {
    try {
      await Deno.remove(config.checkpointFile);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  Deno.exit(0);
}

// Run if executed directly
if (import.meta.main) {
  migrate().catch((error) => {
    logger.error("Migration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    Deno.exit(1);
  });
}
