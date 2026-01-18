/**
 * Category Collection Schema
 * 
 * Hierarchical categorization system for videos.
 * Supports up to 10 levels of nesting with age range root categories.
 * Migrated from Sanity CMS category document type.
 */

import { CollectionConfig } from 'payload'
import { CATEGORY_AGE_RANGE_OPTIONS, PAYLOAD_CONFIG } from '../../config/constants'
import { beforeValidateCategoryHook, afterChangeCategoryHook, afterDeleteCategoryHook } from '../hooks/categoryHooks'

export const Category: CollectionConfig = {
  slug: 'categories',
  
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'ageRange', 'depth', 'isVisible', 'videoCount'],
    description: 'Hierarchical category system for video organization',
  },
  
  // Access control
  access: {
    read: () => true, // Public read access for frontend
    create: ({ req }) => !!req.user, // Authenticated users only
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  
  fields: [
    // Category name
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Category name (e.g., "Math", "Science")',
      },
    },
    
    // Slug (URL-safe identifier)
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      maxLength: 96,
      admin: {
        position: 'sidebar',
        description: 'URL-safe identifier (auto-generated from name)',
      },
    },
    
    // Description
    {
      name: 'description',
      type: 'textarea',
      maxLength: 500,
      admin: {
        description: 'Category description for users',
      },
    },
    
    // Icon/Image
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Category icon or representative image',
      },
    },
    
    // Age Range
    {
      name: 'ageRange',
      type: 'select',
      required: true,
      options: CATEGORY_AGE_RANGE_OPTIONS.map(opt => ({
        label: opt.title,
        value: opt.value,
      })),
      admin: {
        description: 'Age range this category belongs to',
      },
    },
    
    // Parent category (for hierarchy)
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Parent category (null for age range root categories)',
        position: 'sidebar',
      },
      // Validation will be handled by beforeValidate hook
    },
    
    // Full path from root (auto-calculated)
    {
      name: 'fullPath',
      type: 'array',
      admin: {
        readOnly: true,
        description: 'Complete path from root to this category',
      },
      fields: [
        {
          name: 'categoryName',
          type: 'text',
        },
      ],
    },
    
    // Depth in hierarchy (auto-calculated)
    {
      name: 'depth',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      max: PAYLOAD_CONFIG.MAX_DEPTH - 1,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Depth in hierarchy (0 for age ranges, 1+ for content)',
      },
    },
    
    // Is age range root category
    {
      name: 'isAgeRangeRoot',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'True for predefined age range categories (immutable)',
      },
    },
    
    // Sort order within siblings
    {
      name: 'sortOrder',
      type: 'number',
      admin: {
        description: 'Custom ordering within siblings (lower = first)',
      },
    },
    
    // Visibility toggle
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show this category in frontend navigation',
      },
    },
    
    // Child count (auto-calculated)
    {
      name: 'childCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Number of direct child categories',
      },
    },
    
    // Video count (auto-calculated)
    {
      name: 'videoCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Number of videos in this category',
      },
    },
    
    // Admin notes
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes (not displayed publicly)',
        position: 'sidebar',
      },
    },
  ],
  
  // Hooks
  hooks: {
    // T021-T022: Calculate depth, fullPath, and validate hierarchy rules
    beforeValidate: [beforeValidateCategoryHook],
    
    // T023: Update parent's childCount when category added/removed
    afterChange: [afterChangeCategoryHook],
    afterDelete: [afterDeleteCategoryHook],
  },
  
}
