/**
 * Export Script - Export all documents from Sanity CMS
 * 
 * Purpose: Connect to Sanity using existing config and export all documents
 * from the six collections: video, category, user, activityLog, adPlacement, affiliatePartner
 * 
 * Output: JSON files in migration/exported-data/ directory with metadata
 * 
 * Usage: npx ts-node migration/export-from-sanity.ts
 */

import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Sanity client configuration
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '3rcl6ir9',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false, // Ensure fresh data for migration
})

// Document types to export
const DOCUMENT_TYPES = [
  'video',
  'category',
  'user',
  'activityLog',
  'adPlacement',
  'affiliatePartner',
]

// Export directory
const EXPORT_DIR = path.join(__dirname, 'exported-data')

/**
 * Ensure export directory exists
 */
function ensureExportDir() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true })
    logger.info('Created export directory', { path: EXPORT_DIR })
  }
}

/**
 * Export documents of a specific type from Sanity
 * 
 * @param type - Document type to export
 * @returns Array of documents with metadata
 */
async function exportDocumentType(type: string): Promise<any[]> {
  try {
    logger.info(`Exporting ${type} documents...`, { type })

    // GROQ query to fetch all documents of this type
    // Include all fields including Sanity system fields (_id, _type, _createdAt, _updatedAt, _rev)
    const query = `*[_type == $type] | order(_createdAt asc)`
    const params = { type }

    const documents = await client.fetch(query, params)

    logger.info(`Exported ${type} documents`, {
      type,
      count: documents.length,
    })

    return documents
  } catch (error: any) {
    logger.error(`Failed to export ${type} documents`, {
      type,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Save exported documents to JSON file
 * 
 * @param type - Document type
 * @param documents - Array of documents to save
 * @param metadata - Export metadata
 */
function saveToFile(
  type: string,
  documents: any[],
  metadata: { exportedAt: string; count: number }
) {
  const filename = path.join(EXPORT_DIR, `${type}s.json`)
  const data = {
    metadata,
    documents,
  }

  fs.writeFileSync(filename, JSON.stringify(data, null, 2))

  logger.info(`Saved ${type} documents to file`, {
    type,
    filename,
    count: documents.length,
  })
}

/**
 * Main export function
 */
async function exportAllData() {
  const startTime = Date.now()
  logger.info('Starting Sanity data export', {
    projectId: client.config().projectId,
    dataset: client.config().dataset,
  })

  try {
    // Ensure export directory exists
    ensureExportDir()

    // Export statistics
    const exportStats: Record<string, number> = {}

    // Export each document type
    for (const type of DOCUMENT_TYPES) {
      const documents = await exportDocumentType(type)
      exportStats[type] = documents.length

      // Save to file with metadata
      saveToFile(type, documents, {
        exportedAt: new Date().toISOString(),
        count: documents.length,
      })
    }

    // Create summary file
    const summary = {
      exportedAt: new Date().toISOString(),
      projectId: client.config().projectId,
      dataset: client.config().dataset,
      collections: exportStats,
      totalDocuments: Object.values(exportStats).reduce((sum, count) => sum + count, 0),
      duration: Date.now() - startTime,
    }

    const summaryFile = path.join(EXPORT_DIR, 'export-summary.json')
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))

    logger.info('Export completed successfully', summary)

    // Print summary to console for user visibility
    console.log('\n=== EXPORT SUMMARY ===')
    console.log(`Exported at: ${summary.exportedAt}`)
    console.log(`Total documents: ${summary.totalDocuments}`)
    console.log('\nDocuments by collection:')
    Object.entries(exportStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
    console.log(`\nDuration: ${(summary.duration / 1000).toFixed(2)}s`)
    console.log(`Output directory: ${EXPORT_DIR}`)
    console.log('======================\n')

    return summary
  } catch (error: any) {
    logger.error('Export failed', {
      error: error.message,
      stack: error.stack,
    })
    process.exit(1)
  }
}

// Run export if executed directly (ESM check)
if (import.meta.url === `file://${process.argv[1]}`) {
  exportAllData()
    .then(() => {
      logger.info('Export script completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Export script failed', { error: error.message })
      process.exit(1)
    })
}

export { exportAllData, exportDocumentType }
