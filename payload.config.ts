/**
 * PayloadCMS Configuration
 * 
 * Main configuration file for PayloadCMS backend.
 * Defines database connection, admin UI, collections, and server settings.
 */

import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import collections
import { Video } from './payload-cms/collections/Video'
import { Category } from './payload-cms/collections/Category'
import { User } from './payload-cms/collections/User'
import { Organization } from './payload-cms/collections/Organization'
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

  // Email configuration for verification and password reset
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_EMAIL || 'noreply@curatekids.com',
    defaultFromName: process.env.SMTP_FROM_NAME || 'CurateKids',
    transportOptions: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),

  // Collections
  collections: [
    User,
    Organization,
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
