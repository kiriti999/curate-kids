/**
 * Transform Script - Transform Sanity data to PayloadCMS format
 * 
 * Purpose: Read exported Sanity data and transform it to PayloadCMS-compatible format
 * Handles field mappings, references, slugs, and image URLs
 * 
 * Input: JSON files from migration/exported-data/ (Sanity format)
 * Output: Transformed JSON files in migration/exported-data/ (*-transformed.json)
 * 
 * Usage: npx ts-node migration/transform-data.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Export directory
const EXPORT_DIR = path.join(__dirname, 'exported-data')

// Document types to transform
const DOCUMENT_TYPES = [
  'video',
  'category',
  'user',
  'activityLog',
  'adPlacement',
  'affiliatePartner',
]

// ID mapping: Sanity _id -> PayloadCMS ID (to be filled during import)
interface IdMapping {
  [sanityId: string]: string // Will store PayloadCMS ID after import
}

/**
 * Read exported Sanity data from file
 * 
 * @param type - Document type
 * @returns Array of Sanity documents
 */
function readExportedData(type: string): any[] {
  const filename = path.join(EXPORT_DIR, `${type}s.json`)

  if (!fs.existsSync(filename)) {
    logger.error(`Export file not found`, { type, filename })
    throw new Error(`Export file not found: ${filename}`)
  }

  const fileContent = fs.readFileSync(filename, 'utf-8')
  const data = JSON.parse(fileContent)

  logger.info(`Read exported ${type} data`, {
    type,
    count: data.documents.length,
  })

  return data.documents
}

/**
 * Transform Sanity reference to PayloadCMS relationship format
 * 
 * @param ref - Sanity reference object { _ref: "sanityId", _type: "reference" }
 * @returns Sanity ID string (will be resolved to PayloadCMS ID during import)
 */
function transformReference(ref: any): string | null {
  if (!ref || !ref._ref) {
    return null
  }
  return ref._ref // Store Sanity ID, will be mapped to PayloadCMS ID during import
}

/**
 * Transform Sanity slug object to PayloadCMS slug string
 * 
 * @param slug - Sanity slug object { current: "slug-value", _type: "slug" }
 * @returns Slug string
 */
function transformSlug(slug: any): string {
  if (!slug || typeof slug === 'string') {
    return slug
  }
  return slug.current || ''
}

/**
 * Transform Sanity image reference to image URL or asset reference
 * 
 * @param image - Sanity image object
 * @returns Image asset reference or URL (keep as-is for initial migration)
 */
function transformImage(image: any): any {
  if (!image) {
    return null
  }
  // Keep Sanity image reference as-is for now
  // Can be enhanced later to download and upload to PayloadCMS media library
  return image
}

/**
 * Transform Video document from Sanity to PayloadCMS format
 * 
 * @param doc - Sanity video document
 * @returns Transformed video document for PayloadCMS
 */
function transformVideo(doc: any): any {
  return {
    // Preserve Sanity ID for reference mapping
    sanityId: doc._id,
    
    // Core fields
    title: doc.title,
    slug: transformSlug(doc.slug),
    youtubeUrl: doc.youtubeUrl,
    youtubeId: doc.youtubeId,
    duration: doc.duration,
    
    // Relationships (store Sanity ID, will be resolved during import)
    category: transformReference(doc.category),
    
    // Enums and arrays
    ageRange: doc.ageRange,
    tags: doc.tags || [],
    
    // Optional fields
    notes: doc.notes,
    viewCount: doc.viewCount || 0,
    lastViewedAt: doc.lastViewedAt,
    
    // Timestamps
    createdAt: doc._createdAt,
    updatedAt: doc._updatedAt,
  }
}

/**
 * Transform Category document from Sanity to PayloadCMS format
 * 
 * @param doc - Sanity category document
 * @returns Transformed category document for PayloadCMS
 */
function transformCategory(doc: any): any {
  return {
    // Preserve Sanity ID for reference mapping
    sanityId: doc._id,
    
    // Core fields
    name: doc.name,
    slug: transformSlug(doc.slug),
    description: doc.description,
    icon: transformImage(doc.icon),
    ageRange: doc.ageRange,
    
    // Relationships (store Sanity ID, will be resolved during import)
    parent: transformReference(doc.parent),
    
    // Calculated fields (will be recalculated during import)
    fullPath: doc.fullPath || [],
    depth: doc.depth || 0,
    isAgeRangeRoot: doc.isAgeRangeRoot || false,
    
    // Optional fields
    sortOrder: doc.sortOrder,
    isVisible: doc.isVisible !== false, // Default to true
    childCount: doc.childCount || 0,
    videoCount: doc.videoCount || 0,
    notes: doc.notes,
    
    // Timestamps
    createdAt: doc._createdAt,
    updatedAt: doc._updatedAt,
  }
}

/**
 * Transform User document from Sanity to PayloadCMS format
 * 
 * @param doc - Sanity user document
 * @returns Transformed user document for PayloadCMS
 */
function transformUser(doc: any): any {
  return {
    // Preserve Sanity ID for reference mapping
    sanityId: doc._id,
    
    // Core fields
    name: doc.name,
    email: doc.email,
    // Password will need to be reset/rehashed in PayloadCMS
    // PayloadCMS handles password hashing differently
    password: doc.password, // This will need special handling during import
    role: doc.role,
    status: doc.status || 'active',
    
    // Relationships (store Sanity ID, will be resolved during import)
    addedBy: transformReference(doc.addedBy),
    
    // Optional fields
    lastLoginAt: doc.lastLoginAt,
    loginCount: doc.loginCount || 0,
    notes: doc.notes,
    deactivatedAt: doc.deactivatedAt,
    
    // Timestamps
    createdAt: doc._createdAt,
    updatedAt: doc._updatedAt,
  }
}

/**
 * Transform ActivityLog document from Sanity to PayloadCMS format
 * 
 * @param doc - Sanity activityLog document
 * @returns Transformed activityLog document for PayloadCMS
 */
function transformActivityLog(doc: any): any {
  return {
    // Preserve Sanity ID for reference mapping
    sanityId: doc._id,
    
    // Core fields
    actionType: doc.actionType,
    
    // Relationships (store Sanity ID, will be resolved during import)
    userId: transformReference(doc.userId),
    
    // Session and client info
    sessionId: doc.sessionId,
    ipAddress: doc.ipAddress,
    userAgent: doc.userAgent,
    
    // Resource info
    resourceType: doc.resourceType,
    resourceId: doc.resourceId, // May need to be mapped if it's a reference
    
    // Metadata
    metadata: doc.metadata || {},
    
    // Timestamps (activityLog is immutable)
    createdAt: doc._createdAt,
  }
}

/**
 * Transform AdPlacement document from Sanity to PayloadCMS format
 * 
 * @param doc - Sanity adPlacement document
 * @returns Transformed adPlacement document for PayloadCMS
 */
function transformAdPlacement(doc: any): any {
  return {
    // Preserve Sanity ID for reference mapping
    sanityId: doc._id,
    
    // Core fields
    name: doc.name,
    type: doc.type,
    position: doc.position,
    
    // Content fields (group in PayloadCMS)
    htmlContent: doc.htmlContent,
    imageUrl: doc.imageUrl,
    linkUrl: doc.linkUrl,
    altText: doc.altText,
    
    // Targeting
    ageRanges: doc.ageRanges || [],
    priority: doc.priority || 50,
    status: doc.status || 'active',
    
    // Scheduling
    startDate: doc.startDate,
    endDate: doc.endDate,
    
    // Inline position (for inline type)
    inlineEveryNVideos: doc.inlineEveryNVideos,
    inlineOffset: doc.inlineOffset,
    
    // Relationships (store Sanity ID, will be resolved during import)
    affiliatePartner: transformReference(doc.affiliatePartner),
    
    // Metrics
    impressionCount: doc.impressionCount || 0,
    clickCount: doc.clickCount || 0,
    // CTR will be calculated in PayloadCMS hook
    
    // Optional fields
    notes: doc.notes,
    
    // Timestamps
    createdAt: doc._createdAt,
    updatedAt: doc._updatedAt,
  }
}

/**
 * Transform AffiliatePartner document from Sanity to PayloadCMS format
 * 
 * @param doc - Sanity affiliatePartner document
 * @returns Transformed affiliatePartner document for PayloadCMS
 */
function transformAffiliatePartner(doc: any): any {
  return {
    // Preserve Sanity ID for reference mapping
    sanityId: doc._id,
    
    // Core fields
    name: doc.name,
    contactEmail: doc.contactEmail,
    website: doc.website,
    
    // Tracking
    trackingUrlTemplate: doc.trackingUrlTemplate,
    
    // Commission
    commissionRate: doc.commissionRate,
    commissionType: doc.commissionType,
    paymentTerms: doc.paymentTerms,
    
    // Status
    status: doc.status || 'active',
    
    // Metrics
    totalImpressions: doc.totalImpressions || 0,
    totalClicks: doc.totalClicks || 0,
    // Conversion rate will be calculated in PayloadCMS hook
    
    // Dates
    onboardedAt: doc.onboardedAt,
    lastPayoutAt: doc.lastPayoutAt,
    
    // Optional fields
    notes: doc.notes,
    
    // Timestamps
    createdAt: doc._createdAt,
    updatedAt: doc._updatedAt,
  }
}

/**
 * Transform documents of a specific type
 * 
 * @param type - Document type
 * @param documents - Array of Sanity documents
 * @returns Array of transformed documents
 */
function transformDocumentType(type: string, documents: any[]): any[] {
  logger.info(`Transforming ${type} documents...`, { type, count: documents.length })

  const transformers: Record<string, (doc: any) => any> = {
    video: transformVideo,
    category: transformCategory,
    user: transformUser,
    activityLog: transformActivityLog,
    adPlacement: transformAdPlacement,
    affiliatePartner: transformAffiliatePartner,
  }

  const transformer = transformers[type]
  if (!transformer) {
    logger.error(`No transformer found for type`, { type })
    throw new Error(`No transformer found for type: ${type}`)
  }

  const transformed = documents.map((doc, index) => {
    try {
      return transformer(doc)
    } catch (error: any) {
      logger.error(`Failed to transform document`, {
        type,
        index,
        docId: doc._id,
        error: error.message,
      })
      throw error
    }
  })

  logger.info(`Transformed ${type} documents`, { type, count: transformed.length })

  return transformed
}

/**
 * Validate transformed document against basic rules
 * 
 * @param type - Document type
 * @param doc - Transformed document
 * @returns Validation errors (empty array if valid)
 */
function validateTransformedDocument(type: string, doc: any): string[] {
  const errors: string[] = []

  // Common validations
  if (!doc.sanityId) {
    errors.push('Missing sanityId')
  }

  if (!doc.createdAt) {
    errors.push('Missing createdAt')
  }

  // Type-specific validations
  switch (type) {
    case 'video':
      if (!doc.title) errors.push('Missing title')
      if (!doc.slug) errors.push('Missing slug')
      if (!doc.youtubeUrl) errors.push('Missing youtubeUrl')
      if (!doc.ageRange) errors.push('Missing ageRange')
      break

    case 'category':
      if (!doc.name) errors.push('Missing name')
      if (!doc.slug) errors.push('Missing slug')
      if (!doc.ageRange) errors.push('Missing ageRange')
      if (doc.depth === undefined) errors.push('Missing depth')
      break

    case 'user':
      if (!doc.name) errors.push('Missing name')
      if (!doc.email) errors.push('Missing email')
      if (!doc.role) errors.push('Missing role')
      break

    case 'activityLog':
      if (!doc.actionType) errors.push('Missing actionType')
      if (!doc.resourceType) errors.push('Missing resourceType')
      break

    case 'adPlacement':
      if (!doc.name) errors.push('Missing name')
      if (!doc.type) errors.push('Missing type')
      if (!doc.position) errors.push('Missing position')
      break

    case 'affiliatePartner':
      if (!doc.name) errors.push('Missing name')
      if (!doc.contactEmail) errors.push('Missing contactEmail')
      break
  }

  return errors
}

/**
 * Save transformed documents to file
 * 
 * @param type - Document type
 * @param documents - Array of transformed documents
 */
function saveTransformedData(type: string, documents: any[]) {
  const filename = path.join(EXPORT_DIR, `${type}s-transformed.json`)
  const data = {
    metadata: {
      transformedAt: new Date().toISOString(),
      count: documents.length,
    },
    documents,
  }

  fs.writeFileSync(filename, JSON.stringify(data, null, 2))

  logger.info(`Saved transformed ${type} documents`, {
    type,
    filename,
    count: documents.length,
  })
}

/**
 * Create ID mapping file (empty initially, to be filled during import)
 * 
 * @param allDocuments - All transformed documents by type
 */
function createIdMappingFile(allDocuments: Record<string, any[]>) {
  const idMapping: Record<string, IdMapping> = {}

  // Initialize empty ID mappings for each type
  DOCUMENT_TYPES.forEach((type) => {
    idMapping[type] = {}
    const docs = allDocuments[type] || []
    docs.forEach((doc) => {
      idMapping[type][doc.sanityId] = '' // Will be filled during import
    })
  })

  const filename = path.join(EXPORT_DIR, 'id-mapping.json')
  fs.writeFileSync(filename, JSON.stringify(idMapping, null, 2))

  logger.info('Created ID mapping file', { filename })
}

/**
 * Main transformation function
 */
async function transformAllData() {
  const startTime = Date.now()
  logger.info('Starting data transformation')

  try {
    // Check if export files exist
    const exportSummaryFile = path.join(EXPORT_DIR, 'export-summary.json')
    if (!fs.existsSync(exportSummaryFile)) {
      logger.error('Export summary not found. Run export-from-sanity.ts first.')
      throw new Error('Export data not found. Please run export script first.')
    }

    const transformStats: Record<string, number> = {}
    const allDocuments: Record<string, any[]> = {}
    const validationErrors: Record<string, number> = {}

    // Transform each document type
    for (const type of DOCUMENT_TYPES) {
      const documents = readExportedData(type)
      const transformed = transformDocumentType(type, documents)

      // Validate transformed documents
      let errorCount = 0
      transformed.forEach((doc, index) => {
        const errors = validateTransformedDocument(type, doc)
        if (errors.length > 0) {
          errorCount++
          logger.warn(`Validation errors in transformed document`, {
            type,
            index,
            sanityId: doc.sanityId,
            errors,
          })
        }
      })

      transformStats[type] = transformed.length
      validationErrors[type] = errorCount
      allDocuments[type] = transformed

      // Save transformed data
      saveTransformedData(type, transformed)
    }

    // Create ID mapping file
    createIdMappingFile(allDocuments)

    // Create transformation summary
    const summary = {
      transformedAt: new Date().toISOString(),
      collections: transformStats,
      totalDocuments: Object.values(transformStats).reduce((sum, count) => sum + count, 0),
      validationErrors,
      totalErrors: Object.values(validationErrors).reduce((sum, count) => sum + count, 0),
      duration: Date.now() - startTime,
    }

    const summaryFile = path.join(EXPORT_DIR, 'transform-summary.json')
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))

    logger.info('Transformation completed', summary)

    // Print summary to console for user visibility
    console.log('\n=== TRANSFORMATION SUMMARY ===')
    console.log(`Transformed at: ${summary.transformedAt}`)
    console.log(`Total documents: ${summary.totalDocuments}`)
    console.log('\nDocuments by collection:')
    Object.entries(transformStats).forEach(([type, count]) => {
      const errors = validationErrors[type]
      console.log(`  ${type}: ${count} ${errors > 0 ? `(${errors} validation errors)` : ''}`)
    })
    console.log(`\nTotal validation errors: ${summary.totalErrors}`)
    console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`)
    console.log(`Output directory: ${EXPORT_DIR}`)
    console.log('==============================\n')

    return summary
  } catch (error: any) {
    logger.error('Transformation failed', {
      error: error.message,
      stack: error.stack,
    })
    process.exit(1)
  }
}

// Run transformation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  transformAllData()
    .then(() => {
      logger.info('Transformation script completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Transformation script failed', { error: error.message })
      process.exit(1)
    })
}

export { transformAllData, transformDocumentType }
