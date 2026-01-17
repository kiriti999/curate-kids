/**
 * Import Script - Import transformed data to PayloadCMS
 * 
 * Purpose: Import transformed Sanity data into PayloadCMS/MongoDB
 * Handles dependency ordering, reference resolution, and error recovery
 * 
 * Input: Transformed JSON files from migration/exported-data/ (*-transformed.json)
 * Output: Data imported to MongoDB via PayloadCMS local API
 * 
 * Usage:
 *   Dry-run: npx ts-node migration/import-to-payloadcms.ts --dry-run
 *   Real import: npx ts-node migration/import-to-payloadcms.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'
import { getPayloadClient } from '../payload/index.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Export directory
const EXPORT_DIR = path.join(__dirname, 'exported-data')

// Import order (respecting dependencies)
// Users → Categories (root→leaf) → AffiliatePartners → Videos → AdPlacements → ActivityLogs
const IMPORT_ORDER = [
  'user', // Import users first (no dependencies)
  'category', // Import categories (may reference other categories as parent)
  'affiliatePartner', // Import affiliate partners (no dependencies)
  'video', // Import videos (references categories)
  'adPlacement', // Import ad placements (references affiliate partners)
  'activityLog', // Import activity logs last (references users and other resources)
]

// Type mapping: migration type -> PayloadCMS collection name
const COLLECTION_NAMES: Record<string, string> = {
  user: 'users',
  category: 'categories',
  video: 'videos',
  activityLog: 'activity-logs',
  adPlacement: 'ad-placements',
  affiliatePartner: 'affiliate-partners',
}

// ID mapping: Sanity ID -> PayloadCMS ID
interface IdMapping {
  [sanityId: string]: string
}

interface ImportStats {
  attempted: number
  successful: number
  failed: number
  skipped: number
}

interface ImportReport {
  startedAt: string
  completedAt?: string
  dryRun: boolean
  collections: Record<string, ImportStats>
  totalAttempted: number
  totalSuccessful: number
  totalFailed: number
  errors: Array<{ collection: string; sanityId: string; error: string }>
  duration?: number
}

/**
 * Read transformed data from file
 * 
 * @param type - Document type
 * @returns Array of transformed documents
 */
function readTransformedData(type: string): any[] {
  const filename = path.join(EXPORT_DIR, `${type}s-transformed.json`)

  if (!fs.existsSync(filename)) {
    logger.error(`Transformed file not found`, { type, filename })
    throw new Error(`Transformed file not found: ${filename}`)
  }

  const fileContent = fs.readFileSync(filename, 'utf-8')
  const data = JSON.parse(fileContent)

  logger.info(`Read transformed ${type} data`, {
    type,
    count: data.documents.length,
  })

  return data.documents
}

/**
 * Load ID mapping from file
 * 
 * @returns ID mapping object
 */
function loadIdMapping(): Record<string, IdMapping> {
  const filename = path.join(EXPORT_DIR, 'id-mapping.json')

  if (fs.existsSync(filename)) {
    const fileContent = fs.readFileSync(filename, 'utf-8')
    return JSON.parse(fileContent)
  }

  // Return empty mapping if file doesn't exist
  return {}
}

/**
 * Save ID mapping to file
 * 
 * @param idMapping - ID mapping object to save
 */
function saveIdMapping(idMapping: Record<string, IdMapping>) {
  const filename = path.join(EXPORT_DIR, 'id-mapping.json')
  fs.writeFileSync(filename, JSON.stringify(idMapping, null, 2))
  logger.debug('Saved ID mapping', { filename })
}

/**
 * Resolve Sanity ID reference to PayloadCMS ID
 * 
 * @param sanityId - Sanity ID to resolve
 * @param type - Document type
 * @param idMapping - ID mapping object
 * @returns PayloadCMS ID or null if not found
 */
function resolveReference(
  sanityId: string | null,
  type: string,
  idMapping: Record<string, IdMapping>
): string | null {
  if (!sanityId) {
    return null
  }

  const payloadId = idMapping[type]?.[sanityId]

  if (!payloadId) {
    logger.warn(`Reference not found in ID mapping`, { type, sanityId })
    return null
  }

  return payloadId
}

/**
 * Resolve all references in a document
 * 
 * @param doc - Document with Sanity ID references
 * @param type - Document type
 * @param idMapping - ID mapping object
 * @returns Document with resolved PayloadCMS ID references
 */
function resolveDocumentReferences(
  doc: any,
  type: string,
  idMapping: Record<string, IdMapping>
): any {
  const resolved = { ...doc }

  // Remove sanityId from the document (we don't store it in PayloadCMS)
  delete resolved.sanityId

  // Type-specific reference resolution
  switch (type) {
    case 'video':
      // Resolve category reference
      if (doc.category) {
        resolved.category = resolveReference(doc.category, 'category', idMapping)
      }
      break

    case 'category':
      // Resolve parent category reference
      if (doc.parent) {
        resolved.parent = resolveReference(doc.parent, 'category', idMapping)
      }
      break

    case 'user':
      // Resolve addedBy reference
      if (doc.addedBy) {
        resolved.addedBy = resolveReference(doc.addedBy, 'user', idMapping)
      }
      break

    case 'activityLog':
      // Resolve userId reference
      if (doc.userId) {
        resolved.userId = resolveReference(doc.userId, 'user', idMapping)
      }
      // resourceId may need to be resolved based on resourceType
      // For now, keep it as-is (it's a string field)
      break

    case 'adPlacement':
      // Resolve affiliatePartner reference
      if (doc.affiliatePartner) {
        resolved.affiliatePartner = resolveReference(
          doc.affiliatePartner,
          'affiliatePartner',
          idMapping
        )
      }
      break

    case 'affiliatePartner':
      // No references to resolve
      break
  }

  return resolved
}

/**
 * Import a single document with retry logic
 * 
 * @param payload - PayloadCMS client
 * @param collection - PayloadCMS collection name
 * @param doc - Document to import
 * @param dryRun - Whether this is a dry run
 * @param maxRetries - Maximum retry attempts
 * @returns Imported document or null if failed
 */
async function importDocument(
  payload: any,
  collection: string,
  doc: any,
  dryRun: boolean,
  maxRetries: number = 3
): Promise<any> {
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (dryRun) {
        // In dry-run mode, just validate without writing
        logger.debug(`[DRY RUN] Would import document`, {
          collection,
          sanityId: doc.sanityId,
        })
        return { id: 'dry-run-id' } // Mock ID for dry run
      }

      // Import the document using PayloadCMS local API
      const result = await payload.create({
        collection,
        data: doc,
      })

      logger.debug(`Imported document`, {
        collection,
        sanityId: doc.sanityId,
        payloadId: result.id,
      })

      return result
    } catch (error: any) {
      lastError = error
      logger.warn(`Import attempt ${attempt} failed`, {
        collection,
        sanityId: doc.sanityId,
        attempt,
        maxRetries,
        error: error.message,
      })

      // Exponential backoff before retry
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // All retries failed
  logger.error(`Failed to import document after ${maxRetries} attempts`, {
    collection,
    sanityId: doc.sanityId,
    error: lastError.message,
  })

  throw lastError
}

/**
 * Sort categories by depth (root first, then children)
 * 
 * @param categories - Array of category documents
 * @returns Sorted array (depth 0 first, then 1, 2, etc.)
 */
function sortCategoriesByDepth(categories: any[]): any[] {
  return categories.sort((a, b) => (a.depth || 0) - (b.depth || 0))
}

/**
 * Import documents of a specific type
 * 
 * @param payload - PayloadCMS client
 * @param type - Document type
 * @param idMapping - ID mapping object
 * @param dryRun - Whether this is a dry run
 * @returns Import statistics
 */
async function importDocumentType(
  payload: any,
  type: string,
  idMapping: Record<string, IdMapping>,
  dryRun: boolean
): Promise<{ stats: ImportStats; errors: Array<{ sanityId: string; error: string }> }> {
  const collectionName = COLLECTION_NAMES[type]
  logger.info(`Importing ${type} documents to ${collectionName}...`, { type, collectionName })

  const stats: ImportStats = {
    attempted: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
  }

  const errors: Array<{ sanityId: string; error: string }> = []

  try {
    let documents = readTransformedData(type)

    // Special handling for categories: sort by depth
    if (type === 'category') {
      documents = sortCategoriesByDepth(documents)
      logger.info('Sorted categories by depth', {
        depths: documents.map((d) => d.depth),
      })
    }

    // Initialize ID mapping for this type if not exists
    if (!idMapping[type]) {
      idMapping[type] = {}
    }

    // Import each document
    for (const doc of documents) {
      stats.attempted++

      try {
        // Resolve references before import
        const resolvedDoc = resolveDocumentReferences(doc, type, idMapping)

        // Import the document
        const result = await importDocument(payload, collectionName, resolvedDoc, dryRun)

        // Store ID mapping
        if (result && result.id) {
          idMapping[type][doc.sanityId] = result.id
        }

        stats.successful++

        // Log progress every 10 documents
        if (stats.successful % 10 === 0) {
          logger.info(`Import progress`, {
            type,
            successful: stats.successful,
            total: documents.length,
          })
        }
      } catch (error: any) {
        stats.failed++
        errors.push({
          sanityId: doc.sanityId,
          error: error.message,
        })
        logger.error(`Failed to import document`, {
          type,
          sanityId: doc.sanityId,
          error: error.message,
        })
      }
    }

    logger.info(`Completed importing ${type}`, stats)

    return { stats, errors }
  } catch (error: any) {
    logger.error(`Failed to import ${type} documents`, {
      type,
      error: error.message,
    })
    throw error
  }
}

/**
 * Main import function
 * 
 * @param dryRun - Whether to run in dry-run mode (no database writes)
 */
async function importAllData(dryRun: boolean = false) {
  const startTime = Date.now()
  logger.info(`Starting data import ${dryRun ? '(DRY RUN)' : ''}`)

  const report: ImportReport = {
    startedAt: new Date().toISOString(),
    dryRun,
    collections: {},
    totalAttempted: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    errors: [],
  }

  try {
    // Check if transformed files exist
    const transformSummaryFile = path.join(EXPORT_DIR, 'transform-summary.json')
    if (!fs.existsSync(transformSummaryFile)) {
      logger.error('Transform summary not found. Run transform-data.ts first.')
      throw new Error('Transformed data not found. Please run transformation script first.')
    }

    // Initialize PayloadCMS
    logger.info('Initializing PayloadCMS...')
    const payload = await getPayloadClient()
    logger.info('PayloadCMS initialized')

    // Load existing ID mapping
    const idMapping = loadIdMapping()

    // Import each document type in order
    for (const type of IMPORT_ORDER) {
      const { stats, errors } = await importDocumentType(payload, type, idMapping, dryRun)

      report.collections[type] = stats
      report.totalAttempted += stats.attempted
      report.totalSuccessful += stats.successful
      report.totalFailed += stats.failed

      // Add errors to report
      errors.forEach((error) => {
        report.errors.push({
          collection: type,
          sanityId: error.sanityId,
          error: error.error,
        })
      })

      // Save ID mapping after each collection (checkpoint)
      if (!dryRun) {
        saveIdMapping(idMapping)
      }
    }

    // Complete report
    report.completedAt = new Date().toISOString()
    report.duration = Date.now() - startTime

    // Save import report
    const reportFile = path.join(
      EXPORT_DIR,
      `import-report-${dryRun ? 'dry-run-' : ''}${Date.now()}.json`
    )
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

    logger.info('Import completed', report)

    // Print summary to console
    console.log(`\n=== IMPORT SUMMARY ${dryRun ? '(DRY RUN)' : ''} ===`)
    console.log(`Started at: ${report.startedAt}`)
    console.log(`Completed at: ${report.completedAt}`)
    console.log(`Total attempted: ${report.totalAttempted}`)
    console.log(`Total successful: ${report.totalSuccessful}`)
    console.log(`Total failed: ${report.totalFailed}`)
    console.log('\nDocuments by collection:')
    Object.entries(report.collections).forEach(([type, stats]) => {
      console.log(
        `  ${type}: ${stats.successful}/${stats.attempted} ${
          stats.failed > 0 ? `(${stats.failed} failed)` : ''
        }`
      )
    })
    if (report.errors.length > 0) {
      console.log(`\nErrors: ${report.errors.length}`)
      console.log('See import report for details:', reportFile)
    }
    console.log(`\nDuration: ${(report.duration / 1000).toFixed(2)}s`)
    console.log('==============================\n')

    return report
  } catch (error: any) {
    logger.error('Import failed', {
      error: error.message,
      stack: error.stack,
    })
    process.exit(1)
  }
}

// Run import if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check for --dry-run flag
  const dryRun = process.argv.includes('--dry-run')

  if (dryRun) {
    console.log('\n🔍 Running in DRY RUN mode - no data will be written to database\n')
  }

  importAllData(dryRun)
    .then(() => {
      logger.info('Import script completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Import script failed', { error: error.message })
      process.exit(1)
    })
}

export { importAllData }
