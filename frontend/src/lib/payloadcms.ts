/**
 * PayloadCMS API Client
 * 
 * Provides type-safe wrapper functions for PayloadCMS REST API with retry logic,
 * caching, and error handling. Handles frontend data fetching from PayloadCMS API.
 */

import { logger } from '../../../utils/logger'
import { withRetry } from '../../../utils/retry'
import type { 
  Video, 
  Category, 
  ActivityLog 
} from '../../../types/payload'

/**
 * PayloadCMS API configuration
 */
const PAYLOAD_API_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000'
const CACHE_REVALIDATE_SECONDS = 300 // 5 minutes

/**
 * Query parameters for filtering videos
 */
export interface GetVideosParams {
  category?: string
  ageRange?: string
  limit?: number
  page?: number
  search?: string
}

/**
 * Query parameters for filtering categories
 */
export interface GetCategoriesParams {
  parent?: string | null
  isAgeRangeRoot?: boolean
  isVisible?: boolean
  ageRange?: string
  limit?: number
  page?: number
}

/**
 * Response structure from PayloadCMS API
 */
interface PayloadResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

/**
 * Generic fetch wrapper for PayloadCMS API with retry logic
 */
async function fetchPayload<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  logger.debug('Fetching from PayloadCMS', { endpoint })

  return withRetry<T>(
    async () => {
      const url = `${PAYLOAD_API_URL}/api${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        next: { 
          revalidate: CACHE_REVALIDATE_SECONDS,
          ...options.next 
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('PayloadCMS API error', {
          status: response.status,
          statusText: response.statusText,
          url,
          error: errorText,
        })
        throw new Error(`PayloadCMS API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logger.debug('PayloadCMS fetch successful', { endpoint, dataReceived: !!data })
      return data
    },
    {
      shouldRetry: (error) => {
        // Retry on network errors, but not on 4xx client errors
        const message = error.message.toLowerCase()
        if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
          return false
        }
        return true
      },
    }
  )
}

/**
 * Build URL query string from parameters object
 */
function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        query.append(key, JSON.stringify(value))
      } else {
        query.append(key, String(value))
      }
    }
  })
  
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * T078: Get videos with filtering and pagination
 * 
 * @param params - Query parameters for filtering
 * @returns Array of video documents
 */
export async function getVideos(params: GetVideosParams = {}): Promise<Video[]> {
  logger.debug('Getting videos', { params })

  const where: Record<string, unknown> = {}
  
  if (params.category) {
    where.category = { equals: params.category }
  }
  
  if (params.ageRange) {
    where.ageRange = { equals: params.ageRange }
  }
  
  if (params.search) {
    where.title = { contains: params.search }
  }

  const queryParams = {
    where,
    limit: params.limit || 50,
    page: params.page || 1,
    sort: '-createdAt', // Most recent first
  }

  const queryString = buildQueryString(queryParams)
  const response = await fetchPayload<PayloadResponse<Video>>(`/videos${queryString}`)
  
  logger.debug('Videos fetched', { count: response.docs.length, total: response.totalDocs })
  return response.docs
}

/**
 * T079: Get single video by slug
 * 
 * @param slug - Video slug (URL-safe identifier)
 * @returns Video document or null if not found
 */
export async function getVideoBySlug(slug: string): Promise<Video | null> {
  logger.debug('Getting video by slug', { slug })

  try {
    const queryParams = {
      where: { slug: { equals: slug } },
      limit: 1,
    }

    const queryString = buildQueryString(queryParams)
    const response = await fetchPayload<PayloadResponse<Video>>(`/videos${queryString}`)

    if (response.docs.length === 0) {
      logger.warn('Video not found', { slug })
      return null
    }

    logger.debug('Video found', { slug, id: response.docs[0].id })
    return response.docs[0]
  } catch (error) {
    logger.error('Error fetching video by slug', { slug, error })
    return null
  }
}

/**
 * T080: Get single video by ID
 * 
 * @param id - Video ID
 * @returns Video document or null if not found
 */
export async function getVideoById(id: string): Promise<Video | null> {
  logger.debug('Getting video by ID', { id })

  try {
    const response = await fetchPayload<Video>(`/videos/${id}`)
    logger.debug('Video found', { id })
    return response
  } catch (error) {
    logger.error('Error fetching video by ID', { id, error })
    return null
  }
}

/**
 * T081: Get categories with filtering and hierarchy support
 * 
 * @param params - Query parameters for filtering
 * @returns Array of category documents
 */
export async function getCategories(params: GetCategoriesParams = {}): Promise<Category[]> {
  logger.debug('Getting categories', { params })

  const where: Record<string, unknown> = {}
  
  if (params.parent !== undefined) {
    where.parent = params.parent === null ? { exists: false } : { equals: params.parent }
  }
  
  if (params.isAgeRangeRoot !== undefined) {
    where.isAgeRangeRoot = { equals: params.isAgeRangeRoot }
  }
  
  if (params.isVisible !== undefined) {
    where.isVisible = { equals: params.isVisible }
  }
  
  if (params.ageRange) {
    where.ageRange = { equals: params.ageRange }
  }

  const queryParams = {
    where,
    limit: params.limit || 100,
    page: params.page || 1,
    sort: 'sortOrder', // Custom order for siblings
  }

  const queryString = buildQueryString(queryParams)
  const response = await fetchPayload<PayloadResponse<Category>>(`/categories${queryString}`)
  
  logger.debug('Categories fetched', { count: response.docs.length, total: response.totalDocs })
  return response.docs
}

/**
 * T082: Get single category by slug
 * 
 * @param slug - Category slug (URL-safe identifier)
 * @returns Category document or null if not found
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  logger.debug('Getting category by slug', { slug })

  try {
    const queryParams = {
      where: { slug: { equals: slug } },
      limit: 1,
    }

    const queryString = buildQueryString(queryParams)
    const response = await fetchPayload<PayloadResponse<Category>>(`/categories${queryString}`)

    if (response.docs.length === 0) {
      logger.warn('Category not found', { slug })
      return null
    }

    logger.debug('Category found', { slug, id: response.docs[0].id })
    return response.docs[0]
  } catch (error) {
    logger.error('Error fetching category by slug', { slug, error })
    return null
  }
}

/**
 * T083: Get direct children of a category
 * 
 * @param parentId - Parent category ID
 * @returns Array of child category documents
 */
export async function getCategoryChildren(parentId: string): Promise<Category[]> {
  logger.debug('Getting category children', { parentId })

  return getCategories({ 
    parent: parentId, 
    isVisible: true 
  })
}

/**
 * T084: Get ancestors of a category for breadcrumb navigation
 * 
 * @param category - Category document with fullPath populated
 * @returns Array of ancestor categories from root to parent
 */
export async function getCategoryAncestors(category: Category): Promise<Category[]> {
  logger.debug('Getting category ancestors', { categoryId: category.id })

  if (!category.fullPath || category.fullPath.length === 0) {
    return []
  }

  // fullPath includes the category itself, so exclude the last item
  const ancestorIds = category.fullPath
    .slice(0, -1)
    .map(item => item.id)
    .filter((id): id is string => Boolean(id))

  if (ancestorIds.length === 0) {
    return []
  }

  try {
    // Fetch all ancestors in parallel
    const ancestorPromises = ancestorIds.map(id => 
      fetchPayload<Category>(`/categories/${id}`)
    )
    
    const ancestors = await Promise.all(ancestorPromises)
    logger.debug('Category ancestors fetched', { count: ancestors.length })
    return ancestors
  } catch (error) {
    logger.error('Error fetching category ancestors', { categoryId: category.id, error })
    return []
  }
}

/**
 * T085: Create activity log entry
 * 
 * @param logData - Activity log data
 * @returns Created activity log document or null on failure
 */
export async function createActivityLog(
  logData: Omit<ActivityLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ActivityLog | null> {
  logger.debug('Creating activity log', { actionType: logData.actionType })

  try {
    const response = await fetchPayload<ActivityLog>('/activity-logs', {
      method: 'POST',
      body: JSON.stringify(logData),
      next: { revalidate: 0 }, // Don't cache POST requests
    })

    logger.debug('Activity log created', { 
      id: response.id, 
      actionType: logData.actionType 
    })
    return response
  } catch (error) {
    // T098: Fail gracefully - don't disrupt user experience
    logger.warn('Failed to create activity log (non-critical)', { 
      actionType: logData.actionType, 
      error 
    })
    return null
  }
}

/**
 * Helper: Generate session ID for tracking
 * Uses sessionStorage if available, otherwise generates a new UUID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID()
  }

  try {
    let sessionId = sessionStorage.getItem('payload_session_id')
    
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('payload_session_id', sessionId)
    }
    
    return sessionId
  } catch (error) {
    // If sessionStorage is not available, generate a new UUID
    logger.warn('SessionStorage not available, generating new session ID')
    return crypto.randomUUID()
  }
}

/**
 * Helper: Anonymize IP address by removing last octet
 */
export function anonymizeIp(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) {
    parts[3] = '0'
    return parts.join('.')
  }
  // For IPv6 or invalid formats, return as-is (or handle differently)
  return ip
}
