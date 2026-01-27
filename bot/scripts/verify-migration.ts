/**
 * Verify migration integrity between Sanity and PayloadCMS
 * 
 * Verification checks:
 * 1. Record count match (Sanity === PayloadCMS)
 * 2. Random sampling (100 records field-by-field comparison)
 * 3. Required fields validation
 * 4. Slug uniqueness check
 * 5. Enum value validation
 * 6. Conditional field validation (source-based)
 * 
 * Usage: deno run --allow-net --allow-env --allow-write scripts/verify-migration.ts
 */

import * as logger from "../src/utils/logger.ts";

interface VerificationConfig {
  sanityProjectId: string;
  sanityDataset: string;
  sanityToken: string;
  payloadApiUrl: string;
  payloadApiKey: string;
  sampleSize: number;
  reportFile: string;
}

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

interface PayloadVideo {
  id: string;
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

interface VerificationReport {
  timestamp: string;
  checks: {
    recordCount: {
      passed: boolean;
      sanityCount: number;
      payloadCount: number;
    };
    randomSampling: {
      passed: boolean;
      sampleSize: number;
      matched: number;
      mismatched: number;
      discrepancies: Array<{
        slug: string;
        field: string;
        sanityValue: unknown;
        payloadValue: unknown;
      }>;
    };
    requiredFields: {
      passed: boolean;
      totalChecked: number;
      violations: Array<{
        slug: string;
        missingFields: string[];
      }>;
    };
    slugUniqueness: {
      passed: boolean;
      totalSlugs: number;
      duplicates: string[];
    };
    enumValidation: {
      passed: boolean;
      totalChecked: number;
      invalidValues: Array<{
        slug: string;
        field: string;
        value: string;
      }>;
    };
    conditionalFields: {
      passed: boolean;
      totalChecked: number;
      violations: Array<{
        slug: string;
        issue: string;
      }>;
    };
  };
  summary: {
    allChecksPassed: boolean;
    failedChecks: string[];
  };
}

/**
 * Get verification configuration from environment
 */
function getVerificationConfig(): VerificationConfig | null {
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
    sampleSize: 100,
    reportFile: "/Users/arjun/curatekids-bot/verification-report.json",
  };
}

/**
 * Count videos in Sanity
 */
async function countSanityVideos(config: VerificationConfig): Promise<number> {
  const query = `count(*[_type == "video"])`;
  const url = `https://${config.sanityProjectId}.api.sanity.io/v2023-05-03/data/query/${config.sanityDataset}?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.sanityToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Sanity API error: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

/**
 * Count videos in PayloadCMS
 */
async function countPayloadVideos(config: VerificationConfig): Promise<number> {
  const url = `${config.payloadApiUrl}/api/videos?limit=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: `users API-Key ${config.payloadApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`PayloadCMS API error: ${response.status}`);
  }

  const data = await response.json();
  return data.totalDocs;
}

/**
 * Fetch random sample from Sanity
 */
async function fetchSanitySample(
  config: VerificationConfig,
  sampleSize: number
): Promise<SanityVideo[]> {
  // First get all slugs
  const slugQuery = `*[_type == "video"].slug.current`;
  const slugUrl = `https://${config.sanityProjectId}.api.sanity.io/v2023-05-03/data/query/${config.sanityDataset}?query=${encodeURIComponent(slugQuery)}`;

  const slugResponse = await fetch(slugUrl, {
    headers: {
      Authorization: `Bearer ${config.sanityToken}`,
    },
  });

  const slugData = await slugResponse.json();
  const allSlugs = slugData.result;

  // Randomly select slugs
  const selectedSlugs = [];
  const usedIndices = new Set<number>();

  while (selectedSlugs.length < Math.min(sampleSize, allSlugs.length)) {
    const randomIndex = Math.floor(Math.random() * allSlugs.length);
    if (!usedIndices.has(randomIndex)) {
      selectedSlugs.push(allSlugs[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }

  // Fetch full records
  const videoQuery = `*[_type == "video" && slug.current in [${selectedSlugs.map(s => `"${s}"`).join(",")}]]{
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

  const videoUrl = `https://${config.sanityProjectId}.api.sanity.io/v2023-05-03/data/query/${config.sanityDataset}?query=${encodeURIComponent(videoQuery)}`;

  const videoResponse = await fetch(videoUrl, {
    headers: {
      Authorization: `Bearer ${config.sanityToken}`,
    },
  });

  const videoData = await videoResponse.json();
  return videoData.result;
}

/**
 * Fetch videos from PayloadCMS by slugs
 */
async function fetchPayloadBySlugs(
  config: VerificationConfig,
  slugs: string[]
): Promise<Map<string, PayloadVideo>> {
  const videos = new Map<string, PayloadVideo>();

  for (const slug of slugs) {
    const url = `${config.payloadApiUrl}/api/videos?where[slug][equals]=${encodeURIComponent(slug)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `users API-Key ${config.payloadApiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.docs && data.docs.length > 0) {
        videos.set(slug, data.docs[0]);
      }
    }
  }

  return videos;
}

/**
 * Fetch all videos from PayloadCMS
 */
async function fetchAllPayloadVideos(config: VerificationConfig): Promise<PayloadVideo[]> {
  const videos: PayloadVideo[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const url = `${config.payloadApiUrl}/api/videos?limit=${limit}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `users API-Key ${config.payloadApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`PayloadCMS API error: ${response.status}`);
    }

    const data = await response.json();
    videos.push(...data.docs);

    if (!data.hasNextPage) {
      break;
    }

    page++;
  }

  return videos;
}

/**
 * Compare two videos field by field
 */
function compareVideos(
  sanityVideo: SanityVideo,
  payloadVideo: PayloadVideo
): Array<{ field: string; sanityValue: unknown; payloadValue: unknown }> {
  const discrepancies = [];

  // Extract slug
  const sanitySlug = typeof sanityVideo.slug === "object" && sanityVideo.slug !== null
    ? sanityVideo.slug.current
    : String(sanityVideo.slug);

  // Compare fields
  if (sanityVideo.title !== payloadVideo.title) {
    discrepancies.push({
      field: "title",
      sanityValue: sanityVideo.title,
      payloadValue: payloadVideo.title,
    });
  }

  if (sanitySlug !== payloadVideo.slug) {
    discrepancies.push({
      field: "slug",
      sanityValue: sanitySlug,
      payloadValue: payloadVideo.slug,
    });
  }

  if (sanityVideo.category !== payloadVideo.category) {
    discrepancies.push({
      field: "category",
      sanityValue: sanityVideo.category,
      payloadValue: payloadVideo.category,
    });
  }

  if (sanityVideo.ageRange !== payloadVideo.ageRange) {
    discrepancies.push({
      field: "ageRange",
      sanityValue: sanityVideo.ageRange,
      payloadValue: payloadVideo.ageRange,
    });
  }

  if (sanityVideo.source !== payloadVideo.source) {
    discrepancies.push({
      field: "source",
      sanityValue: sanityVideo.source,
      payloadValue: payloadVideo.source,
    });
  }

  return discrepancies;
}

/**
 * Main verification function
 */
async function verify() {
  logger.info("🔍 Starting migration verification...");

  const config = getVerificationConfig();
  if (!config) {
    logger.error("Cannot proceed without configuration");
    Deno.exit(1);
  }

  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    checks: {
      recordCount: { passed: false, sanityCount: 0, payloadCount: 0 },
      randomSampling: {
        passed: false,
        sampleSize: 0,
        matched: 0,
        mismatched: 0,
        discrepancies: [],
      },
      requiredFields: { passed: false, totalChecked: 0, violations: [] },
      slugUniqueness: { passed: false, totalSlugs: 0, duplicates: [] },
      enumValidation: { passed: false, totalChecked: 0, invalidValues: [] },
      conditionalFields: { passed: false, totalChecked: 0, violations: [] },
    },
    summary: {
      allChecksPassed: false,
      failedChecks: [],
    },
  };

  try {
    // Check 1: Record count
    logger.info("1️⃣  Checking record count...");
    const sanityCount = await countSanityVideos(config);
    const payloadCount = await countPayloadVideos(config);

    report.checks.recordCount = {
      passed: sanityCount === payloadCount,
      sanityCount,
      payloadCount,
    };

    if (report.checks.recordCount.passed) {
      logger.info(`✅ Record count matches: ${sanityCount}`);
    } else {
      logger.error(`❌ Record count mismatch: Sanity=${sanityCount}, Payload=${payloadCount}`);
      report.summary.failedChecks.push("recordCount");
    }

    // Check 2: Random sampling
    logger.info("2️⃣  Checking random sample...");
    const sanitySample = await fetchSanitySample(config, config.sampleSize);
    const sampleSlugs = sanitySample.map(v =>
      typeof v.slug === "object" ? v.slug.current : String(v.slug)
    );
    const payloadSample = await fetchPayloadBySlugs(config, sampleSlugs);

    report.checks.randomSampling.sampleSize = sanitySample.length;

    for (const sanityVideo of sanitySample) {
      const sanitySlug = typeof sanityVideo.slug === "object"
        ? sanityVideo.slug.current
        : String(sanityVideo.slug);
      const payloadVideo = payloadSample.get(sanitySlug);

      if (!payloadVideo) {
        report.checks.randomSampling.mismatched++;
        report.checks.randomSampling.discrepancies.push({
          slug: sanitySlug,
          field: "_missing",
          sanityValue: "exists",
          payloadValue: "not found",
        });
        continue;
      }

      const discrepancies = compareVideos(sanityVideo, payloadVideo);

      if (discrepancies.length === 0) {
        report.checks.randomSampling.matched++;
      } else {
        report.checks.randomSampling.mismatched++;
        for (const disc of discrepancies) {
          report.checks.randomSampling.discrepancies.push({
            slug: sanitySlug,
            ...disc,
          });
        }
      }
    }

    report.checks.randomSampling.passed = report.checks.randomSampling.mismatched === 0;

    if (report.checks.randomSampling.passed) {
      logger.info(`✅ Random sample matches: ${report.checks.randomSampling.matched}/${report.checks.randomSampling.sampleSize}`);
    } else {
      logger.error(`❌ Random sample mismatches: ${report.checks.randomSampling.mismatched}/${report.checks.randomSampling.sampleSize}`);
      report.summary.failedChecks.push("randomSampling");
    }

    // Check 3: Required fields
    logger.info("3️⃣  Checking required fields...");
    const allPayloadVideos = await fetchAllPayloadVideos(config);
    report.checks.requiredFields.totalChecked = allPayloadVideos.length;

    for (const video of allPayloadVideos) {
      const missingFields = [];

      if (!video.title || video.title.trim() === "") missingFields.push("title");
      if (!video.slug || video.slug.trim() === "") missingFields.push("slug");
      if (!video.category) missingFields.push("category");
      if (!video.ageRange) missingFields.push("ageRange");
      if (!video.source) missingFields.push("source");

      if (missingFields.length > 0) {
        report.checks.requiredFields.violations.push({
          slug: video.slug,
          missingFields,
        });
      }
    }

    report.checks.requiredFields.passed = report.checks.requiredFields.violations.length === 0;

    if (report.checks.requiredFields.passed) {
      logger.info(`✅ All required fields populated`);
    } else {
      logger.error(`❌ Missing required fields in ${report.checks.requiredFields.violations.length} videos`);
      report.summary.failedChecks.push("requiredFields");
    }

    // Check 4: Slug uniqueness
    logger.info("4️⃣  Checking slug uniqueness...");
    const slugCounts = new Map<string, number>();

    for (const video of allPayloadVideos) {
      const count = slugCounts.get(video.slug) || 0;
      slugCounts.set(video.slug, count + 1);
    }

    report.checks.slugUniqueness.totalSlugs = slugCounts.size;

    for (const [slug, count] of slugCounts) {
      if (count > 1) {
        report.checks.slugUniqueness.duplicates.push(slug);
      }
    }

    report.checks.slugUniqueness.passed = report.checks.slugUniqueness.duplicates.length === 0;

    if (report.checks.slugUniqueness.passed) {
      logger.info(`✅ All slugs unique: ${report.checks.slugUniqueness.totalSlugs}`);
    } else {
      logger.error(`❌ Duplicate slugs found: ${report.checks.slugUniqueness.duplicates.length}`);
      report.summary.failedChecks.push("slugUniqueness");
    }

    // Check 5: Enum validation
    logger.info("5️⃣  Checking enum values...");
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
    const validSources = ["url", "telegram"];

    report.checks.enumValidation.totalChecked = allPayloadVideos.length;

    for (const video of allPayloadVideos) {
      if (!validCategories.includes(video.category)) {
        report.checks.enumValidation.invalidValues.push({
          slug: video.slug,
          field: "category",
          value: video.category,
        });
      }

      if (!validAgeRanges.includes(video.ageRange)) {
        report.checks.enumValidation.invalidValues.push({
          slug: video.slug,
          field: "ageRange",
          value: video.ageRange,
        });
      }

      if (!validSources.includes(video.source)) {
        report.checks.enumValidation.invalidValues.push({
          slug: video.slug,
          field: "source",
          value: video.source,
        });
      }
    }

    report.checks.enumValidation.passed = report.checks.enumValidation.invalidValues.length === 0;

    if (report.checks.enumValidation.passed) {
      logger.info(`✅ All enum values valid`);
    } else {
      logger.error(`❌ Invalid enum values found: ${report.checks.enumValidation.invalidValues.length}`);
      report.summary.failedChecks.push("enumValidation");
    }

    // Check 6: Conditional fields
    logger.info("6️⃣  Checking conditional fields...");
    report.checks.conditionalFields.totalChecked = allPayloadVideos.length;

    for (const video of allPayloadVideos) {
      if (video.source === "url") {
        if (!video.youtubeUrl || !video.youtubeId) {
          report.checks.conditionalFields.violations.push({
            slug: video.slug,
            issue: "source=url requires youtubeUrl and youtubeId",
          });
        }
      } else if (video.source === "telegram") {
        if (!video.cloudinaryUrl || !video.cloudinaryId) {
          report.checks.conditionalFields.violations.push({
            slug: video.slug,
            issue: "source=telegram requires cloudinaryUrl and cloudinaryId",
          });
        }
      }
    }

    report.checks.conditionalFields.passed = report.checks.conditionalFields.violations.length === 0;

    if (report.checks.conditionalFields.passed) {
      logger.info(`✅ All conditional fields valid`);
    } else {
      logger.error(`❌ Conditional field violations: ${report.checks.conditionalFields.violations.length}`);
      report.summary.failedChecks.push("conditionalFields");
    }

    // Summary
    report.summary.allChecksPassed = report.summary.failedChecks.length === 0;

    // Write report
    await Deno.writeTextFile(config.reportFile, JSON.stringify(report, null, 2));
    logger.info(`📄 Verification report saved to: ${config.reportFile}`);

    // Final result
    if (report.summary.allChecksPassed) {
      logger.info("🎉 All verification checks passed!");
      Deno.exit(0);
    } else {
      logger.error(`❌ Verification failed: ${report.summary.failedChecks.join(", ")}`);
      Deno.exit(1);
    }
  } catch (error) {
    logger.error("Verification failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    Deno.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  verify();
}
