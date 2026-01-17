import {defineType, defineField} from 'sanity'
import {TagIcon} from '@sanity/icons'
import {depthRule} from '../validation/categoryPath'
import {CATEGORY_AGE_RANGE_OPTIONS, SANITY_CONFIG} from '../../config/constants'

function validateRootParent(isRoot: boolean, parent: any) {
  if (isRoot && parent) {
    return 'Age range root categories cannot have a parent'
  }
  return true
}

function validateNonRootParent(isRoot: boolean, parent: any) {
  if (!isRoot && !parent) {
    return 'Non-root categories must have a parent'
  }
  return true
}

async function validateParentCategory(parent: any, context: any) {
  const isRoot = context.document?.isAgeRangeRoot
  const rootResult = validateRootParent(isRoot, parent)
  if (rootResult !== true) return rootResult
  
  const nonRootResult = validateNonRootParent(isRoot, parent)
  if (nonRootResult !== true) return nonRootResult
  
  if (!parent?._ref) return true
  
  const {getClient} = context
  const client = getClient({apiVersion: SANITY_CONFIG.API_VERSION})
  
  // Fetch parent category
  const parentCategory = await client.fetch(
    `*[_id == $id][0]{ ageRange, isAgeRangeRoot, depth }`,
    {id: parent._ref}
  )
  
  if (!parentCategory) return 'Parent category not found'
  
  // Validate same age range
  const currentAgeRange = context.document?.ageRange
  if (currentAgeRange && parentCategory.ageRange !== currentAgeRange) {
    return 'Parent category must be in the same age range'
  }
  
  // Check depth limit (max 10 levels)
  if (parentCategory.depth >= 9) {
    return 'Maximum category depth (10 levels) exceeded'
  }
  
  // Prevent circular references
  const currentId = context.document?._id
  if (currentId && parent._ref === currentId) {
    return 'A category cannot be its own parent'
  }
  
  // Check if parent is in current category's subtree (prevents circular references)
  if (currentId) {
    const isCircular = await client.fetch(
      `*[_type == "category" && _id == $parentId && $currentId in path("parent._ref")[0..10]._ref]`,
      {parentId: parent._ref, currentId}
    )
    
    if (isCircular && isCircular.length > 0) {
      return 'Cannot create circular reference (parent cannot be a descendant)'
    }
  }
  
  return true
}

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
      description: 'Category name (e.g., "Math", "Education", "5-7 years")',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'URL-safe identifier',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: 'icon',
      title: 'Icon/Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Category icon or representative image',
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      options: {
        list: CATEGORY_AGE_RANGE_OPTIONS,
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
      description: 'Age range this category belongs to',
    }),
    defineField({
      name: 'parent',
      title: 'Parent Category',
      type: 'reference',
      to: [{type: 'category'}],
      description: 'Parent category (leave empty for age range root categories)',
      validation: (Rule) => Rule.custom(validateParentCategory),
    }),
    defineField({
      name: 'fullPath',
      title: 'Full Path',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
      description: 'Complete path from root to this category (auto-calculated)',
    }),
    defineField({
      name: 'depth',
      title: 'Depth',
      type: 'number',
      readOnly: true,
      validation: (Rule) => Rule.required().custom(depthRule),
      initialValue: 0,
      description: 'Depth in hierarchy (0 for age ranges, 1+ for content categories)',
    }),
    defineField({
      name: 'isAgeRangeRoot',
      title: 'Is Age Range Root',
      type: 'boolean',
      readOnly: true,
      initialValue: false,
      description: 'True for predefined age range categories (immutable)',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Custom ordering within siblings (lower numbers appear first)',
    }),
    defineField({
      name: 'isVisible',
      title: 'Visible',
      type: 'boolean',
      initialValue: true,
      description: 'Show this category in frontend navigation',
    }),
    defineField({
      name: 'childCount',
      title: 'Child Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Number of direct child categories (auto-calculated)',
    }),
    defineField({
      name: 'videoCount',
      title: 'Video Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Number of videos assigned to this category (auto-calculated)',
    }),
    defineField({
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 2,
      description: 'Internal notes (not displayed publicly)',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      fullPath: 'fullPath',
      childCount: 'childCount',
      videoCount: 'videoCount',
      depth: 'depth',
      media: 'icon',
    },
    prepare({title, subtitle, fullPath, childCount, videoCount, depth, media}) {
      const counts = []
      if (childCount > 0) counts.push(`${childCount} subcategories`)
      if (videoCount > 0) counts.push(`${videoCount} videos`)
      
      const pathDisplay = fullPath ? fullPath.join(' → ') : subtitle
      const countsDisplay = counts.length > 0 ? ` • ${counts.join(', ')}` : ''
      const depthIndicator = depth > 0 ? `${'  '.repeat(depth)}↳ ` : ''
      
      return {
        title: `${depthIndicator}${title}`,
        subtitle: `${pathDisplay}${countsDisplay}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
    {
      title: 'Sort Order',
      name: 'sortOrder',
      by: [{field: 'sortOrder', direction: 'asc'}],
    },
  ],
})
