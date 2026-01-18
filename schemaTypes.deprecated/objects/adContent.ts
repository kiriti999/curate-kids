import {defineType, defineField} from 'sanity'

function validateHtmlContent(contentType: string, htmlCode: string) {
  if (contentType === 'html' && !htmlCode) {
    return 'HTML code is required for HTML content type'
  }
  return true
}

function validateImageContent(contentType: string, imageUrl: string) {
  if (contentType === 'image' && !imageUrl) {
    return 'Image URL is required for image content type'
  }
  return true
}

function validateAdContent(value: any) {
  if (!value?.contentType) return 'Content type is required'
  
  const htmlResult = validateHtmlContent(value.contentType, value.htmlCode)
  if (htmlResult !== true) return htmlResult
  
  return validateImageContent(value.contentType, value.imageUrl)
}

export default defineType({
  name: 'adContent',
  title: 'Ad Content',
  type: 'object',
  fields: [
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          {title: 'HTML/JavaScript Code', value: 'html'},
          {title: 'Image with Link', value: 'image'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'htmlCode',
      title: 'HTML/JS Code',
      type: 'text',
      rows: 5,
      description: 'Embed code from ad provider (e.g., Google AdSense, affiliate scripts)',
      hidden: ({parent}) => parent?.contentType !== 'html',
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      type: 'url',
      description: 'Direct URL to ad image',
      hidden: ({parent}) => parent?.contentType !== 'image',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      type: 'url',
      description: 'Destination URL when ad is clicked',
      hidden: ({parent}) => parent?.contentType !== 'image',
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'string',
      description: 'Alternative text for accessibility',
      hidden: ({parent}) => parent?.contentType !== 'image',
    }),
  ],
  validation: (Rule) => Rule.custom(validateAdContent),
})
