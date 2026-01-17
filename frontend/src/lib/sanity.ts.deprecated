/**
 * Sanity client for frontend
 * Provides configured Sanity client and query functions
 */

import { createClient } from '@sanity/client'
import { extractYoutubeId } from '../../../utils/extractYoutubeId'
import { logger } from '../../../utils/logger'
import { VideoQueryResult } from '../../../types/sanity'
import { SANITY_CONFIG } from '../../../config/constants'

// Use Next.js public environment variables (client-side safe)
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = SANITY_CONFIG.API_VERSION

if (!projectId) {
  logger.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

export async function getPublishedVideos(): Promise<VideoQueryResult[]> {
  logger.debug('Fetching published videos')
  
  const { withRetry } = await import('../../../utils/retry')
  
  const videos = await withRetry<VideoQueryResult[]>(
    async () => client.fetch(
      `*[_type == "video" && !(_id in path("drafts.**"))] | order(_createdAt desc) {
        _id,
        _createdAt,
        title,
        youtubeId,
        youtubeUrl,
        category,
        ageRange,
        tags
      }`,
      {},
      { next: { revalidate: 300 } } // Cache for 5 minutes - better Vercel performance
    ),
    {
      shouldRetry: (error) => {
        // Retry on network errors, but not on auth/config errors
        const message = error.message.toLowerCase()
        if (message.includes('401') || message.includes('403') || message.includes('project') || message.includes('dataset')) {
          return false
        }
        return true
      }
    }
  )

  if (!videos) {
    logger.error('Failed to fetch videos after all retry attempts')
    return [] // Return empty array for graceful degradation
  }

  logger.debug('Videos fetched', { count: videos.length })

  // Extract YouTube IDs from URLs if they're not already set
  return videos.map((video: VideoQueryResult) => ({
    ...video,
    youtubeId: video.youtubeId || extractYoutubeId(video.youtubeUrl || '') || '',
  }))
}
