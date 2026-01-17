/**
 * Constants Configuration
 * 
 * Centralized constants to eliminate magic strings and hardcoded values.
 * All constants use SCREAMING_SNAKE_CASE and are exported with 'as const'.
 */

/**
 * Sanity CMS Configuration
 */
export const SANITY_CONFIG = {
  API_VERSION: '2024-01-01',
  CACHE_REVALIDATE_SECONDS: 300,
} as const

/**
 * Retry Configuration for external API calls
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 2000,
} as const

/**
 * YouTube URL patterns for ID extraction
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, raw ID
 */
export const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /^([a-zA-Z0-9_-]{11})$/,
] as const

/**
 * Category options for video categorization
 * Used in video.ts schema
 */
export const VIDEO_CATEGORY_OPTIONS = [
  { title: 'Education', value: 'education' },
  { title: 'Entertainment', value: 'entertainment' },
  { title: 'Music', value: 'music' },
  { title: 'Science', value: 'science' },
  { title: 'Arts & Crafts', value: 'arts-crafts' },
  { title: 'Sports', value: 'sports' },
  { title: 'Nature', value: 'nature' },
  { title: 'Stories', value: 'stories' },
]

/**
 * Age range options for video content targeting
 * Used in video.ts schema
 */
export const VIDEO_AGE_RANGE_OPTIONS = [
  { title: '0-2 years', value: '0-2' },
  { title: '3-5 years', value: '3-5' },
  { title: '6-8 years', value: '6-8' },
  { title: '9-12 years', value: '9-12' },
  { title: '13+ years', value: '13+' },
]

/**
 * Category age range options (for category.ts schema)
 * Different from video age ranges - used for category hierarchy
 */
export const CATEGORY_AGE_RANGE_OPTIONS = [
  { title: '0-2 years', value: '0-2' },
  { title: '2-4 years', value: '2-4' },
  { title: '5-7 years', value: '5-7' },
  { title: '8-9 years', value: '8-9' },
  { title: '10-15 years', value: '10-15' },
  { title: '16+ years', value: '16+' },
  { title: '18+ years', value: '18+' },
]
