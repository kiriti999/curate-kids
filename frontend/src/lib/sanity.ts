import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: '3rcl6ir9',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYoutubeId(url: string): string | null {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

export async function getPublishedVideos() {
  const videos = await client.fetch(
    `*[_type == "video" && !(_id in path("drafts.**"))] | order(_createdAt desc) {
      _id,
      _createdAt,
      title,
      youtubeId,
      youtubeUrl,
      category,
      ageRange,
      tags
    }`,
    {},
    { next: { revalidate: 60 } } // Cache for 60 seconds
  )

  // Extract YouTube IDs from URLs if they're not already set
  return videos.map((video: any) => ({
    ...video,
    youtubeId: video.youtubeId || extractYoutubeId(video.youtubeUrl) || '',
  }))
}
