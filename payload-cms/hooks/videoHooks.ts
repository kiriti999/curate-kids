/**
 * Video Collection Hooks
 * 
 * Handles YouTube ID extraction, slug generation, and computed field updates.
 */

import { FieldHook, CollectionBeforeValidateHook, CollectionAfterReadHook } from 'payload'
import { extractYoutubeId } from '../../utils/extractYoutubeId'
import { slugify } from '../../utils/slugify'

/**
 * beforeValidate Hook: Extract YouTube ID and generate slug
 * 
 * T019: Extract youtubeId from youtubeUrl
 */
export const beforeValidateVideoHook: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  // Extract YouTube ID from URL
  if (data?.youtubeUrl) {
    const extractedId = extractYoutubeId(data.youtubeUrl)
    if (extractedId) {
      data.youtubeId = extractedId
    }
  }

  // Auto-generate slug from title if not provided
  if (data?.title && !data.slug) {
    data.slug = slugify(data.title)
  }

  return data
}

/**
 * afterRead Hook: Calculate viewCount and lastViewedAt from ActivityLog
 * 
 * NOTE: This will be implemented after ActivityLog collection is fully integrated
 * For now, we return the stored values
 */
export const afterReadVideoHook: CollectionAfterReadHook = async ({
  doc,
  req,
}) => {
  // TODO: Query ActivityLog collection for video.view events
  // and aggregate viewCount and lastViewedAt
  // 
  // const viewLogs = await req.payload.find({
  //   collection: 'activity-logs',
  //   where: {
  //     and: [
  //       { actionType: { equals: 'video.view' } },
  //       { resourceId: { equals: doc.id } },
  //     ],
  //   },
  //   limit: 1,
  //   sort: '-createdAt',
  // })
  // 
  // doc.viewCount = viewLogs.totalDocs
  // doc.lastViewedAt = viewLogs.docs[0]?.createdAt

  return doc
}
