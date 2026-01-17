/**
 * Seed script for creating age range root categories
 * 
 * Usage:
 *   npx tsx scripts/seed-age-ranges.ts
 * 
 * Prerequisites:
 *   - Install tsx: pnpm add -D tsx
 *   - Set SANITY_TOKEN in .env file
 */

import { logger } from '../utils/logger'
import { env } from '../config/env'
import { SANITY_CONFIG } from '../config/constants'
import { CreateDocumentInput, SanityResponse } from '../types/sanity'

const projectId = env.SANITY_PROJECT_ID
const dataset = env.SANITY_DATASET
const apiVersion = SANITY_CONFIG.API_VERSION
const token = env.SANITY_TOKEN

const ageRanges = [
  { name: '0-2 years', ageRange: '0-2', slug: '0-2-years' },
  { name: '2-4 years', ageRange: '2-4', slug: '2-4-years' },
  { name: '5-7 years', ageRange: '5-7', slug: '5-7-years' },
  { name: '8-9 years', ageRange: '8-9', slug: '8-9-years' },
  { name: '10-15 years', ageRange: '10-15', slug: '10-15-years' },
  { name: '16+ years', ageRange: '16+', slug: '16-plus-years' },
  { name: '18+ years', ageRange: '18+', slug: '18-plus-years' },
]

async function createDocument(doc: CreateDocumentInput): Promise<SanityResponse<unknown>> {
  const { withRetry } = await import('../utils/retry')
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`
  
  logger.debug('Creating document', { type: doc._type, name: (doc as any).name })
  
  const result = await withRetry<SanityResponse<unknown>>(
    async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              create: doc,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to create document: ${error}`)
      }

      return response.json()
    },
    {
      shouldRetry: (error) => {
        // Retry on network errors, but not on validation or duplicate errors
        const message = error.message.toLowerCase()
        if (message.includes('validation') || message.includes('conflict') || message.includes('duplicate')) {
          return false
        }
        return true
      }
    }
  )

  if (!result) {
    throw new Error(`Failed to create document after all retry attempts: ${(doc as any).name}`)
  }

  return result
}

async function seedAgeRanges(): Promise<void> {
  logger.info('Starting age range category seeding', { projectId, dataset })

  try {
    for (const ageRange of ageRanges) {
      logger.info('Creating age range category', { name: ageRange.name })

      await createDocument({
        _type: 'category',
        name: ageRange.name,
        slug: { current: ageRange.slug },
        ageRange: ageRange.ageRange,
        isAgeRangeRoot: true,
        depth: 0,
        fullPath: [ageRange.name],
        description: `Content curated for children aged ${ageRange.ageRange}`,
        isVisible: true,
      })

      logger.info('Created age range category', { name: ageRange.name })
    }

    logger.info('All age range categories created successfully')
    logger.info('Note: These categories are immutable and cannot be deleted')
  } catch (error) {
    logger.error('Error creating age range categories', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  }
}

seedAgeRanges()
