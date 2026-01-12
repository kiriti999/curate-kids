import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'logMetadata',
  title: 'Log Metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'videoId',
      title: 'Video ID',
      type: 'string',
      description: 'Reference to video document ID',
    }),
    defineField({
      name: 'categoryPath',
      title: 'Category Path',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Category hierarchy path at time of action',
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      description: 'Age range category (e.g., "5-7")',
    }),
    defineField({
      name: 'adPosition',
      title: 'Ad Position',
      type: 'string',
      description: 'Ad placement position (header, sidebar, inline, etc.)',
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'number',
      description: 'Duration in seconds (for video views)',
    }),
    defineField({
      name: 'clickDestination',
      title: 'Click Destination',
      type: 'url',
      description: 'Destination URL for ad clicks',
    }),
    defineField({
      name: 'previousValue',
      title: 'Previous Value',
      type: 'text',
      description: 'Value before update (for change tracking)',
    }),
    defineField({
      name: 'newValue',
      title: 'New Value',
      type: 'text',
      description: 'Value after update (for change tracking)',
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      description: 'Browser user agent string',
    }),
  ],
  description: 'Flexible metadata structure for activity logs',
})
