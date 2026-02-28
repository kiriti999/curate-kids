/**
 * Seed Categories Script
 * 
 * Populates the Payload CMS `categories` collection with the existing
 * hardcoded VIDEO_CATEGORY_OPTIONS so the frontend sidebar is driven by the DB.
 * 
 * Usage: npx tsx scripts/seed-categories.ts
 */

import { getPayload } from 'payload'
import config from '../payload.config'

const CATEGORIES_TO_SEED = [
    { name: 'Education', slug: 'education', sortOrder: 0 },
    { name: 'Entertainment', slug: 'entertainment', sortOrder: 1 },
    { name: 'Music', slug: 'music', sortOrder: 2 },
    { name: 'Science', slug: 'science', sortOrder: 3 },
    { name: 'Arts & Crafts', slug: 'arts-crafts', sortOrder: 4 },
    { name: 'Sports', slug: 'sports', sortOrder: 5 },
    { name: 'Nature', slug: 'nature', sortOrder: 6 },
    { name: 'Stories', slug: 'stories', sortOrder: 7 },
]

async function seed() {
    console.log('🌱 Seeding categories...')

    const payload = await getPayload({ config })

    for (const cat of CATEGORIES_TO_SEED) {
        // Check if already exists
        const existing = await payload.find({
            collection: 'categories',
            where: { slug: { equals: cat.slug } },
            limit: 1,
        })

        if (existing.docs.length > 0) {
            console.log(`  ⏭️  "${cat.name}" already exists, skipping`)
            continue
        }

        await payload.create({
            collection: 'categories',
            data: {
                name: cat.name,
                slug: cat.slug,
                depth: 0,
                isVisible: true,
                sortOrder: cat.sortOrder,
                childCount: 0,
                videoCount: 0,
            },
        })

        console.log(`  ✅ Created "${cat.name}"`)
    }

    console.log('\n🎉 Done! Categories seeded successfully.')
    process.exit(0)
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
})
