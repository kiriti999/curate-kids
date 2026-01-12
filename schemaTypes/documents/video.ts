import { defineField, defineType } from 'sanity'
import { PlayIcon } from '@sanity/icons'
import { YoutubeIdInput } from '../components/YoutubeIdInput'

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(200).error('Title is required and must be under 200 characters'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Slug is required'),
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      description: 'Full YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)',
      validation: (Rule) =>
        Rule.required()
          .custom((url: string | undefined) => {
            if (!url) return true
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
            return youtubeRegex.test(url) || 'Please enter a valid YouTube URL'
          }),
    }),
    defineField({
      name: 'youtubeId',
      title: 'YouTube ID',
      type: 'string',
      description: 'Auto-extracted from YouTube URL (11 characters)',
      components: {
        input: YoutubeIdInput,
      },
    }),

    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'number',
      description: 'Duration in seconds (extracted from YouTube)',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Education', value: 'education' },
          { title: 'Entertainment', value: 'entertainment' },
          { title: 'Music', value: 'music' },
          { title: 'Science', value: 'science' },
          { title: 'Arts & Crafts', value: 'arts-crafts' },
          { title: 'Sports', value: 'sports' },
          { title: 'Nature', value: 'nature' },
          { title: 'Stories', value: 'stories' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      options: {
        list: [
          { title: '0-2 years', value: '0-2' },
          { title: '3-5 years', value: '3-5' },
          { title: '6-8 years', value: '6-8' },
          { title: '9-12 years', value: '9-12' },
          { title: '13+ years', value: '13+' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      validation: (Rule) => Rule.max(20).error('Maximum 20 tags allowed'),
    }),
    defineField({
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 3,
      description: 'Internal notes (not displayed publicly)',
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      readOnly: true,
      description: 'Aggregated from activity logs',
    }),
    defineField({
      name: 'lastViewedAt',
      title: 'Last Viewed At',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      ageRange: 'ageRange',
    },
    prepare({ title, category, ageRange }) {
      return {
        title,
        subtitle: `${category || 'No category'} • ${ageRange || 'No age range'}`,
      }
    },
  },
})
