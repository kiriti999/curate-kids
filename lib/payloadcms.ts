/**
 * PayloadCMS API Client
 *
 * Uses Payload's local API directly since frontend is now integrated.
 */

import config from "@payload-config";
import { getPayload } from "payload";
import type { ActivityLog, Category, Video } from "@/types/payload";
import { logger } from "@/utils/logger";

/**
 * Query parameters for filtering videos
 */
export interface GetVideosParams {
  category?: string;
  ageRange?: string;
  limit?: number;
  page?: number;
  search?: string;
}

/**
 * Query parameters for filtering categories
 */
export interface GetCategoriesParams {
  parent?: string | null;
  isAgeRangeRoot?: boolean;
  isVisible?: boolean;
  ageRange?: string;
  limit?: number;
  page?: number;
}

/**
 * Get Payload instance (cached)
 */
async function getPayloadClient() {
  return getPayload({ config });
}

/**
 * Build where clause for video queries
 */
function buildVideoWhereClause(params: GetVideosParams): Record<string, any> {
  const where: Record<string, any> = {
    // Only show approved videos by default
    status: { equals: "approved" },
  };

  if (params.category) {
    where.category = { equals: params.category };
  }

  if (params.ageRange) {
    where.ageRange = { equals: params.ageRange };
  }

  if (params.search) {
    where.title = { contains: params.search };
  }

  return where;
}

/**
 * Get videos with filtering and pagination using local API
 */
export async function getVideos(
  params: GetVideosParams = {},
): Promise<Video[]> {
  logger.debug("Getting videos", { params });

  try {
    const payload = await getPayloadClient();
    const where = buildVideoWhereClause(params);

    const result = await payload.find({
      collection: "videos",
      where,
      limit: params.limit || 50,
      page: params.page || 1,
      sort: "-createdAt",
    });

    logger.debug("Videos fetched", {
      count: result.docs.length,
      total: result.totalDocs,
    });
    return result.docs as Video[];
  } catch (error) {
    logger.error("Error fetching videos", { error });
    return [];
  }
}

/**
 * Get single video by slug
 */
export async function getVideoBySlug(slug: string): Promise<Video | null> {
  logger.debug("Getting video by slug", { slug });

  try {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "videos",
      where: { slug: { equals: slug } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      logger.warn("Video not found", { slug });
      return null;
    }

    return result.docs[0] as Video;
  } catch (error) {
    logger.error("Error fetching video by slug", { slug, error });
    return null;
  }
}

/**
 * Get single video by ID
 */
export async function getVideoById(id: string): Promise<Video | null> {
  logger.debug("Getting video by ID", { id });

  try {
    const payload = await getPayloadClient();
    const video = await payload.findByID({
      collection: "videos",
      id,
    });
    return video as Video;
  } catch (error) {
    logger.error("Error fetching video by ID", { id, error });
    return null;
  }
}

/**
 * Add parent filter to where clause
 */
function addParentFilter(
  where: Record<string, any>,
  parent: string | null | undefined,
) {
  if (parent !== undefined) {
    where.parent = parent === null ? { exists: false } : { equals: parent };
  }
}

/**
 * Build where clause for category queries
 */
function buildCategoryWhereClause(
  params: GetCategoriesParams,
): Record<string, any> {
  const where: Record<string, any> = {};

  addParentFilter(where, params.parent);

  if (params.isAgeRangeRoot !== undefined) {
    where.isAgeRangeRoot = { equals: params.isAgeRangeRoot };
  }

  if (params.isVisible !== undefined) {
    where.isVisible = { equals: params.isVisible };
  }

  if (params.ageRange) {
    where.ageRange = { equals: params.ageRange };
  }

  return where;
}

/**
 * Get categories with filtering and hierarchy support
 */
export async function getCategories(
  params: GetCategoriesParams = {},
): Promise<Category[]> {
  logger.debug("Getting categories", { params });

  try {
    const payload = await getPayloadClient();
    const where = buildCategoryWhereClause(params);

    const result = await payload.find({
      collection: "categories",
      where,
      limit: params.limit || 100,
      page: params.page || 1,
      sort: "sortOrder",
    });

    logger.debug("Categories fetched", {
      count: result.docs.length,
      total: result.totalDocs,
    });
    return result.docs as Category[];
  } catch (error) {
    logger.error("Error fetching categories", { error });
    return [];
  }
}

/**
 * Get single category by slug
 */
export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  logger.debug("Getting category by slug", { slug });

  try {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "categories",
      where: { slug: { equals: slug } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      logger.warn("Category not found", { slug });
      return null;
    }

    return result.docs[0] as Category;
  } catch (error) {
    logger.error("Error fetching category by slug", { slug, error });
    return null;
  }
}

/**
 * Get direct children of a category
 */
export async function getCategoryChildren(
  parentId: string,
): Promise<Category[]> {
  return getCategories({
    parent: parentId,
    isVisible: true,
  });
}

/**
 * Extract ancestor IDs from category full path
 */
function extractAncestorIds(category: Category): string[] {
  if (!category.fullPath || category.fullPath.length === 0) {
    return [];
  }

  return category.fullPath
    .slice(0, -1)
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id));
}

/**
 * Fetch categories by IDs
 */
async function fetchCategoriesByIds(
  payload: any,
  ids: string[],
): Promise<Category[]> {
  const categories: Category[] = [];

  for (const id of ids) {
    const cat = await payload.findByID({
      collection: "categories",
      id,
    });
    categories.push(cat as Category);
  }

  return categories;
}

/**
 * Get ancestors of a category for breadcrumb navigation
 */
export async function getCategoryAncestors(
  category: Category,
): Promise<Category[]> {
  logger.debug("Getting category ancestors", { categoryId: category.id });

  const ancestorIds = extractAncestorIds(category);

  if (ancestorIds.length === 0) {
    return [];
  }

  try {
    const payload = await getPayloadClient();
    return await fetchCategoriesByIds(payload, ancestorIds);
  } catch (error) {
    logger.error("Error fetching category ancestors", {
      categoryId: category.id,
      error,
    });
    return [];
  }
}

/**
 * Create activity log entry
 */
export async function createActivityLog(
  logData: Omit<ActivityLog, "id" | "createdAt" | "updatedAt">,
): Promise<ActivityLog | null> {
  logger.debug("Creating activity log", { actionType: logData.actionType });

  try {
    const payload = await getPayloadClient();

    const result = await payload.create({
      collection: "activity-logs",
      data: logData as any,
    });

    logger.debug("Activity log created", { id: result.id });
    return result as ActivityLog;
  } catch (error) {
    logger.warn("Failed to create activity log (non-critical)", { error });
    return null;
  }
}

/**
 * Helper: Generate session ID for tracking
 */
export function getSessionId(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }

  try {
    let sessionId = sessionStorage.getItem("payload_session_id");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("payload_session_id", sessionId);
    }

    return sessionId;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Helper: Anonymize IP address
 */
export function anonymizeIp(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    parts[3] = "0";
    return parts.join(".");
  }
  return ip;
}
