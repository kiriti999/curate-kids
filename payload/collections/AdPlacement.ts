/**
 * AdPlacement Collection Schema
 * 
 * Configuration for advertisements displayed on the platform.
 * Supports banners, affiliate links, and native ads with scheduling.
 * Migrated from Sanity CMS adPlacement document type.
 */

import { CollectionConfig } from 'payload'
import {
  AD_PLACEMENT_TYPES,
  AD_PLACEMENT_POSITIONS,
  AD_PLACEMENT_STATUSES,
  AD_CONTENT_TYPES,
  VIDEO_AGE_RANGE_OPTIONS,
} from '../../config/constants'
import { beforeValidateAdPlacementHook, afterReadAdPlacementHook } from '../hooks/adPlacementHooks'

export const AdPlacement: CollectionConfig = {
  slug: 'ad-placements',
  
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'position', 'status', 'priority'],
    description: 'Advertisement placements and configurations',
  },
  
  // Access control
  access: {
    read: () => true, // Public read access for frontend
    create: ({ req }) => req.user?.role === 'admin', // Only admins can create ads
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  
  fields: [
    // Ad name
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Ad placement name (internal reference)',
      },
    },
    
    // Ad type
    {
      name: 'type',
      type: 'radio',
      required: true,
      options: AD_PLACEMENT_TYPES,
      admin: {
        description: 'Type of advertisement',
      },
    },
    
    // Position
    {
      name: 'position',
      type: 'select',
      required: true,
      options: AD_PLACEMENT_POSITIONS,
      admin: {
        description: 'Where the ad appears on the page',
      },
    },
    
    // Ad content (group field)
    {
      name: 'content',
      type: 'group',
      fields: [
        {
          name: 'contentType',
          type: 'radio',
          required: true,
          defaultValue: 'html',
          options: AD_CONTENT_TYPES,
          admin: {
            description: 'Type of ad content',
          },
        },
        {
          name: 'htmlCode',
          type: 'textarea',
          admin: {
            description: 'HTML code for the ad',
            condition: (data, siblingData) => siblingData?.contentType === 'html',
          },
        },
        {
          name: 'imageUrl',
          type: 'text',
          admin: {
            description: 'URL of the ad image',
            condition: (data, siblingData) => siblingData?.contentType === 'image',
          },
          validate: (value, { siblingData }) => {
            if (siblingData?.contentType === 'image' && !value) {
              return 'Image URL is required when content type is image'
            }
            if (value && !value.match(/^https?:\/\/.+/)) {
              return 'Please enter a valid URL'
            }
            return true
          },
        },
        {
          name: 'linkUrl',
          type: 'text',
          required: true,
          admin: {
            description: 'Click destination URL',
          },
          validate: (value) => {
            if (!value.match(/^https?:\/\/.+/)) {
              return 'Please enter a valid URL'
            }
            return true
          },
        },
        {
          name: 'altText',
          type: 'text',
          admin: {
            description: 'Alt text for image ads',
            condition: (data, siblingData) => siblingData?.contentType === 'image',
          },
          validate: (value, { siblingData }) => {
            if (siblingData?.contentType === 'image' && !value) {
              return 'Alt text is required for image ads'
            }
            return true
          },
        },
      ],
    },
    
    // Target age ranges
    {
      name: 'ageRanges',
      type: 'select',
      hasMany: true,
      options: VIDEO_AGE_RANGE_OPTIONS.map(opt => ({
        label: opt.title,
        value: opt.value,
      })),
      admin: {
        description: 'Target age ranges (empty = all ages)',
      },
    },
    
    // Priority
    {
      name: 'priority',
      type: 'number',
      required: true,
      defaultValue: 50,
      min: 1,
      max: 100,
      admin: {
        description: 'Ad priority (1-100, higher = shown first)',
      },
    },
    
    // Status
    {
      name: 'status',
      type: 'radio',
      required: true,
      defaultValue: 'inactive',
      options: AD_PLACEMENT_STATUSES,
      admin: {
        description: 'Current status of the ad',
      },
    },
    
    // Start date
    {
      name: 'startDate',
      type: 'date',
      admin: {
        description: 'Ad start date/time (for scheduled ads)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    
    // End date
    {
      name: 'endDate',
      type: 'date',
      admin: {
        description: 'Ad end date/time (for scheduled ads)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      validate: (value, { data }) => {
        if (value && data.startDate && new Date(value) <= new Date(data.startDate)) {
          return 'End date must be after start date'
        }
        return true
      },
    },
    
    // Inline position config (for inline ads)
    {
      name: 'inlinePosition',
      type: 'group',
      admin: {
        condition: (data) => data.position === 'inline',
      },
      fields: [
        {
          name: 'everyNVideos',
          type: 'number',
          required: true,
          min: 1,
          admin: {
            description: 'Show ad every N videos (e.g., 5 = every 5 videos)',
          },
        },
        {
          name: 'offsetStart',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: {
            description: 'Start showing after N videos (default: 0)',
          },
        },
      ],
    },
    
    // Affiliate partner
    {
      name: 'affiliatePartner',
      type: 'relationship',
      relationTo: 'affiliate-partners',
      admin: {
        description: 'Associated affiliate partner (if applicable)',
        position: 'sidebar',
      },
    },
    
    // Impression count
    {
      name: 'impressionCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total impressions (aggregated from activity logs)',
      },
    },
    
    // Click count
    {
      name: 'clickCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total clicks (aggregated from activity logs)',
      },
    },
    
    // CTR (calculated field)
    {
      name: 'ctr',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Click-through rate (clickCount / impressionCount)',
      },
    },
    
    // Admin notes
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this ad',
        position: 'sidebar',
      },
    },
    
    // Sanity ID for migration tracking
    {
      name: 'sanityId',
      type: 'text',
      admin: {
        hidden: true,
        description: 'Original Sanity CMS document ID (for migration tracking)',
      },
    },
  ],
  
  // Hooks
  hooks: {
    // T028-T030: Validate inline position and date range
    beforeValidate: [beforeValidateAdPlacementHook],
    
    // T029: Calculate CTR from clicks/impressions
    afterRead: [afterReadAdPlacementHook],
  },
  
}
