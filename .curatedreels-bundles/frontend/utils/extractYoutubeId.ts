/**
 * YouTube ID Extractor
 * 
 * Extracts YouTube video ID from various URL formats.
 * Consolidates duplicate implementations across the codebase.
 */

import { YOUTUBE_URL_PATTERNS } from '../config/constants'

/**
 * Check if input is valid for extraction
 * 
 * @param url - URL string to validate
 * @returns True if URL is valid for extraction
 */
function isValidInput(url: string): boolean {
  return !!url && typeof url === 'string' && url.trim().length > 0
}

/**
 * Try to extract ID using a single pattern
 * 
 * @param url - URL to extract from
 * @param pattern - RegExp pattern to match
 * @returns Extracted ID or null if no match
 */
function tryExtractWithPattern(url: string, pattern: RegExp): string | null {
  const match = url.match(pattern)
  return match && match[1] ? match[1] : null
}

/**
 * Extract YouTube video ID from URL or return null if invalid
 * 
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID (11 characters)
 * 
 * @param url - YouTube URL or video ID
 * @returns 11-character video ID or null if invalid
 */
export function extractYoutubeId(url: string): string | null {
  if (!isValidInput(url)) {
    return null
  }

  const trimmedUrl = url.trim()

  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const extractedId = tryExtractWithPattern(trimmedUrl, pattern)
    if (extractedId) {
      return extractedId
    }
  }

  return null
}
