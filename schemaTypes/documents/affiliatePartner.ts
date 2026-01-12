import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons'

export default defineType({
  name: 'affiliatePartner',
  title: 'Affiliate Partner',
  type: 'document',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Partner Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100).error('Partner name is required and must be under 100 characters'),
      description: 'Name of the affiliate partner',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      validation: (Rule) => Rule.email().error('Please enter a valid email address'),
      description: 'Primary contact email',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}).error('Please enter a valid URL'),
      description: 'Partner website URL',
    }),
    defineField({
      name: 'trackingUrlTemplate',
      title: 'Tracking URL Template',
      type: 'url',
      validation: (Rule) => Rule.required().error('Tracking URL template is required'),
      description: 'URL template with placeholders: {adId}, {sessionId}',
      placeholder: 'https://partner.com/track?ref=curatekids&ad={adId}&s={sessionId}',
    }),
    defineField({
      name: 'commissionRate',
      title: 'Commission Rate (%)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100).error('Commission rate must be between 0 and 100'),
      description: 'Commission percentage (0-100)',
    }),
    defineField({
      name: 'commissionType',
      title: 'Commission Type',
      type: 'string',
      options: {
        list: [
          {title: 'CPC (Cost Per Click)', value: 'cpc'},
          {title: 'CPA (Cost Per Action)', value: 'cpa'},
          {title: 'CPM (Cost Per Mille)', value: 'cpm'},
        ],
        layout: 'radio',
      },
      description: 'Commission pricing model',
    }),
    defineField({
      name: 'paymentTerms',
      title: 'Payment Terms',
      type: 'text',
      rows: 3,
      description: 'Payment terms and conditions',
      placeholder: 'Net 30 days, minimum $100 payout',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Inactive', value: 'inactive'},
          {title: 'Pending', value: 'pending'},
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (Rule) => Rule.required(),
      description: 'Partner status',
    }),
    defineField({
      name: 'totalImpressions',
      title: 'Total Impressions',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Total impressions across all linked ads',
    }),
    defineField({
      name: 'totalClicks',
      title: 'Total Clicks',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Total clicks across all linked ads',
    }),
    defineField({
      name: 'conversionRate',
      title: 'Conversion Rate (%)',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Overall click-through rate',
    }),
    defineField({
      name: 'onboardedAt',
      title: 'Onboarded At',
      type: 'datetime',
      description: 'Date when partner was onboarded',
    }),
    defineField({
      name: 'lastPayoutAt',
      title: 'Last Payout Date',
      type: 'datetime',
      description: 'Date of last payment',
    }),
    defineField({
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 3,
      description: 'Internal notes about this partner',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      email: 'contactEmail',
      status: 'status',
      totalClicks: 'totalClicks',
      conversionRate: 'conversionRate',
    },
    prepare({title, email, status, totalClicks, conversionRate}) {
      const statusBadge = status === 'active' ? '✓' : status === 'pending' ? '🕒' : '✗'
      const metrics = totalClicks > 0 ? ` • ${totalClicks} clicks • ${conversionRate?.toFixed(2)}% CTR` : ''
      
      return {
        title: `${statusBadge} ${title}`,
        subtitle: `${email}${metrics}`,
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
      title: 'Conversion Rate (High to Low)',
      name: 'conversionDesc',
      by: [{field: 'conversionRate', direction: 'desc'}],
    },
  ],
})
