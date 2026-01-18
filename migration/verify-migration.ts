/**
 * Verification Script - Verify migration data integrity
 * 
 * Purpose: Compare exported Sanity data with imported PayloadCMS data
 * Validates record counts, relationships, calculated fields, and slug uniqueness
 * 
 * Input: Exported data in migration/exported-data/ and PayloadCMS database
 * Output: Detailed verification report
 * 
 * Usage: npx ts-node migration/verify-migration.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'
import { getPayloadClient } from '../payload-cms/index.js'
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Export directory
const EXPORT_DIR = path.join(__dirname, 'exported-data')

// Collection mappings
const COLLECTION_NAMES: Record<string, string> = {
  video: 'videos',
  category: 'categories',
  user: 'users',
  activityLog: 'activity-logs',
  adPlacement: 'ad-placements',
  affiliatePartner: 'affiliate-partners',
}

interface VerificationReport {
  verifiedAt: string
  recordCounts: {
    collection: string
    sanity: number
    payload: number
    match: boolean
  }[]
  categoryHierarchy: {
    valid: boolean
    errors: string[]
  }
  videoCategoryRefs: {
    valid: boolean
    errors: string[]
  }
  activityLogRefs: {
    valid: boolean
    errors: string[]
  }
  calculatedFields: {
    valid: boolean
    errors: string[]
  }
  slugUniqueness: {
    valid: boolean
    errors: string[]
  }
  overallValid: boolean
  summary: string
}

/**
 * Get Sanity client
 */
function getSanityClient() {
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID || '3rcl6ir9',
    dataset: process.env.SANITY_DATASET || 'production',
    token: process.env.SANITY_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
}

/**
 * Get record count from Sanity
 * 
 * @param client - Sanity client
 * @param type - Document type
 * @returns Record count
 */
async function getSanityCount(client: any, type: string): Promise<number> {
  const query = `count(*[_type == $type])`
  const count = await client.fetch(query, { type })
  return count
}

/**
 * Get record count from PayloadCMS
 * 
 * @param payload - PayloadCMS client
 * @param collection - Collection name
 * @returns Record count
 */
async function getPayloadCount(payload: any, collection: string): Promise<number> {
  const result = await payload.find({
    collection,
    limit: 0, // Just get count
  })
  return result.totalDocs
}

/**
 * Compare record counts between Sanity and PayloadCMS
 * 
 * @param sanityClient - Sanity client
 * @param payload - PayloadCMS client
 * @returns Array of count comparisons
 */
async function compareRecordCounts(sanityClient: any, payload: any) {
  logger.info('Comparing record counts...')

  const comparisons = []

  for (const [type, collection] of Object.entries(COLLECTION_NAMES)) {
    const sanityCount = await getSanityCount(sanityClient, type)
    const payloadCount = await getPayloadCount(payload, collection)
    const match = sanityCount === payloadCount

    comparisons.push({
      collection: type,
      sanity: sanityCount,
      payload: payloadCount,
      match,
    })

    logger.info(`Count comparison`, {
      collection: type,
      sanity: sanityCount,
      payload: payloadCount,
      match,
    })
  }

  return comparisons
}

/**
 * Verify category hierarchy integrity
 * 
 * @param payload - PayloadCMS client
 * @returns Validation result
 */
async function verifyCategoryHierarchy(payload: any): Promise<{
  valid: boolean
  errors: string[]
}> {
  logger.info('Verifying category hierarchy...')

  const errors: string[] = []

  try {
    // Get all categories
    const result = await payload.find({
      collection: 'categories',
      limit: 1000, // Adjust if you have more categories
    })

    const categories = result.docs

    // Build category map for quick lookup
    const categoryMap = new Map()
    categories.forEach((cat: any) => {
      categoryMap.set(cat.id, cat)
    })

    // Verify each category
    for (const category of categories) {
      // Verify parent relationship
      if (category.parent) {
        const parent = categoryMap.get(category.parent)
        if (!parent) {
          errors.push(
            `Category ${category.slug} (${category.id}) has invalid parent reference: ${category.parent}`
          )
        } else {
          // Verify same age range
          if (parent.ageRange !== category.ageRange) {
            errors.push(
              `Category ${category.slug} has different ageRange from parent ${parent.slug}`
            )
          }

          // Verify depth is parent.depth + 1
          const expectedDepth = (parent.depth || 0) + 1
          if (category.depth !== expectedDepth) {
            errors.push(
              `Category ${category.slug} has incorrect depth ${category.depth}, expected ${expectedDepth}`
            )
          }
        }
      } else {
        // No parent - should be depth 0 (age range root)
        if (category.depth !== 0 && !category.isAgeRangeRoot) {
          errors.push(
            `Category ${category.slug} has no parent but depth is ${category.depth} (expected 0)`
          )
        }
      }

      // Verify depth is within limits (0-9)
      if (category.depth < 0 || category.depth > 9) {
        errors.push(`Category ${category.slug} has invalid depth: ${category.depth}`)
      }

      // Verify fullPath is an array
      if (!Array.isArray(category.fullPath)) {
        errors.push(`Category ${category.slug} has invalid fullPath (not an array)`)
      }
    }

    logger.info('Category hierarchy verification complete', { errorCount: errors.length })
  } catch (error: any) {
    logger.error('Category hierarchy verification failed', { error: error.message })
    errors.push(`Failed to verify category hierarchy: ${error.message}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Verify video-category references
 * 
 * @param payload - PayloadCMS client
 * @returns Validation result
 */
async function verifyVideoCategoryRefs(payload: any): Promise<{
  valid: boolean
  errors: string[]
}> {
  logger.info('Verifying video-category references...')

  const errors: string[] = []

  try {
    // Get all videos
    const videosResult = await payload.find({
      collection: 'videos',
      limit: 1000, // Adjust if you have more videos
    })

    const videos = videosResult.docs

    // Get all categories
    const categoriesResult = await payload.find({
      collection: 'categories',
      limit: 1000,
    })

    const categoryIds = new Set(categoriesResult.docs.map((cat: any) => cat.id))

    // Verify each video's category reference
    for (const video of videos) {
      if (!video.category) {
        errors.push(`Video ${video.slug} (${video.id}) has no category reference`)
      } else if (!categoryIds.has(video.category)) {
        errors.push(
          `Video ${video.slug} (${video.id}) has invalid category reference: ${video.category}`
        )
      }
    }

    logger.info('Video-category reference verification complete', { errorCount: errors.length })
  } catch (error: any) {
    logger.error('Video-category reference verification failed', { error: error.message })
    errors.push(`Failed to verify video-category references: ${error.message}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Verify activity log references
 * 
 * @param payload - PayloadCMS client
 * @returns Validation result
 */
async function verifyActivityLogRefs(payload: any): Promise<{
  valid: boolean
  errors: string[]
}> {
  logger.info('Verifying activity log references...')

  const errors: string[] = []

  try {
    // Get all activity logs
    const logsResult = await payload.find({
      collection: 'activity-logs',
      limit: 1000, // Adjust if you have more logs
    })

    const logs = logsResult.docs

    // Get all users
    const usersResult = await payload.find({
      collection: 'users',
      limit: 1000,
    })

    const userIds = new Set(usersResult.docs.map((user: any) => user.id))

    // Verify each log's userId reference
    for (const log of logs) {
      if (log.userId && !userIds.has(log.userId)) {
        errors.push(
          `Activity log ${log.id} has invalid userId reference: ${log.userId}`
        )
      }

      // Verify resourceType is valid enum
      const validResourceTypes = [
        'video',
        'category',
        'user',
        'adPlacement',
        'affiliatePartner',
      ]
      if (!validResourceTypes.includes(log.resourceType)) {
        errors.push(
          `Activity log ${log.id} has invalid resourceType: ${log.resourceType}`
        )
      }

      // Verify actionType format (resource.action)
      if (log.actionType && !log.actionType.includes('.')) {
        errors.push(
          `Activity log ${log.id} has invalid actionType format: ${log.actionType} (expected "resource.action")`
        )
      }
    }

    logger.info('Activity log reference verification complete', { errorCount: errors.length })
  } catch (error: any) {
    logger.error('Activity log reference verification failed', { error: error.message })
    errors.push(`Failed to verify activity log references: ${error.message}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Verify calculated fields (childCount, videoCount, CTR, etc.)
 * 
 * @param payload - PayloadCMS client
 * @returns Validation result
 */
async function verifyCalculatedFields(payload: any): Promise<{
  valid: boolean
  errors: string[]
}> {
  logger.info('Verifying calculated fields...')

  const errors: string[] = []

  try {
    // Verify category childCount
    const categoriesResult = await payload.find({
      collection: 'categories',
      limit: 1000,
    })

    const categories = categoriesResult.docs

    for (const category of categories) {
      // Count actual children
      const childrenResult = await payload.find({
        collection: 'categories',
        where: {
          parent: {
            equals: category.id,
          },
        },
        limit: 0, // Just get count
      })

      const actualChildCount = childrenResult.totalDocs

      // Compare with stored childCount
      if (category.childCount !== actualChildCount) {
        errors.push(
          `Category ${category.slug} has incorrect childCount: ${category.childCount}, actual: ${actualChildCount}`
        )
      }

      // Verify videoCount
      const videosResult = await payload.find({
        collection: 'videos',
        where: {
          category: {
            equals: category.id,
          },
        },
        limit: 0, // Just get count
      })

      const actualVideoCount = videosResult.totalDocs

      if (category.videoCount !== actualVideoCount) {
        errors.push(
          `Category ${category.slug} has incorrect videoCount: ${category.videoCount}, actual: ${actualVideoCount}`
        )
      }
    }

    logger.info('Calculated fields verification complete', { errorCount: errors.length })
  } catch (error: any) {
    logger.error('Calculated fields verification failed', { error: error.message })
    errors.push(`Failed to verify calculated fields: ${error.message}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Verify slug uniqueness across all collections
 * 
 * @param payload - PayloadCMS client
 * @returns Validation result
 */
async function verifySlugUniqueness(payload: any): Promise<{
  valid: boolean
  errors: string[]
}> {
  logger.info('Verifying slug uniqueness...')

  const errors: string[] = []

  try {
    // Collections that have slugs
    const collectionsWithSlugs = ['videos', 'categories']

    for (const collection of collectionsWithSlugs) {
      const result = await payload.find({
        collection,
        limit: 1000,
      })

      const docs = result.docs

      // Build slug map to detect duplicates
      const slugMap = new Map()

      for (const doc of docs) {
        if (doc.slug) {
          if (slugMap.has(doc.slug)) {
            errors.push(
              `Duplicate slug "${doc.slug}" found in ${collection}: ${slugMap.get(doc.slug)} and ${doc.id}`
            )
          } else {
            slugMap.set(doc.slug, doc.id)
          }
        }
      }
    }

    logger.info('Slug uniqueness verification complete', { errorCount: errors.length })
  } catch (error: any) {
    logger.error('Slug uniqueness verification failed', { error: error.message })
    errors.push(`Failed to verify slug uniqueness: ${error.message}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Main verification function
 */
async function verifyMigration() {
  const startTime = Date.now()
  logger.info('Starting migration verification')

  const report: VerificationReport = {
    verifiedAt: new Date().toISOString(),
    recordCounts: [],
    categoryHierarchy: { valid: false, errors: [] },
    videoCategoryRefs: { valid: false, errors: [] },
    activityLogRefs: { valid: false, errors: [] },
    calculatedFields: { valid: false, errors: [] },
    slugUniqueness: { valid: false, errors: [] },
    overallValid: false,
    summary: '',
  }

  try {
    // Initialize clients
    logger.info('Initializing clients...')
    const sanityClient = getSanityClient()
    const payload = await getPayloadClient()
    logger.info('Clients initialized')

    // 1. Compare record counts
    report.recordCounts = await compareRecordCounts(sanityClient, payload)

    // 2. Verify category hierarchy
    report.categoryHierarchy = await verifyCategoryHierarchy(payload)

    // 3. Verify video-category references
    report.videoCategoryRefs = await verifyVideoCategoryRefs(payload)

    // 4. Verify activity log references
    report.activityLogRefs = await verifyActivityLogRefs(payload)

    // 5. Verify calculated fields
    report.calculatedFields = await verifyCalculatedFields(payload)

    // 6. Verify slug uniqueness
    report.slugUniqueness = await verifySlugUniqueness(payload)

    // Determine overall validity
    const allCountsMatch = report.recordCounts.every((c) => c.match)
    report.overallValid =
      allCountsMatch &&
      report.categoryHierarchy.valid &&
      report.videoCategoryRefs.valid &&
      report.activityLogRefs.valid &&
      report.calculatedFields.valid &&
      report.slugUniqueness.valid

    // Generate summary
    const totalErrors =
      report.categoryHierarchy.errors.length +
      report.videoCategoryRefs.errors.length +
      report.activityLogRefs.errors.length +
      report.calculatedFields.errors.length +
      report.slugUniqueness.errors.length

    report.summary = report.overallValid
      ? 'Migration verification passed! All checks successful.'
      : `Migration verification found ${totalErrors} error(s). See report for details.`

    // Save verification report
    const reportFile = path.join(EXPORT_DIR, `verification-report-${Date.now()}.json`)
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

    logger.info('Verification completed', { overallValid: report.overallValid })

    // Print summary to console
    console.log('\n=== VERIFICATION REPORT ===')
    console.log(`Verified at: ${report.verifiedAt}`)
    console.log(`\nRecord Counts:`)
    report.recordCounts.forEach((c) => {
      const status = c.match ? '✓' : '✗'
      console.log(`  ${status} ${c.collection}: Sanity=${c.sanity}, Payload=${c.payload}`)
    })
    console.log(`\nCategory Hierarchy: ${report.categoryHierarchy.valid ? '✓ PASS' : '✗ FAIL'}`)
    if (!report.categoryHierarchy.valid) {
      console.log(`  Errors: ${report.categoryHierarchy.errors.length}`)
    }
    console.log(`Video-Category Refs: ${report.videoCategoryRefs.valid ? '✓ PASS' : '✗ FAIL'}`)
    if (!report.videoCategoryRefs.valid) {
      console.log(`  Errors: ${report.videoCategoryRefs.errors.length}`)
    }
    console.log(`Activity Log Refs: ${report.activityLogRefs.valid ? '✓ PASS' : '✗ FAIL'}`)
    if (!report.activityLogRefs.valid) {
      console.log(`  Errors: ${report.activityLogRefs.errors.length}`)
    }
    console.log(`Calculated Fields: ${report.calculatedFields.valid ? '✓ PASS' : '✗ FAIL'}`)
    if (!report.calculatedFields.valid) {
      console.log(`  Errors: ${report.calculatedFields.errors.length}`)
    }
    console.log(`Slug Uniqueness: ${report.slugUniqueness.valid ? '✓ PASS' : '✗ FAIL'}`)
    if (!report.slugUniqueness.valid) {
      console.log(`  Errors: ${report.slugUniqueness.errors.length}`)
    }
    console.log(`\n${report.overallValid ? '✅' : '❌'} ${report.summary}`)
    console.log(`\nReport saved to: ${reportFile}`)
    console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`)
    console.log('============================\n')

    return report
  } catch (error: any) {
    logger.error('Verification failed', {
      error: error.message,
      stack: error.stack,
    })
    process.exit(1)
  }
}

// Run verification if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyMigration()
    .then(() => {
      logger.info('Verification script completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Verification script failed', { error: error.message })
      process.exit(1)
    })
}

export { verifyMigration }
