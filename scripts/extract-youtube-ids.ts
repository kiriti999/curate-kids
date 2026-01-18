/**
 * Migration script: Extract and populate YouTube IDs from URLs
 * Updated to work with PayloadCMS instead of Sanity
 * Processes all video documents missing youtubeId field
 */

import { getPayload } from 'payload'
import config from '../payload.config'
import { extractYoutubeId } from '../utils/extractYoutubeId'
import { logger } from '../utils/logger'
import type { Video } from '../types/payload'

/**
 * Fetch videos from PayloadCMS
 */
async function fetchVideos(): Promise<Video[]> {
  logger.info('Initializing PayloadCMS')
  const payload = await getPayload({ config })

  logger.info('Fetching all video documents')
  
  const result = await payload.find({
    collection: 'videos',
    limit: 1000, // Adjust if you have more videos
    pagination: false,
  })

  logger.info('Videos fetched', { count: result.docs.length })
  return result.docs as Video[]
}

/**
 * Filter videos that need YouTube ID extraction
 */
function filterVideosNeedingUpdate(videos: Video[]): Video[] {
  const videosToUpdate = videos.filter((video) => video.youtubeUrl && !video.youtubeId)
  
  logger.info('Videos needing YouTube ID extraction', { count: videosToUpdate.length })
  
  return videosToUpdate
}

/**
 * Log videos that will be updated
 */
function logVideosToUpdate(videos: Video[]): void {
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
 * Update videos with extracted YouTube IDs
 */
async function updateVideosWithYoutubeIds(videos: Video[]): Promise<void> {
  const payload = await getPayload({ config })
  
  let updateCount = 0
  let failCount = 0

  for (const video of videos) {
    const youtubeId = extractYoutubeId(video.youtubeUrl || '')
    
    if (!youtubeId) {
      logger.warn('Could not extract YouTube ID', {
        videoId: video.id,
        title: video.title,
        url: video.youtubeUrl,
      })
      failCount++
      continue
    }

    try {
      await payload.update({
        collection: 'videos',
        id: video.id,
        data: {
          youtubeId,
        },
      })
      
      updateCount++
      logger.debug('Updated video', { id: video.id, title: video.title, youtubeId })
    } catch (error) {
      logger.error('Error updating video', {
        videoId: video.id,
        title: video.title,
        error: error instanceof Error ? error.message : String(error),
      })
      failCount++
    }
  }

  logger.info('Update complete', { 
    updatedCount: updateCount,
    failedCount: failCount,
    totalProcessed: videos.length 
  })
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
  await updateVideosWithYoutubeIds(videosToUpdate)
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
