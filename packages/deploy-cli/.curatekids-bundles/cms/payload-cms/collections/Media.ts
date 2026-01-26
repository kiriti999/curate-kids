/**
 * Media Collection Schema
 * 
 * File uploads collection for images, icons, and other media assets.
 * Used by Category collection for icons and other content.
 */

import { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 150,
        height: 150,
        position: 'centre',
      },
      {
        name: 'card',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 800,
        height: undefined,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  
  admin: {
    useAsTitle: 'filename',
    description: 'Image and media file uploads',
  },
  
  // Access control
  access: {
    read: () => true, // Public read access
    create: ({ req }) => !!req.user, // Authenticated users only
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alt text for accessibility',
      },
    },
  ],
}
