/**
 * Migration script: Extract and populate YouTube IDs from URLs
 * Processes all video documents missing youtubeId field
 */

import { createSanityClient } from '../services/sanity/client'
import { extractYoutubeId } from '../utils/extractYoutubeId'
import { logger } from '../utils/logger'
import { env } from '../config/env'
import { SANITY_CONFIG } from '../config/constants'
import { VideoDocument, MutationResult, Transaction } from '../types/sanity'

const client = createSanityClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: SANITY_CONFIG.API_VERSION,
  token: env.SANITY_TOKEN,
  useCdn: false,
})

/**
 * Fetch videos from Sanity with retry logic
 */
async function fetchVideos(): Promise<Partial<VideoDocument>[]> {
  logger.info('Fetching all video documents')

  const { withRetry } = await import('../utils/retry')
  
  const videos = await withRetry(
    async () => client.fetch<Partial<VideoDocument>[]>(`
      *[_type == "video"] {
        _id,
        title,
        youtubeUrl,
        youtubeId
      }
    `)
  )

  if (!videos) {
    throw new Error('Failed to fetch videos after all retry attempts')
  }

  logger.info('Videos fetched', { count: videos.length })
  return videos
}

/**
 * Filter videos that need YouTube ID extraction
 */
function filterVideosNeedingUpdate(videos: Partial<VideoDocument>[]): Partial<VideoDocument>[] {
  const videosToUpdate = videos.filter((video) => video.youtubeUrl && !video.youtubeId)
  
  logger.info('Videos needing YouTube ID extraction', { count: videosToUpdate.length })
  
  return videosToUpdate
}

/**
 * Log videos that will be updated
 */
function logVideosToUpdate(videos: Partial<VideoDocument>[]): void {
  logger.info('Videos to update', {
    videos: videos.map((video) => ({
      title: video.title,
      url: video.youtubeUrl,
      extractedId: extractYoutubeId(video.youtubeUrl || '') || 'FAILED',
    })),
  })
}

/**
 * Wait for user confirmation
 */
async function waitForConfirmation(): Promise<void> {
  logger.warn('Starting update in 5 seconds. Press Ctrl+C to cancel.')
  await new Promise((resolve) => setTimeout(resolve, 5000))
  logger.info('Starting YouTube ID update')
}

/**
 * Build transaction with YouTube ID patches
 */
function buildUpdateTransaction(videos: Partial<VideoDocument>[]): { transaction: Transaction; updateCount: number } {
  let transaction = client.transaction()
  let updateCount = 0

  videos.forEach((video) => {
    const youtubeId = extractYoutubeId(video.youtubeUrl || '')
    if (youtubeId && video._id) {
      transaction = transaction.patch(video._id, { set: { youtubeId } })
      updateCount++
    } else {
      logger.warn('Could not extract YouTube ID', {
        videoId: video._id,
        title: video.title,
        url: video.youtubeUrl,
      })
    }
  })

  return { transaction, updateCount }
}

/**
 * Commit updates to Sanity with retry logic
 */
async function commitUpdates(transaction: Transaction, updateCount: number): Promise<void> {
  if (updateCount === 0) {
    logger.error('No valid YouTube IDs could be extracted')
    return
  }

  const { withRetry } = await import('../utils/retry')

  try {
    const result = await withRetry<MutationResult>(
      async () => transaction.commit(),
      {
        shouldRetry: (error) => {
          // Retry on network errors, but not on validation errors
          const message = error.message.toLowerCase()
          if (message.includes('validation') || message.includes('conflict')) {
            return false
          }
          return true
        }
      }
    )

    if (!result) {
      throw new Error('Failed to commit updates after all retry attempts')
    }

    logger.info('Update complete', { updatedCount: result.results.length })
  } catch (error) {
    logger.error('Error during update', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'commitUpdates',
      updateCount,
    })
    throw error
  }
}

async function updateYoutubeIds(): Promise<void> {
  const videos = await fetchVideos()
  const videosToUpdate = filterVideosNeedingUpdate(videos)

  if (videosToUpdate.length === 0) {
    logger.info('All videos already have YouTube IDs')
    return
  }

  logVideosToUpdate(videosToUpdate)
  await waitForConfirmation()

  const { transaction, updateCount } = buildUpdateTransaction(videosToUpdate)
  await commitUpdates(transaction, updateCount)
}

updateYoutubeIds()
  .then(() => {
    logger.info('Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('Migration failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })
