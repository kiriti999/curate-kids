import { createClient } from '@sanity/client'

const client = createClient({
    projectId: '3rcl6ir9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN, // You'll need to provide this
    useCdn: false, // Don't use CDN for mutations
})

async function removeStatusField() {
    console.log('🔍 Fetching all video documents...')

    // Fetch all video documents (both drafts and published)
    const videos = await client.fetch(`
    *[_type == "video"] {
      _id,
      _rev,
      title,
      status,
      publishedAt
    }
  `)

    console.log(`📊 Found ${videos.length} video documents`)

    // Filter videos that have status or publishedAt fields
    const videosToUpdate = videos.filter(
        (video: any) => video.status !== undefined || video.publishedAt !== undefined
    )

    console.log(`🎯 ${videosToUpdate.length} documents need cleanup`)

    if (videosToUpdate.length === 0) {
        console.log('✅ No cleanup needed!')
        return
    }

    console.log('\n📝 Documents to update:')
    videosToUpdate.forEach((video: any) => {
        console.log(`  - ${video.title} (${video._id})`)
        if (video.status) console.log(`    └─ status: ${video.status}`)
        if (video.publishedAt) console.log(`    └─ publishedAt: ${video.publishedAt}`)
    })

    console.log('\n⚠️  This will remove the status and publishedAt fields from these documents.')
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')

    // Wait 5 seconds before proceeding
    await new Promise((resolve) => setTimeout(resolve, 5000))

    console.log('🚀 Starting cleanup...\n')

    // Create a transaction to unset the fields
    let transaction = client.transaction()

    videosToUpdate.forEach((video: any) => {
        transaction = transaction.patch(video._id, (patch) =>
            patch.unset(['status', 'publishedAt'])
        )
    })

    // Execute the transaction
    try {
        const result = await transaction.commit()
        console.log('✅ Cleanup complete!')
        console.log(`📦 Updated ${result.results.length} documents`)
    } catch (error) {
        console.error('❌ Error during cleanup:', error)
        throw error
    }
}

// Run the migration
removeStatusField()
    .then(() => {
        console.log('\n🎉 Migration completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n💥 Migration failed:', error)
        process.exit(1)
    })
