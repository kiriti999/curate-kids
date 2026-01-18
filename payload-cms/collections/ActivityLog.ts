/**
 * ActivityLog Collection Schema
 * 
 * Immutable audit trail for user actions, video views, ad interactions, and system events.
 * Provides analytics and tracking for all platform activities.
 * Migrated from Sanity CMS activityLog document type.
 */

import { CollectionConfig } from 'payload'
import { ACTIVITY_LOG_RESOURCE_TYPES } from '../../config/constants'

export const ActivityLog: CollectionConfig = {
  slug: 'activity-logs',
  
  admin: {
    useAsTitle: 'actionType',
    defaultColumns: ['actionType', 'resourceType', 'userId', 'createdAt'],
    description: 'Immutable audit trail for all platform activities',
  },
  
  // Access control - read-only collection
  access: {
    read: ({ req }) => !!req.user, // Only authenticated users can read logs
    create: () => false, // No manual creation through admin UI
    update: () => false, // Immutable - no updates allowed
    delete: ({ req }) => req.user?.role === 'admin', // Only admins can delete (for cleanup)
  },
  
  fields: [
    // Action type (resource.action format)
    {
      name: 'actionType',
      type: 'text',
      required: true,
      admin: {
        description: 'Action type in resource.action format (e.g., "video.view", "ad.click")',
      },
      validate: (value) => {
        // Validate pattern: resource.action
        const pattern = /^[a-z]+\.[a-z]+$/
        if (!pattern.test(value)) {
          return 'Action type must be in format "resource.action" (e.g., "video.view")'
        }
        return true
      },
    },
    
    // User ID (nullable for anonymous actions)
    {
      name: 'userId',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who performed action (null for anonymous)',
      },
    },
    
    // Session ID
    {
      name: 'sessionId',
      type: 'text',
      admin: {
        description: 'Browser session identifier (UUID format)',
      },
    },
    
    // IP Address (anonymized)
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'Anonymized IP address (last octet removed)',
      },
      validate: (value) => {
        if (!value) return true
        
        // Check if IP is anonymized (last octet should be 0)
        const parts = value.split('.')
        if (parts.length === 4 && parts[3] !== '0') {
          return 'IP address must be anonymized (last octet must be 0)'
        }
        return true
      },
    },
    
    // User Agent
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'Browser user agent string',
      },
    },
    
    // Resource type
    {
      name: 'resourceType',
      type: 'select',
      required: true,
      options: ACTIVITY_LOG_RESOURCE_TYPES,
      admin: {
        description: 'Type of resource affected by this action',
      },
    },
    
    // Resource ID
    {
      name: 'resourceId',
      type: 'text',
      required: true,
      admin: {
        description: 'ID of the affected resource',
      },
    },
    
    // Metadata (flexible JSON for action-specific data)
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Action-specific metadata (flexible JSON object)',
      },
    },
    
    // Created timestamp (immutable)
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Timestamp when action occurred (immutable)',
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
    beforeChange: [
      // Ensure createdAt is set to current timestamp (immutable)
      ({ data }) => {
        if (!data.createdAt) {
          data.createdAt = new Date()
        }
        return data
      },
    ],
  },
  
  // Timestamps
  timestamps: true,
  
  // Note: Indexes can be added later via MongoDB directly if needed
}
