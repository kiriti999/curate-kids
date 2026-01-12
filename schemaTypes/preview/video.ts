import { defineType } from 'sanity'

export const videoPreview = defineType({
  name: 'videoPreview',
  title: 'Video Preview',
  type: 'object',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'thumbnail',
      type: 'url',
    },
    {
      name: 'categoryPath',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'category',
      type: 'string',
    },
  ],
  preview: {
    select: {
      title: 'title',
      thumbnail: 'thumbnail',
      categoryPath: 'categoryPath',
      category: 'category',
    },
    prepare({ title, thumbnail, categoryPath, category }) {
      const breadcrumb = categoryPath ? categoryPath.join(' › ') : category || 'No category'
      return {
        title: title || 'Untitled Video',
        subtitle: breadcrumb,
        media: thumbnail ? undefined : undefined, // Thumbnail URL not directly usable as media
      }
    },
  },
})
