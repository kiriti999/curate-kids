/**
 * Video Collection Hooks
 * 
 * Handles YouTube ID extraction, slug generation, duplicate prevention, and computed field updates.
 */

import { FieldHook, CollectionBeforeValidateHook, CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'
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
  // Extract YouTube ID from URL (only for URL-based videos)
  if (data?.youtubeUrl && data?.source !== 'telegram') {
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
 * beforeChange Hook: Prevent duplicate videos per category + ageRange
 * 
 * Checks if a video with the same youtubeId/youtubeUrl already exists
 * within the same category and ageRange combination.
 */
export const beforeChangeVideoHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  // Only check on create, or on update if youtubeUrl/category/ageRange changed
  if (operation === 'create' ||
    (operation === 'update' && (
      data?.youtubeUrl !== originalDoc?.youtubeUrl ||
      data?.cloudinaryId !== originalDoc?.cloudinaryId ||
      data?.category !== originalDoc?.category ||
      data?.ageRange !== originalDoc?.ageRange
    ))) {

    const category = data?.category
    const ageRange = data?.ageRange

    // For Telegram/Cloudinary uploads, check by cloudinaryId
    if (data?.source === 'telegram' && data?.cloudinaryId && category && ageRange) {
      const existing = await req.payload.find({
        collection: 'videos',
        where: {
          and: [
            { cloudinaryId: { equals: data.cloudinaryId } },
            { category: { equals: category } },
            { ageRange: { equals: ageRange } },
          ],
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        const isDifferentDoc = operation === 'update'
          ? existing.docs[0].id !== originalDoc?.id
          : true

        if (isDifferentDoc) {
          throw new Error(
            `A video with this Cloudinary ID already exists in category "${category}" for age range "${ageRange}". ` +
            `Existing video: "${existing.docs[0].title}"`
          )
        }
      }
    }

    // For YouTube/URL-based videos, check by youtubeId
    const youtubeId = data?.youtubeId || (data?.youtubeUrl ? extractYoutubeId(data.youtubeUrl) : null)

    if (youtubeId && category && ageRange) {
      const existing = await req.payload.find({
        collection: 'videos',
        where: {
          and: [
            { youtubeId: { equals: youtubeId } },
            { category: { equals: category } },
            { ageRange: { equals: ageRange } },
          ],
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        const isDifferentDoc = operation === 'update'
          ? existing.docs[0].id !== originalDoc?.id
          : true

        if (isDifferentDoc) {
          throw new Error(
            `A video with this YouTube link already exists in category "${category}" for age range "${ageRange}". ` +
            `Existing video: "${existing.docs[0].title}"`
          )
        }
      }
    }
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
