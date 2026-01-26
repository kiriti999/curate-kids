/**
 * MongoDB service for video content management
 * Direct MongoDB Atlas connection (no PayloadCMS)
 */

import * as logger from "../utils/logger.ts";
import type { VideoCategory } from "../utils/keyboard.ts";
import type { AgeRange } from "../types/state.ts";
import { MongoClient, ObjectId } from "npm:mongodb@6.3.0";

// Video submission types
export interface VideoSubmission {
  title: string;
  slug: string;
  videoUrl: string;
  platform: "youtube" | "facebook" | "instagram" | "linkedin";
  videoId: string;
  category: VideoCategory;
  ageRange: AgeRange;
  tags: string[];
  source: "url";
  // Organization/multi-tenant fields
  organizationId?: string;
  submittedByUserId?: string;
  submitterTelegramId?: string;
  submitterTelegramUsername?: string;
  // Auto-approve setting (from org settings or env var)
  autoApprove?: boolean;
}

export interface TelegramVideoSubmission {
  title: string;
  slug: string;
  cloudinaryUrl: string;
  cloudinaryId: string;
  thumbnailUrl: string;
  duration: number;
  category: VideoCategory;
  ageRange: AgeRange;
  tags: string[];
  source: "telegram";
  // Organization/multi-tenant fields
  organizationId?: string;
  submittedByUserId?: string;
  submitterTelegramId?: string;
  submitterTelegramUsername?: string;
  // Auto-approve setting (from org settings or env var)
  autoApprove?: boolean;
}

// MongoDB video document interface
interface VideoDocument {
  _id?: ObjectId;
  title: string;
  slug: string;
  youtubeUrl?: string;
  youtubeId?: string;
  cloudinaryUrl?: string;
  cloudinaryId?: string;
  // IDs for other platforms
  linkedInId?: string;
  facebookId?: string;
  instagramId?: string;
  thumbnailUrl?: string;
  duration?: number;
  category: string;
  ageRange: string;
  tags: string[];
  source: "url" | "telegram";
  createdAt: Date;
  updatedAt: Date;
  // Organization/multi-tenant fields
  organization?: string;
  submittedBy?: string;
  submitterTelegramId?: string;
  submitterTelegramUsername?: string;
  status: "pending" | "approved" | "rejected";
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Global MongoDB client
let mongoClient: MongoClient | null = null;

/**
 * Get MongoDB connection URI from environment
 * @returns MongoDB URI or null if missing
 */
function getMongoConfig(): string | null {
  const mongoUri = Deno.env.get("MONGODB_URI");

  if (!mongoUri) {
    logger.error("MongoDB configuration missing - MONGODB_URI not set");
    return null;
  }

  return mongoUri;
}

/**
 * Get or create MongoDB client connection
 * @returns MongoClient instance or null on failure
 */
async function getMongoClient(): Promise<MongoClient | null> {
  if (mongoClient) {
    return mongoClient;
  }

  const mongoUri = getMongoConfig();
  if (!mongoUri) {
    return null;
  }

  try {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    logger.info("✅ MongoDB client connected");
    return mongoClient;
  } catch (error) {
    logger.error("MongoDB connection failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    mongoClient = null;
    return null;
  }
}

/**
 * Create a URL-based video in MongoDB
 * @param submission - Video submission data
 * @returns Document ID or null on failure
 */
export async function createVideo(submission: VideoSubmission): Promise<string | null> {
  const document: VideoDocument = {
    title: submission.title,
    slug: submission.slug,
    youtubeUrl: submission.platform === "youtube" ? submission.videoUrl : undefined,
    youtubeId: submission.platform === "youtube" ? submission.videoId : undefined,
    facebookId: submission.platform === "facebook" ? submission.videoId : undefined,
    instagramId: submission.platform === "instagram" ? submission.videoId : undefined,
    linkedInId: submission.platform === "linkedin" ? submission.videoId : undefined,
    category: submission.category,
    ageRange: submission.ageRange,
    tags: submission.tags,
    source: submission.source,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Organization/multi-tenant fields
    organization: submission.organizationId,
    submittedBy: submission.submittedByUserId,
    submitterTelegramId: submission.submitterTelegramId,
    submitterTelegramUsername: submission.submitterTelegramUsername,
    status: submission.autoApprove ? "approved" : "pending", // Auto-approve based on org settings or env var
  };

  return await insertVideo(document, submission.videoId);
}

/**
 * Create a Telegram-uploaded video in MongoDB
 * @param submission - Telegram video submission data
 * @returns Document ID or null on failure
 */
export async function createTelegramVideo(
  submission: TelegramVideoSubmission
): Promise<string | null> {
  const document: VideoDocument = {
    title: submission.title,
    slug: submission.slug,
    cloudinaryUrl: submission.cloudinaryUrl,
    cloudinaryId: submission.cloudinaryId,
    thumbnailUrl: submission.thumbnailUrl,
    duration: submission.duration,
    category: submission.category,
    ageRange: submission.ageRange,
    tags: submission.tags,
    source: submission.source,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Organization/multi-tenant fields
    organization: submission.organizationId,
    submittedBy: submission.submittedByUserId,
    submitterTelegramId: submission.submitterTelegramId,
    submitterTelegramUsername: submission.submitterTelegramUsername,
    status: submission.autoApprove ? "approved" : "pending", // Auto-approve based on org settings or env var
  };

  return await insertVideo(document, submission.cloudinaryId);
}

/**
 * Add platform-specific ID conditions to query
 */
function addPlatformIdConditions(document: VideoDocument): any[] {
  const conditions: any[] = [];
  
  if (document.youtubeId) {
    conditions.push({ youtubeId: document.youtubeId });
  }
  if (document.cloudinaryId) {
    conditions.push({ cloudinaryId: document.cloudinaryId });
  }
  if (document.linkedInId) {
    conditions.push({ linkedInId: document.linkedInId });
  }
  if (document.facebookId) {
    conditions.push({ facebookId: document.facebookId });
  }
  if (document.instagramId) {
    conditions.push({ instagramId: document.instagramId });
  }
  
  return conditions;
}

/**
 * Check if a video already exists with the same youtubeId/cloudinaryId in the same category + ageRange
 * @param collection - Videos collection
 * @param document - Video document to check
 * @returns Existing video document if duplicate found, null otherwise
 */
async function findDuplicateVideo(
  collection: any,
  document: VideoDocument
): Promise<VideoDocument | null> {
  const baseQuery: any = {
    category: document.category,
    ageRange: document.ageRange,
  };

  const orConditions = addPlatformIdConditions(document);

  if (orConditions.length === 0) {
    return null;
  }

  const query = { ...baseQuery, $or: orConditions };
  return await collection.findOne(query);
}

/**
 * Handle duplicate video detection
 */
async function handleDuplicate(
  duplicate: VideoDocument,
  identifier: string
): Promise<string> {
  logger.warn("Duplicate video detected", {
    existingId: duplicate._id?.toString(),
    existingTitle: duplicate.title,
    category: duplicate.category,
    ageRange: duplicate.ageRange,
    identifier,
  });
  return `DUPLICATE:${duplicate._id?.toString()}:${duplicate.title}`;
}

/**
 * Handle duplicate slug by appending timestamp
 */
async function ensureUniqueSlug(
  videos: any,
  document: VideoDocument
): Promise<void> {
  const existing = await videos.findOne({ slug: document.slug });
  if (!existing) return;
  
  const timestamp = Date.now();
  const originalSlug = document.slug;
  document.slug = `${document.slug}-${timestamp}`;
  
  logger.warn("Duplicate slug detected, appending timestamp", {
    originalSlug,
    newSlug: document.slug,
  });
}

/**
 * Perform single insert attempt
 */
async function attemptInsert(
  document: VideoDocument,
  identifier: string
): Promise<string | null> {
  const client = await getMongoClient();
  if (!client) {
    throw new Error("MongoDB client not available");
  }

  const db = client.db("curatekids");
  const videos = db.collection<VideoDocument>("videos");

  // Check for duplicate video
  const duplicate = await findDuplicateVideo(videos, document);
  if (duplicate) {
    return await handleDuplicate(duplicate, identifier);
  }

  // Ensure slug is unique
  await ensureUniqueSlug(videos, document);

  // Insert document
  const result = await videos.insertOne(document);
  const documentId = result.insertedId.toString();

  logger.info("Video created in MongoDB", { documentId, identifier });
  return documentId;
}

/**
 * Insert video document into MongoDB with retry logic
 * @param document - Video document to insert
 * @param identifier - Identifier for logging
 * @returns Document ID or null on failure
 */
async function insertVideo(
  document: VideoDocument,
  identifier: string
): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info("Inserting video to MongoDB", { attempt, identifier });
      return await attemptInsert(document, identifier);
    } catch (error) {
      logger.error("MongoDB insertion error", {
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt === MAX_RETRIES) {
        logger.error("All retry attempts failed", { identifier });
        return null;
      }

      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate URL-friendly slug from text
 * @param text - Text to slugify
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 96);
}

/**
 * Validate MongoDB connection on startup
 * @returns true if connection is valid, false otherwise
 */
export async function validateConnection(): Promise<boolean> {
  try {
    logger.info("Validating MongoDB connection...");

    const client = await getMongoClient();
    if (!client) {
      logger.error("MongoDB connection validation failed - client not available");
      return false;
    }

    const db = client.db("curatekids");
    const videos = db.collection<VideoDocument>("videos");

    // Test connection by counting documents
    const count = await videos.countDocuments();

    logger.info("✅ MongoDB connection validated", {
      database: "curatekids",
      collection: "videos",
      totalDocs: count,
    });

    // Create indexes if they don't exist
    await ensureIndexes(videos);

    return true;
  } catch (error) {
    logger.error("MongoDB connection error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Create necessary indexes for the videos collection
 * @param collection - Videos collection
 */
async function ensureIndexes(collection: any): Promise<void> {
  try {
    await collection.createIndex({ slug: 1 }, { unique: true, name: "slug_unique" });
    await collection.createIndex({ category: 1 }, { name: "category_index" });
    await collection.createIndex({ ageRange: 1 }, { name: "ageRange_index" });
    await collection.createIndex({ createdAt: -1 }, { name: "createdAt_index" });
    await collection.createIndex({ category: 1, ageRange: 1 }, { name: "category_ageRange_compound" });
    // Multi-tenant indexes
    await collection.createIndex({ organization: 1 }, { name: "organization_index" });
    await collection.createIndex({ status: 1 }, { name: "status_index" });
    await collection.createIndex({ organization: 1, status: 1 }, { name: "org_status_compound" });
    await collection.createIndex({ submittedBy: 1 }, { name: "submittedBy_index" });
    logger.info("✅ MongoDB indexes created/verified");
  } catch (error) {
    logger.warn("Index creation warning (may already exist)", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

