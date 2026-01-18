/**
 * Category Collection Hooks
 * 
 * Handles hierarchical depth calculation, fullPath generation, childCount updates,
 * and circular reference prevention.
 */

import { CollectionBeforeValidateHook, CollectionAfterChangeHook } from 'payload'
import { slugify } from '../../utils/slugify'
import { PAYLOAD_CONFIG } from '../../config/constants'

/**
 * beforeValidate Hook: Calculate depth, fullPath, and validate hierarchy rules
 * 
 * T021: Calculate depth and fullPath
 * T022: Validate parent rules (age range root, max depth, circular references)
 */
export const beforeValidateCategoryHook: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  // Auto-generate slug from name if not provided
  if (data?.name && !data.slug) {
    data.slug = slugify(data.name)
  }

  // Validate parent category rules
  if (data?.parent) {
    // Fetch parent category to validate rules
    const parentCategory = await req.payload.findByID({
      collection: 'categories',
      id: typeof data.parent === 'string' ? data.parent : data.parent.id,
    })

    // Rule 1: Age range root categories cannot be children
    if (data.isAgeRangeRoot) {
      throw new Error('Age range root categories cannot have a parent category')
    }

    // Rule 2: Non-root categories must have parent in same age range
    if (data.ageRange !== parentCategory.ageRange) {
      throw new Error('Child category must have the same age range as parent category')
    }

    // Rule 3: Prevent circular references
    if (operation === 'update' && originalDoc?.id) {
      // Check if parent or any ancestor is the current category
      let currentAncestor = parentCategory
      const visitedIds = new Set<string>()
      
      while (currentAncestor) {
        if (currentAncestor.id === originalDoc.id) {
          throw new Error('Circular reference detected: Category cannot be its own ancestor')
        }
        
        visitedIds.add(currentAncestor.id)
        
        if (currentAncestor.parent) {
          const parentId = typeof currentAncestor.parent === 'string' 
            ? currentAncestor.parent 
            : currentAncestor.parent.id
          
          if (visitedIds.has(parentId)) {
            throw new Error('Circular reference detected in category hierarchy')
          }
          
          currentAncestor = await req.payload.findByID({
            collection: 'categories',
            id: parentId,
          })
        } else {
          break
        }
      }
    }

    // Calculate depth: parent depth + 1
    data.depth = (parentCategory.depth || 0) + 1

    // Rule 4: Max depth validation
    if (data.depth > PAYLOAD_CONFIG.MAX_DEPTH - 1) {
      throw new Error(`Maximum category depth of ${PAYLOAD_CONFIG.MAX_DEPTH} exceeded`)
    }

    // Build fullPath by traversing up the parent chain
    const pathSegments: string[] = []
    let currentCat = parentCategory
    
    while (currentCat) {
      pathSegments.unshift(currentCat.slug)
      
      if (currentCat.parent) {
        const parentId = typeof currentCat.parent === 'string' 
          ? currentCat.parent 
          : currentCat.parent.id
        currentCat = await req.payload.findByID({
          collection: 'categories',
          id: parentId,
        })
      } else {
        break
      }
    }
    
    pathSegments.push(data.slug)
    data.fullPath = pathSegments
  } else {
    // No parent: This is a root category
    if (!data.isAgeRangeRoot) {
      // Non-age-range-root categories must have a parent
      throw new Error('Non-root categories must have a parent category')
    }
    
    data.depth = 0
    data.fullPath = [data.slug]
  }

  return data
}

/**
 * afterChange Hook: Update parent's childCount when category added/removed
 * 
 * T023: Update parent's childCount
 */
export const afterChangeCategoryHook: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  // Update parent category's childCount
  const updateParentChildCount = async (parentId: string | any) => {
    if (!parentId) return
    
    const actualParentId = typeof parentId === 'string' ? parentId : parentId.id
    
    // Count children
    const childrenCount = await req.payload.count({
      collection: 'categories',
      where: {
        parent: { equals: actualParentId },
      },
    })
    
    // Update parent's childCount
    await req.payload.update({
      collection: 'categories',
      id: actualParentId,
      data: {
        childCount: childrenCount.totalDocs,
      },
    })
  }

  if (operation === 'create' && doc.parent) {
    // New category created: update parent's childCount
    await updateParentChildCount(doc.parent)
  } else if (operation === 'update') {
    // Check if parent changed
    const oldParent = previousDoc?.parent
    const newParent = doc.parent
    
    if (oldParent !== newParent) {
      // Update both old and new parents
      if (oldParent) {
        await updateParentChildCount(oldParent)
      }
      if (newParent) {
        await updateParentChildCount(newParent)
      }
    }
  }

  return doc
}

/**
 * afterDelete Hook: Update parent's childCount when category deleted
 */
export const afterDeleteCategoryHook = async ({ doc, req }) => {
  if (doc.parent) {
    const parentId = typeof doc.parent === 'string' ? doc.parent : doc.parent.id
    
    // Count remaining children
    const childrenCount = await req.payload.count({
      collection: 'categories',
      where: {
        parent: { equals: parentId },
      },
    })
    
    // Update parent's childCount
    await req.payload.update({
      collection: 'categories',
      id: parentId,
      data: {
        childCount: childrenCount.totalDocs,
      },
    })
  }

  return doc
}
