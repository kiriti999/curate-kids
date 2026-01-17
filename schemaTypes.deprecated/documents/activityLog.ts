import {defineField, defineType} from 'sanity'
import {ActivityIcon} from '@sanity/icons'

export default defineType({
  name: 'activityLog',
  title: 'Activity Log',
  type: 'document',
  icon: ActivityIcon,
  readOnly: true, // Logs should not be manually created/edited
  fields: [
    defineField({
      name: 'actionType',
      title: 'Action Type',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .regex(/^[a-z]+\.[a-z_]+$/, {
            name: 'action-pattern',
            invert: false,
          })
          .error('Action type must follow pattern: resource.action (e.g., video.view, ad.click)'),
      description: 'Action type in format: resource.action',
    }),
    defineField({
      name: 'userId',
      title: 'User',
      type: 'reference',
      to: [{type: 'user'}],
      weak: true,
      description: 'User who performed the action (null for anonymous)',
    }),
    defineField({
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
      description: 'Client session identifier (UUID)',
    }),
    defineField({
      name: 'ipAddress',
      title: 'IP Address',
      type: 'string',
      description: 'Anonymized IP address (last octet removed)',
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      description: 'Client user agent string',
    }),
    defineField({
      name: 'resourceType',
      title: 'Resource Type',
      type: 'string',
      options: {
        list: [
          {title: 'Video', value: 'video'},
          {title: 'Category', value: 'category'},
          {title: 'Ad Placement', value: 'ad'},
          {title: 'User', value: 'user'},
          {title: 'System', value: 'system'},
        ],
      },
      description: 'Type of resource affected',
    }),
    defineField({
      name: 'resourceId',
      title: 'Resource ID',
      type: 'string',
      description: 'Document _id of affected resource',
    }),
    defineField({
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        // Video view metadata
        {name: 'videoId', type: 'string', title: 'Video ID'},
        {name: 'categoryPath', type: 'array', of: [{type: 'string'}], title: 'Category Path'},
        {name: 'ageRange', type: 'string', title: 'Age Range'},
        {name: 'duration', type: 'number', title: 'Duration (seconds)'},
        {name: 'watchedToEnd', type: 'boolean', title: 'Watched to End'},
        
        // Ad interaction metadata
        {name: 'adId', type: 'string', title: 'Ad ID'},
        {name: 'adPosition', type: 'string', title: 'Ad Position'},
        {name: 'clickDestination', type: 'url', title: 'Click Destination'},
        {name: 'visibleDuration', type: 'number', title: 'Visible Duration (ms)'},
        
        // CRUD operation metadata
        {name: 'previousValue', type: 'text', title: 'Previous Value'},
        {name: 'newValue', type: 'text', title: 'New Value'},
        
        // Category navigation metadata
        {name: 'fromCategory', type: 'string', title: 'From Category'},
        {name: 'toCategory', type: 'string', title: 'To Category'},
        {name: 'navigationPath', type: 'array', of: [{type: 'string'}], title: 'Navigation Path'},
        
        // User authentication metadata
        {name: 'loginMethod', type: 'string', title: 'Login Method'},
        {name: 'failureReason', type: 'string', title: 'Failure Reason'},
      ],
      description: 'Flexible metadata object for context-specific information',
    }),
  ],
  preview: {
    select: {
      actionType: 'actionType',
      resourceType: 'resourceType',
      resourceId: 'resourceId',
      timestamp: '_createdAt',
    },
    prepare({actionType, resourceType, resourceId, timestamp}) {
      const date = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown'
      const resource = resourceType ? `${resourceType}` : 'Unknown'
      
      return {
        title: actionType || 'Unknown Action',
        subtitle: `${resource} • ${date}`,
      }
    },
  },
  orderings: [
    {
      title: 'Recent First',
      name: 'recentFirst',
      by: [{field: '_createdAt', direction: 'desc'}],
    },
    {
      title: 'Action Type',
      name: 'actionType',
      by: [{field: 'actionType', direction: 'asc'}],
    },
  ],
})
