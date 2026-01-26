/**
 * Slug Generation Utility
 * 
 * Provides consistent URL-safe slug generation for all collections.
 * Based on industry-standard slugification rules.
 */

/**
 * Remove accents and diacritics from string
 * 
 * @param str - String with potential accents
 * @returns String with accents normalized
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Convert string to lowercase and replace spaces/special chars with hyphens
 * 
 * @param str - String to convert
 * @returns Slug-safe string
 */
function toSlugFormat(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate URL-safe slug from string
 * 
 * Rules:
 * - Converts to lowercase
 * - Removes accents and diacritics
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Truncates to max 96 characters
 * - Ensures no leading/trailing hyphens
 * 
 * @param text - Text to slugify
 * @param maxLength - Maximum length of slug (default: 96)
 * @returns URL-safe slug
 * 
 * @example
 * ```typescript
 * slugify('Hello World!') // 'hello-world'
 * slugify('Café Münchën') // 'cafe-munchen'
 * slugify('  Multiple   Spaces  ') // 'multiple-spaces'
 * ```
 */
export function slugify(text: string, maxLength = 96): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const slug = toSlugFormat(removeAccents(text.trim()))
  return slug.substring(0, maxLength)
}

/**
 * Generate unique slug with numeric suffix if needed
 * 
 * @param text - Text to slugify
 * @param existingSlugs - Array of existing slugs to check against
 * @param maxLength - Maximum length of slug (default: 96)
 * @returns Unique URL-safe slug
 * 
 * @example
 * ```typescript
 * slugifyUnique('My Post', ['my-post']) // 'my-post-2'
 * slugifyUnique('My Post', ['my-post', 'my-post-2']) // 'my-post-3'
 * ```
 */
export function slugifyUnique(
  text: string,
  existingSlugs: string[],
  maxLength = 96
): string {
  const baseSlug = slugify(text, maxLength - 4) // Reserve space for suffix
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  let counter = 2
  let candidateSlug = `${baseSlug}-${counter}`
  
  while (existingSlugs.includes(candidateSlug)) {
    counter++
    candidateSlug = `${baseSlug}-${counter}`
    
    // Safety check to prevent infinite loop
    if (counter > 10000) {
      throw new Error('Unable to generate unique slug after 10000 attempts')
    }
  }

  return candidateSlug.substring(0, maxLength)
}

/**
 * Validate if string is a valid slug format
 * 
 * @param slug - String to validate
 * @returns True if valid slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false
  }

  // Valid slug: lowercase letters, numbers, hyphens only
  // No leading/trailing hyphens, no consecutive hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length <= 96
}
