/**
 * Validate YouTube URL format
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
export function validateYoutubeUrl(url: string): boolean {
  if (!url) return false

  const pattern =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/

  return pattern.test(url)
}

/**
 * Custom validation rule for Sanity schema
 */
export const youtubeUrlRule = (value: string | undefined) => {
  if (!value) return true // Let required field handle empty values

  if (!validateYoutubeUrl(value)) {
    return 'Please enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)'
  }

  return true
}
