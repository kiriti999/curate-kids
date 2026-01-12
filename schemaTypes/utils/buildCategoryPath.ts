/**
 * Build full category path from parent references
 * Returns array of category names from root to current
 */
export function buildCategoryPath(categoryName: string, parentPath?: string[]): string[] {
  if (!parentPath || parentPath.length === 0) {
    return [categoryName]
  }
  return [...parentPath, categoryName]
}

/**
 * Calculate category depth based on parent depth
 */
export function calculateDepth(parentDepth?: number): number {
  return parentDepth !== undefined ? parentDepth + 1 : 0
}
