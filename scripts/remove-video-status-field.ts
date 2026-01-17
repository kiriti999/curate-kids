/**
 * Migration script: Remove deprecated status and publishedAt fields
 * Cleans up legacy fields from video documents
 */

import { createSanityClient } from '../services/sanity/client'
import { logger } from '../utils/logger'
import { env } from '../config/env'
import { SANITY_CONFIG } from '../config/constants'
import { VideoDocument } from '../types/sanity'
import type { Patch } from '@sanity/client'

interface VideoWithLegacyFields extends Partial<VideoDocument> {
  status?: string
  publishedAt?: string
}

const client = createSanityClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: SANITY_CONFIG.API_VERSION,
  token: env.SANITY_TOKEN,
  useCdn: false,
})

async function removeStatusField(): Promise<void> {
  logger.info('Fetching all video documents')

  // Fetch all video documents (both drafts and published)
  const videos = await client.fetch<VideoWithLegacyFields[]>(`
    *[_type == "video"] {
      _id,
      _rev,
      title,
      status,
      publishedAt
    }
  `)

  logger.info('Videos fetched', { count: videos.length })

  // Filter videos that have status or publishedAt fields
  const videosToUpdate = videos.filter(
    (video: VideoWithLegacyFields) => video.status !== undefined || video.publishedAt !== undefined
  )

  logger.info('Documents needing cleanup', { count: videosToUpdate.length })

  if (videosToUpdate.length === 0) {
    logger.info('No cleanup needed')
    return
  }

  logger.info('Documents to update', {
    videos: videosToUpdate.map((video: VideoWithLegacyFields) => ({
      id: video._id,
      title: video.title,
      hasStatus: !!video.status,
      hasPublishedAt: !!video.publishedAt,
    })),
  })

  logger.warn('Starting cleanup in 5 seconds. Press Ctrl+C to cancel.')

  // Wait 5 seconds before proceeding
  await new Promise((resolve) => setTimeout(resolve, 5000))

  logger.info('Starting field cleanup')

  // Create a transaction to unset the fields
  let transaction = client.transaction()

  videosToUpdate.forEach((video: VideoWithLegacyFields) => {
    if (video._id) {
      transaction = transaction.patch(video._id, (patch: Patch) =>
        patch.unset(['status', 'publishedAt'])
      )
    }
  })

  // Execute the transaction
  try {
    const result = await transaction.commit()
    logger.info('Cleanup complete', { updatedCount: result.results.length })
  } catch (error) {
    logger.error('Error during cleanup', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

// Run the migration
removeStatusField()
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
