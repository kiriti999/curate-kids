import { createClient } from '@sanity/client'
import { extractYoutubeId } from '../schemaTypes/utils/extractYoutubeId'

const client = createClient({
    projectId: '3rcl6ir9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

async function updateYoutubeIds() {
    console.log('🔍 Fetching all video documents...')

    // Fetch all video documents (both drafts and published)
    const videos = await client.fetch(`
    *[_type == "video"] {
      _id,
      title,
      youtubeUrl,
      youtubeId
    }
  `)

    console.log(`📊 Found ${videos.length} video documents`)

    // Filter videos that need YouTube ID extraction
    const videosToUpdate = videos.filter(
        (video: any) => video.youtubeUrl && !video.youtubeId
    )

    console.log(`🎯 ${videosToUpdate.length} videos need YouTube ID extraction`)

    if (videosToUpdate.length === 0) {
        console.log('✅ All videos already have YouTube IDs!')
        return
    }

    console.log('\n📝 Videos to update:')
    videosToUpdate.forEach((video: any) => {
        const extractedId = extractYoutubeId(video.youtubeUrl)
        console.log(`  - ${video.title}`)
        console.log(`    URL: ${video.youtubeUrl}`)
        console.log(`    Extracted ID: ${extractedId || 'FAILED TO EXTRACT'}`)
    })

    console.log('\n⚠️  This will extract and set YouTube IDs for these videos.')
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')

    await new Promise((resolve) => setTimeout(resolve, 5000))

    console.log('🚀 Starting update...\n')

    let transaction = client.transaction()
    let updateCount = 0

    videosToUpdate.forEach((video: any) => {
        const youtubeId = extractYoutubeId(video.youtubeUrl)
        if (youtubeId) {
            transaction = transaction.patch(video._id, { set: { youtubeId } })
            updateCount++
        } else {
            console.warn(`⚠️  Could not extract ID from: ${video.youtubeUrl}`)
        }
    })

    if (updateCount === 0) {
        console.log('❌ No valid YouTube IDs could be extracted')
        return
    }

    try {
        const result = await transaction.commit()
        console.log('✅ Update complete!')
        console.log(`📦 Updated ${result.results.length} documents`)
    } catch (error) {
        console.error('❌ Error during update:', error)
        throw error
    }
}

updateYoutubeIds()
    .then(() => {
        console.log('\n🎉 Migration completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n💥 Migration failed:', error)
        process.exit(1)
    })
