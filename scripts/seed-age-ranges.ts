/**
 * Seed script for creating age range root categories
 * 
 * Usage:
 *   SANITY_TOKEN=your_token npx tsx scripts/seed-age-ranges.ts
 * 
 * Prerequisites:
 *   - Install tsx: pnpm add -D tsx
 *   - Generate Sanity token with write permissions
 */

// For Sanity v5, we use the client from the config or create a simple fetch-based approach
// Alternatively, we can use Sanity CLI commands

const projectId = '3rcl6ir9'
const dataset = 'production'
const apiVersion = '2024-01-01'

if (!process.env.SANITY_TOKEN) {
  console.error('Error: SANITY_TOKEN environment variable is required')
  console.error('Usage: SANITY_TOKEN=your_token npx tsx scripts/seed-age-ranges.ts')
  process.exit(1)
}

const token = process.env.SANITY_TOKEN

const ageRanges = [
  {name: '0-2 years', ageRange: '0-2', slug: '0-2-years'},
  {name: '2-4 years', ageRange: '2-4', slug: '2-4-years'},
  {name: '5-7 years', ageRange: '5-7', slug: '5-7-years'},
  {name: '8-9 years', ageRange: '8-9', slug: '8-9-years'},
  {name: '10-15 years', ageRange: '10-15', slug: '10-15-years'},
  {name: '16+ years', ageRange: '16+', slug: '16-plus-years'},
  {name: '18+ years', ageRange: '18+', slug: '18-plus-years'},
]

async function createDocument(doc: any) {
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`
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
}

async function seedAgeRanges() {
  console.log('Starting age range category seeding...')
  console.log(`Project: ${projectId}, Dataset: ${dataset}\n`)

  try {
    for (const ageRange of ageRanges) {
      console.log(`Creating: ${ageRange.name}...`)

      await createDocument({
        _type: 'category',
        name: ageRange.name,
        slug: {current: ageRange.slug},
        ageRange: ageRange.ageRange,
        isAgeRangeRoot: true,
        depth: 0,
        fullPath: [ageRange.name],
        description: `Content curated for children aged ${ageRange.ageRange}`,
        isVisible: true,
      })

      console.log(`✓ Created: ${ageRange.name}`)
    }

    console.log('\n✅ All age range categories created successfully!')
    console.log('\nNote: These categories are immutable and cannot be deleted.')
  } catch (error: any) {
    console.error('\n❌ Error creating age range categories:', error.message)
    process.exit(1)
  }
}

seedAgeRanges()
