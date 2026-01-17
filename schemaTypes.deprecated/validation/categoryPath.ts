/**
 * Validate category path structure
 */
export function validateCategoryPath(path: string[]): boolean {
  if (!path || path.length === 0) return false
  if (path.length > 10) return false // Max depth limit
  return path.every((segment) => segment && segment.length > 0)
}

/**
 * Validate category depth
 */
export function validateDepth(depth: number): boolean {
  return depth >= 0 && depth <= 10
}

/**
 * Custom validation rule for category depth
 */
export const depthRule = (value: number | undefined) => {
  if (value === undefined || value === null) return true

  if (!validateDepth(value)) {
    return 'Category depth must be between 0 and 10'
  }

  return true
}
