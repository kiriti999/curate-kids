/**
 * Seed script for creating age range root categories
 * Updated to work with PayloadCMS instead of Sanity
 * 
 * Usage:
 *   npx tsx scripts/seed-age-ranges.ts
 * 
 * Prerequisites:
 *   - PayloadCMS server must be configured
 *   - MongoDB connection must be available
 */

import { getPayload } from 'payload'
import config from '../payload.config'
import { logger } from '../utils/logger'
import type { Category } from '../types/payload'

const ageRanges = [
  { name: '0-2 years', ageRange: '0-2' as const, slug: '0-2-years' },
  { name: '2-4 years', ageRange: '2-4' as const, slug: '2-4-years' },
  { name: '5-7 years', ageRange: '5-7' as const, slug: '5-7-years' },
  { name: '8-9 years', ageRange: '8-9' as const, slug: '8-9-years' },
  { name: '10-15 years', ageRange: '10-15' as const, slug: '10-15-years' },
  { name: '16+ years', ageRange: '16+' as const, slug: '16-plus-years' },
  { name: '18+ years', ageRange: '18+' as const, slug: '18-plus-years' },
]

async function createCategory(
  ageRange: typeof ageRanges[number]
): Promise<Category> {
  const payload = await getPayload({ config })
  
  logger.debug('Creating category', { name: ageRange.name })
  
  try {
    const category = await payload.create({
      collection: 'categories',
      data: {
        name: ageRange.name,
        slug: ageRange.slug,
        isAgeRangeRoot: true,
        depth: 0,
        fullPath: [
          {
            categoryName: ageRange.name,
          }
        ],
        description: `Content curated for children aged ${ageRange.ageRange}`,
        isVisible: true,
        childCount: 0,
        videoCount: 0,
      },
    })

    logger.info('Created age range category', { name: ageRange.name, id: category.id })
    return category as Category
  } catch (error) {
    // Check if it's a duplicate slug error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('unique')) {
      logger.warn('Category already exists, skipping', { name: ageRange.name })
      // Fetch and return the existing category
      const result = await payload.find({
        collection: 'categories',
        where: {
          slug: { equals: ageRange.slug }
        },
        limit: 1,
      })
      
      if (result.docs.length > 0) {
        return result.docs[0] as Category
      }
    }
    
    throw error
  }
}

async function seedAgeRanges(): Promise<void> {
  logger.info('Starting age range category seeding')
  logger.info('Initializing PayloadCMS')

  try {
    const payload = await getPayload({ config })
    
    // Check if any age range categories already exist
    const existingCategories = await payload.find({
      collection: 'categories',
      where: {
        isAgeRangeRoot: { equals: true }
      },
      limit: 10,
    })

    if (existingCategories.docs.length > 0) {
      logger.warn('Some age range categories already exist', { 
        count: existingCategories.docs.length,
        existing: existingCategories.docs.map(c => c.name)
      })
      logger.info('Will attempt to create missing categories only')
    }

    for (const ageRange of ageRanges) {
      logger.info('Creating age range category', { name: ageRange.name })
      await createCategory(ageRange)
    }

    logger.info('All age range categories created successfully')
    logger.info('Note: These categories are immutable and should not be deleted')
  } catch (error) {
    logger.error('Error creating age range categories', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  }
}

seedAgeRanges()
  .then(() => {
    logger.info('Seeding completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('Seeding failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })
