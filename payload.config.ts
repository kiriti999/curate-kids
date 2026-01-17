/**
 * PayloadCMS Configuration
 * 
 * Main configuration file for PayloadCMS backend.
 * Defines database connection, admin UI, collections, and server settings.
 */

import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

// Import collections
import { Video } from './payload/collections/Video'
import { Category } from './payload/collections/Category'
import { User } from './payload/collections/User'
import { ActivityLog } from './payload/collections/ActivityLog'
import { AdPlacement } from './payload/collections/AdPlacement'
import { AffiliatePartner } from './payload/collections/AffiliatePartner'
import { Media } from './payload/collections/Media'

export default buildConfig({
  // Secret key for JWT and encryption
  secret: process.env.PAYLOAD_SECRET || 'fallback-key-please-set-env-var',
  
  // Server URL for admin panel and API
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  
  // Admin panel configuration
  admin: {
    // Collection used for admin authentication
    user: 'users',
    
    meta: {
      titleSuffix: '- CurateKids CMS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },
  
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
    // Connection options
    connectOptions: {
      // Add retry logic for connection failures
      retryWrites: true,
      w: 'majority',
    },
  }),
  
  // Rich text editor configuration
  editor: slateEditor({}),
  
  // CORS configuration for frontend access
  cors: [
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],
  
  // CSRF protection
  csrf: [
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],
  
  // Rate limiting (optional, can be configured later)
  // rateLimit: {
  //   max: 500,
  //   window: 15 * 60 * 1000, // 15 minutes
  // },
})
