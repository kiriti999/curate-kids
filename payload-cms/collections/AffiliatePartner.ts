/**
 * AffiliatePartner Collection Schema
 * 
 * Affiliate partner management for tracking commissions and performance metrics.
 * Linked to AdPlacement for revenue tracking.
 * Migrated from Sanity CMS affiliatePartner document type.
 */

import { CollectionConfig } from 'payload'
import { COMMISSION_TYPES, AFFILIATE_PARTNER_STATUSES } from '../../config/constants'
import { afterReadAffiliatePartnerHook } from '../hooks/affiliatePartnerHooks'

export const AffiliatePartner: CollectionConfig = {
  slug: 'affiliate-partners',
  
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'contactEmail', 'commissionType', 'status', 'totalClicks'],
    description: 'Affiliate partner management and performance tracking',
  },
  
  // Access control
  access: {
    read: ({ req }) => !!req.user, // Only authenticated users can read partners
    create: ({ req }) => req.user?.role === 'admin', // Only admins can create partners
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  
  fields: [
    // Partner name
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Partner company or brand name',
      },
    },
    
    // Contact email
    {
      name: 'contactEmail',
      type: 'email',
      required: true,
      admin: {
        description: 'Partner contact email address',
      },
    },
    
    // Website
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Partner website URL',
      },
      validate: (value) => {
        if (value && !value.match(/^https?:\/\/.+/)) {
          return 'Please enter a valid URL'
        }
        return true
      },
    },
    
    // Tracking URL template
    {
      name: 'trackingUrlTemplate',
      type: 'text',
      required: true,
      admin: {
        description: 'Tracking URL template with {adId} and {sessionId} placeholders',
      },
      validate: (value) => {
        if (!value.match(/^https?:\/\/.+/)) {
          return 'Please enter a valid URL'
        }
        if (!value.includes('{adId}') || !value.includes('{sessionId}')) {
          return 'URL must include {adId} and {sessionId} placeholders'
        }
        return true
      },
    },
    
    // Commission rate
    {
      name: 'commissionRate',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Commission rate percentage (0-100)',
      },
    },
    
    // Commission type
    {
      name: 'commissionType',
      type: 'radio',
      required: true,
      options: COMMISSION_TYPES,
      admin: {
        description: 'Commission payment model',
      },
    },
    
    // Payment terms
    {
      name: 'paymentTerms',
      type: 'textarea',
      admin: {
        description: 'Payment terms and conditions',
      },
    },
    
    // Status
    {
      name: 'status',
      type: 'radio',
      required: true,
      defaultValue: 'pending',
      options: AFFILIATE_PARTNER_STATUSES,
      admin: {
        description: 'Current partner status',
      },
    },
    
    // Total impressions (calculated)
    {
      name: 'totalImpressions',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total impressions across all partner ads',
      },
    },
    
    // Total clicks (calculated)
    {
      name: 'totalClicks',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total clicks across all partner ads',
      },
    },
    
    // Conversion rate (calculated)
    {
      name: 'conversionRate',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Conversion rate (totalClicks / totalImpressions)',
      },
    },
    
    // Onboarded timestamp
    {
      name: 'onboardedAt',
      type: 'date',
      admin: {
        description: 'Timestamp when partner was onboarded',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    
    // Last payout timestamp
    {
      name: 'lastPayoutAt',
      type: 'date',
      admin: {
        description: 'Timestamp of last payout',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    
    // Admin notes
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this partner',
        position: 'sidebar',
      },
    },
  ],
  
  // Hooks
  hooks: {
    // T031-T032: Calculate conversion rate from totalClicks and totalImpressions
    afterRead: [afterReadAffiliatePartnerHook],
  },
  
}
