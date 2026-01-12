import {defineType, defineField} from 'sanity'
import {youtubeUrlRule} from '../validation/youtubeUrl'

export default defineType({
  name: 'youtubeEmbed',
  title: 'YouTube Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube URL',
      type: 'url',
      validation: (Rule) => Rule.required().custom(youtubeUrlRule),
      description: 'Full YouTube video URL (e.g., https://www.youtube.com/watch?v=...)',
    }),
    defineField({
      name: 'videoId',
      title: 'Video ID',
      type: 'string',
      readOnly: true,
      description: 'Extracted YouTube video ID (auto-populated)',
    }),
  ],
})
