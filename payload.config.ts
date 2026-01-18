/**
 * PayloadCMS Configuration
 * 
 * Main configuration file for PayloadCMS backend.
 * Defines database connection, admin UI, collections, and server settings.
 */

import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import collections
import { Video } from './payload-cms/collections/Video'
import { Category } from './payload-cms/collections/Category'
import { User } from './payload-cms/collections/User'
import { ActivityLog } from './payload-cms/collections/ActivityLog'
import { AdPlacement } from './payload-cms/collections/AdPlacement'
import { AffiliatePartner } from './payload-cms/collections/AffiliatePartner'
import { Media } from './payload-cms/collections/Media'

export default buildConfig({
  // Secret key for JWT and encryption
  secret: process.env.PAYLOAD_SECRET || 'fallback-key-please-set-env-var',
  
  // Routes configuration
  routes: {
    admin: '/admin',
    api: '/api',
  },
  
  // Admin panel configuration
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- CurateKids CMS',
    },
  },
  
  // Rich text editor
  editor: lexicalEditor(),
  
  // Collections
  collections: [
    User,
    Video,
    Category,
    ActivityLog,
    AdPlacement,
    AffiliatePartner,
    Media,
  ],
  
  // TypeScript type generation
  typescript: {
    outputFile: path.resolve(__dirname, 'types/payload.ts'),
  },
  
  // Database configuration
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/curatekids',
  }),
  
  // CORS configuration for frontend access
  cors: [
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],
})
