import {defineField, defineType} from 'sanity'
import {BillIcon} from '@sanity/icons'

export default defineType({
  name: 'adPlacement',
  title: 'Ad Placement',
  type: 'document',
  icon: BillIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100).error('Ad name is required and must be under 100 characters'),
      description: 'Admin reference name for this ad',
    }),
    defineField({
      name: 'type',
      title: 'Ad Type',
      type: 'string',
      options: {
        list: [
          {title: 'Banner', value: 'banner'},
          {title: 'Affiliate', value: 'affiliate'},
          {title: 'Native', value: 'native'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      description: 'Type of advertisement',
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      options: {
        list: [
          {title: 'Header', value: 'header'},
          {title: 'Footer', value: 'footer'},
          {title: 'Sidebar', value: 'sidebar'},
          {title: 'Inline (between videos)', value: 'inline'},
          {title: 'Floating', value: 'floating'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
      description: 'Where the ad will be displayed',
    }),
    defineField({
      name: 'content',
      title: 'Ad Content',
      type: 'object',
      fields: [
        {
          name: 'contentType',
          title: 'Content Type',
          type: 'string',
          options: {
            list: [
              {title: 'HTML Code', value: 'html'},
              {title: 'Image', value: 'image'},
            ],
            layout: 'radio',
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'htmlCode',
          title: 'HTML Code',
          type: 'text',
          rows: 5,
          hidden: ({parent}) => parent?.contentType !== 'html',
          validation: (Rule) =>
            Rule.custom((htmlCode, context) => {
              const contentType = (context.parent as any)?.contentType
              if (contentType === 'html' && !htmlCode) {
                return 'HTML code is required when content type is HTML'
              }
              return true
            }),
        },
        {
          name: 'imageUrl',
          title: 'Image URL',
          type: 'url',
          hidden: ({parent}) => parent?.contentType !== 'image',
          validation: (Rule) =>
            Rule.custom((imageUrl, context) => {
              const contentType = (context.parent as any)?.contentType
              if (contentType === 'image' && !imageUrl) {
                return 'Image URL is required when content type is image'
              }
              return true
            }),
        },
        {
          name: 'linkUrl',
          title: 'Link URL',
          type: 'url',
          description: 'Click destination URL',
        },
        {
          name: 'altText',
          title: 'Alt Text',
          type: 'string',
          hidden: ({parent}) => parent?.contentType !== 'image',
          description: 'Image alt text for accessibility',
        },
      ],
      validation: (Rule) => Rule.required(),
      description: 'Ad content configuration',
    }),
    defineField({
      name: 'ageRanges',
      title: 'Target Age Ranges',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              {title: '0-2 years', value: '0-2'},
              {title: '2-4 years', value: '2-4'},
              {title: '5-7 years', value: '5-7'},
              {title: '8-9 years', value: '8-9'},
              {title: '10-15 years', value: '10-15'},
              {title: '16+ years', value: '16+'},
              {title: '18+ years', value: '18+'},
            ],
          },
        },
      ],
      description: 'Show ad only for these age ranges (empty = all)',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(100)
          .error('Priority must be between 1 and 100'),
      description: 'Higher numbers shown first (1-100)',
      initialValue: 50,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Inactive', value: 'inactive'},
          {title: 'Scheduled', value: 'scheduled'},
        ],
        layout: 'radio',
      },
      initialValue: 'inactive',
      validation: (Rule) => Rule.required(),
      description: 'Ad status',
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      description: 'When the ad starts showing (optional)',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'When the ad stops showing (optional)',
      validation: (Rule) =>
        Rule.custom((endDate, context) => {
          const startDate = (context.document as any)?.startDate
          if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            return 'End date must be after start date'
          }
          return true
        }),
    }),
    defineField({
      name: 'inlinePosition',
      title: 'Inline Position Config',
      type: 'object',
      hidden: ({document}) => document?.position !== 'inline',
      fields: [
        {
          name: 'everyNVideos',
          title: 'Show After Every N Videos',
          type: 'number',
          validation: (Rule) => Rule.required().min(1),
          description: 'Insert ad after every N videos',
        },
        {
          name: 'offsetStart',
          title: 'Offset Start',
          type: 'number',
          initialValue: 0,
          validation: (Rule) => Rule.min(0),
          description: 'Start showing after N videos (default: 0)',
        },
      ],
      validation: (Rule) =>
        Rule.custom((inlinePosition, context) => {
          const position = (context.document as any)?.position
          if (position === 'inline' && !inlinePosition) {
            return 'Inline position configuration is required for inline ads'
          }
          return true
        }),
      description: 'Configure inline ad positioning',
    }),
    defineField({
      name: 'affiliatePartner',
      title: 'Affiliate Partner',
      type: 'reference',
      to: [{type: 'affiliatePartner'}],
      weak: true,
      description: 'Link to affiliate partner (optional)',
    }),
    defineField({
      name: 'impressionCount',
      title: 'Impressions',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Total impressions (aggregated from activity logs)',
    }),
    defineField({
      name: 'clickCount',
      title: 'Clicks',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Total clicks (aggregated from activity logs)',
    }),
    defineField({
      name: 'ctr',
      title: 'CTR (%)',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Click-through rate percentage',
    }),
    defineField({
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 3,
      description: 'Internal notes (not displayed publicly)',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      position: 'position',
      status: 'status',
      type: 'type',
      ctr: 'ctr',
    },
    prepare({title, position, status, type, ctr}) {
      const statusBadge = status === 'active' ? '✓' : status === 'scheduled' ? '🕒' : '✗'
      const positionLabel = position ? position.charAt(0).toUpperCase() + position.slice(1) : ''
      const ctrDisplay = ctr ? ` • CTR: ${ctr.toFixed(2)}%` : ''
      
      return {
        title: `${statusBadge} ${title}`,
        subtitle: `${type} • ${positionLabel}${ctrDisplay}`,
      }
    },
  },
  orderings: [
    {
      title: 'Priority (High to Low)',
      name: 'priorityDesc',
      by: [{field: 'priority', direction: 'desc'}],
    },
    {
      title: 'CTR (High to Low)',
      name: 'ctrDesc',
      by: [{field: 'ctr', direction: 'desc'}],
    },
  ],
})
