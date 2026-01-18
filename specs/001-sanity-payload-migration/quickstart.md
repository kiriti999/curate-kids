# QuickStart Guide: PayloadCMS Migration

**Feature**: Sanity CMS to PayloadCMS Migration  
**Target Audience**: Developers implementing this migration  
**Estimated Setup Time**: 2-3 hours  
**Prerequisites**: Node.js 18+, MongoDB Atlas account, Git

---

## Overview

This guide walks you through setting up PayloadCMS for the CurateKids application, running the data migration from Sanity CMS, and integrating with the Next.js frontend.

**Migration Steps**:
1. Setup PayloadCMS backend (30 min)
2. Run data migration scripts (1 hour)
3. Update frontend integration (1 hour)
4. Verify and test (30 min)

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] MongoDB Atlas cluster created (M10 tier or higher recommended)
- [ ] MongoDB connection string ready
- [ ] Sanity CMS credentials (project ID, dataset, token) for export
- [ ] Git repository cloned locally
- [ ] Environment variables template (.env.example) copied to .env

---

## Step 1: Setup PayloadCMS Backend

### 1.1 Install PayloadCMS Dependencies

```bash
# From repository root
npm install payload@latest @payloadcms/db-mongodb@latest @payloadcms/richtext-slate@latest express@latest

# Install development dependencies
npm install --save-dev @types/express ts-node-dev
```

**Expected Output**: PayloadCMS 3.x and dependencies installed in `node_modules/`

### 1.2 Create PayloadCMS Configuration

Create `payload.config.ts` in repository root:

```typescript
import { buildConfig } from 'payload/config'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'

// Import collections (created in next step)
import { Video } from './payload/collections/Video'
import { Category } from './payload/collections/Category'
import { User } from './payload/collections/User'
import { ActivityLog } from './payload/collections/ActivityLog'
import { AdPlacement } from './payload/collections/AdPlacement'
import { AffiliatePartner } from './payload/collections/AffiliatePartner'

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'users', // Collection used for admin authentication
    meta: {
      titleSuffix: '- CurateKids CMS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },
  collections: [
    Video,
    Category,
    User,
    ActivityLog,
    AdPlacement,
    AffiliatePartner,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'types/payload.ts'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/curatekids',
  }),
  editor: slateEditor({}),
  cors: [
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001',
  ],
  csrf: [
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001',
  ],
})
```

**What this does**: Configures PayloadCMS with MongoDB connection, admin UI, and all six collections.

### 1.3 Create Collection Definitions

Create directory structure:

```bash
mkdir -p payload/collections payload/hooks
```

Create `payload/collections/Video.ts` (example - see data-model.md for full implementation):

```typescript
import { CollectionConfig } from 'payload/types'

export const Video: CollectionConfig = {
  slug: 'videos',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'ageRange', 'viewCount'],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => !!req.user, // Authenticated users only
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 200,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'youtubeUrl',
      type: 'text',
      required: true,
      validate: (value) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
        return youtubeRegex.test(value) || 'Please enter a valid YouTube URL'
      },
    },
    {
      name: 'youtubeId',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        // Load from config/constants.ts
      ],
    },
    {
      name: 'ageRange',
      type: 'select',
      required: true,
      options: [
        // Load from config/constants.ts
      ],
    },
    {
      name: 'tags',
      type: 'array',
      maxRows: 20,
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastViewedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Extract YouTube ID from URL
        if (data.youtubeUrl) {
          const match = data.youtubeUrl.match(/([a-zA-Z0-9_-]{11})/)
          if (match) {
            data.youtubeId = match[1]
          }
        }
        return data
      },
    ],
  },
}
```

**Repeat for all 6 collections** - See `data-model.md` for complete field definitions.

### 1.4 Create Server Entry Point

Create `server.ts` in repository root:

```typescript
import express from 'express'
import payload from 'payload'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Initialize Payload
const start = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'your-secret-key-change-in-production',
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  // Add custom Express routes (if needed)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.listen(PORT, () => {
    payload.logger.info(`Server started on http://localhost:${PORT}`)
  })
}

start()
```

### 1.5 Configure Environment Variables

Create `.env` file in repository root:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/curatekids?retryWrites=true&w=majority

# PayloadCMS
PAYLOAD_SECRET=your-secret-key-change-in-production-minimum-32-chars
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Frontend (for CORS)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001

# Sanity (for migration only)
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=production
SANITY_TOKEN=your-sanity-token-with-read-access
```

**Security Note**: Never commit `.env` to Git. Add to `.gitignore`.

### 1.6 Start PayloadCMS Server

```bash
# Development mode with auto-reload
npm run dev:payload

# Or add this script to package.json:
# "dev:payload": "ts-node-dev --respawn --transpile-only server.ts"
```

**Verify**: 
1. Open `http://localhost:3000/admin`
2. Create your first admin user account
3. Verify all 6 collections appear in the admin UI

---

## Step 2: Run Data Migration

### 2.1 Create Migration Scripts Directory

```bash
mkdir -p migration/exported-data
```

### 2.2 Export Data from Sanity

Create `migration/export-from-sanity.ts`:

```typescript
import { createClient } from '@sanity/client'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  token: process.env.SANITY_TOKEN!,
  apiVersion: '2023-01-01',
  useCdn: false,
})

const COLLECTIONS = ['video', 'category', 'user', 'activityLog', 'adPlacement', 'affiliatePartner']

async function exportCollection(collectionType: string) {
  console.log(`Exporting ${collectionType}...`)
  
  const query = `*[_type == $type]`
  const docs = await client.fetch(query, { type: collectionType })
  
  const outputPath = path.join(__dirname, 'exported-data', `${collectionType}.json`)
  await fs.writeFile(outputPath, JSON.stringify(docs, null, 2))
  
  console.log(`✅ Exported ${docs.length} ${collectionType} documents`)
  return docs.length
}

async function main() {
  console.log('🚀 Starting Sanity data export...')
  
  const counts: Record<string, number> = {}
  
  for (const collection of COLLECTIONS) {
    counts[collection] = await exportCollection(collection)
  }
  
  console.log('\n📊 Export Summary:')
  console.log(JSON.stringify(counts, null, 2))
  console.log('\n✅ Export complete!')
}

main().catch(console.error)
```

**Run export**:

```bash
npx ts-node migration/export-from-sanity.ts
```

**Expected Output**: JSON files in `migration/exported-data/` directory

### 2.3 Transform Data

Create `migration/transform-data.ts`:

```typescript
import fs from 'fs/promises'
import path from 'path'

interface SanityDocument {
  _id: string
  _type: string
  _rev: string
  _createdAt: string
  _updatedAt: string
  [key: string]: any
}

interface PayloadDocument {
  id?: string
  sanityId: string
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

async function transformCollection(collectionType: string): Promise<PayloadDocument[]> {
  console.log(`Transforming ${collectionType}...`)
  
  const inputPath = path.join(__dirname, 'exported-data', `${collectionType}.json`)
  const data = JSON.parse(await fs.readFile(inputPath, 'utf-8')) as SanityDocument[]
  
  const transformed = data.map((doc) => {
    const payload: PayloadDocument = {
      sanityId: doc._id, // Preserve original Sanity ID
      createdAt: doc._createdAt,
      updatedAt: doc._updatedAt,
    }
    
    // Transform fields based on collection type
    Object.keys(doc).forEach((key) => {
      if (key.startsWith('_')) return // Skip Sanity internal fields
      
      if (key === 'slug' && typeof doc[key] === 'object') {
        // Transform Sanity slug object to string
        payload.slug = doc[key].current
      } else if (key.includes('._ref')) {
        // Transform Sanity references (will be mapped to PayloadCMS IDs later)
        const refKey = key.replace('._ref', '')
        payload[refKey] = doc[key]._ref
      } else {
        // Direct copy
        payload[key] = doc[key]
      }
    })
    
    return payload
  })
  
  const outputPath = path.join(__dirname, 'exported-data', `${collectionType}-transformed.json`)
  await fs.writeFile(outputPath, JSON.stringify(transformed, null, 2))
  
  console.log(`✅ Transformed ${transformed.length} ${collectionType} documents`)
  return transformed
}

async function main() {
  console.log('🔄 Starting data transformation...')
  
  const collections = ['user', 'category', 'video', 'activityLog', 'adPlacement', 'affiliatePartner']
  
  for (const collection of collections) {
    await transformCollection(collection)
  }
  
  console.log('\n✅ Transformation complete!')
}

main().catch(console.error)
```

**Run transformation**:

```bash
npx ts-node migration/transform-data.ts
```

### 2.4 Import Data to PayloadCMS

Create `migration/import-to-payloadcms.ts`:

```typescript
import payload from 'payload'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

// ID mapping: Sanity ID -> PayloadCMS ID
const idMap: Record<string, string> = {}

async function importCollection(collectionSlug: string, data: any[]) {
  console.log(`Importing ${data.length} ${collectionSlug}...`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const doc of data) {
    try {
      // Map Sanity reference IDs to PayloadCMS IDs
      if (doc.parent && idMap[doc.parent]) {
        doc.parent = idMap[doc.parent]
      }
      
      const created = await payload.create({
        collection: collectionSlug,
        data: doc,
      })
      
      // Store ID mapping
      idMap[doc.sanityId] = created.id
      successCount++
    } catch (error) {
      console.error(`❌ Failed to import ${doc.sanityId}:`, error)
      errorCount++
    }
  }
  
  console.log(`✅ Imported ${successCount} ${collectionSlug} (${errorCount} errors)`)
  return { successCount, errorCount }
}

async function main() {
  console.log('📥 Starting PayloadCMS import...')
  
  await payload.init({
    secret: process.env.PAYLOAD_SECRET!,
    local: true, // Run without Express server
  })
  
  // Import in dependency order
  const importOrder = [
    { slug: 'users', file: 'user-transformed.json' },
    { slug: 'categories', file: 'category-transformed.json' },
    { slug: 'videos', file: 'video-transformed.json' },
    { slug: 'activity-logs', file: 'activityLog-transformed.json' },
    { slug: 'affiliate-partners', file: 'affiliatePartner-transformed.json' },
    { slug: 'ad-placements', file: 'adPlacement-transformed.json' },
  ]
  
  const results: Record<string, any> = {}
  
  for (const { slug, file } of importOrder) {
    const dataPath = path.join(__dirname, 'exported-data', file)
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))
    results[slug] = await importCollection(slug, data)
  }
  
  console.log('\n📊 Import Summary:')
  console.log(JSON.stringify(results, null, 2))
  console.log('\n✅ Import complete!')
}

main().catch(console.error)
```

**Run import**:

```bash
npx ts-node migration/import-to-payloadcms.ts
```

**Expected Output**: All documents imported to MongoDB via PayloadCMS

### 2.5 Verify Migration

Create `migration/verify-migration.ts`:

```typescript
import payload from 'payload'
import dotenv from 'dotenv'

dotenv.config()

async function verifyCollection(collectionSlug: string, expectedCount: number) {
  const result = await payload.find({
    collection: collectionSlug,
    limit: 0, // Only count
  })
  
  const status = result.totalDocs === expectedCount ? '✅' : '❌'
  console.log(`${status} ${collectionSlug}: ${result.totalDocs} / ${expectedCount} expected`)
  
  return result.totalDocs === expectedCount
}

async function main() {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET!,
    local: true,
  })
  
  console.log('🔍 Verifying migration...')
  
  // Replace with actual counts from Sanity export
  const expectedCounts = {
    videos: 1234,
    categories: 56,
    users: 10,
    'activity-logs': 10000,
    'ad-placements': 20,
    'affiliate-partners': 5,
  }
  
  let allPassed = true
  
  for (const [slug, count] of Object.entries(expectedCounts)) {
    const passed = await verifyCollection(slug, count)
    if (!passed) allPassed = false
  }
  
  console.log(allPassed ? '\n✅ Verification PASSED' : '\n❌ Verification FAILED')
}

main().catch(console.error)
```

**Run verification**:

```bash
npx ts-node migration/verify-migration.ts
```

---

## Step 3: Update Frontend Integration

### 3.1 Create PayloadCMS API Client

Create `frontend/src/lib/payloadcms.ts`:

```typescript
import { logger } from '../../../utils/logger'

const PAYLOAD_API_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000/api'

export interface VideoQueryResult {
  id: string
  title: string
  slug: string
  youtubeId: string
  youtubeUrl: string
  category: string
  ageRange: string
  tags: string[]
  viewCount: number
  createdAt: string
}

export async function getPublishedVideos(): Promise<VideoQueryResult[]> {
  try {
    const response = await fetch(`${PAYLOAD_API_URL}/videos?limit=100&sort=-createdAt`, {
      next: { revalidate: 300 }, // Cache 5 minutes
    })
    
    if (!response.ok) {
      throw new Error(`PayloadCMS API error: ${response.status}`)
    }
    
    const data = await response.json()
    logger.debug('Videos fetched', { count: data.docs.length })
    
    return data.docs
  } catch (error) {
    logger.error('Failed to fetch videos', { error })
    return []
  }
}

export async function getVideoBySlug(slug: string): Promise<VideoQueryResult | null> {
  try {
    const response = await fetch(`${PAYLOAD_API_URL}/videos?where[slug][equals]=${slug}`, {
      next: { revalidate: 300 },
    })
    
    const data = await response.json()
    return data.docs[0] || null
  } catch (error) {
    logger.error('Failed to fetch video by slug', { slug, error })
    return null
  }
}

// Add more API functions as needed...
```

### 3.2 Update Frontend Environment Variables

Add to `frontend/.env.local`:

```bash
NEXT_PUBLIC_PAYLOAD_API_URL=http://localhost:3000/api
```

### 3.3 Replace Sanity Client Imports

Search and replace across frontend:

```bash
# Find all Sanity client imports
grep -r "@sanity/client" frontend/src

# Replace with PayloadCMS client
# Example: 
# OLD: import { client } from './lib/sanity'
# NEW: import { getPublishedVideos } from './lib/payloadcms'
```

### 3.4 Update Next.js Pages

Example update for video list page:

```typescript
// frontend/src/app/videos/page.tsx

import { getPublishedVideos } from '@/lib/payloadcms'

export default async function VideosPage() {
  const videos = await getPublishedVideos()
  
  return (
    <div>
      <h1>Videos</h1>
      {videos.map((video) => (
        <div key={video.id}>
          <h2>{video.title}</h2>
          <p>Category: {video.category}</p>
          <p>Age Range: {video.ageRange}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Step 4: Verify and Test

### 4.1 Test Checklist

- [ ] PayloadCMS admin UI loads at `http://localhost:3000/admin`
- [ ] All 6 collections visible in admin UI
- [ ] Create test video through admin UI - validates correctly
- [ ] Create test category with parent - hierarchy calculates correctly
- [ ] Frontend loads video list from PayloadCMS API
- [ ] Frontend video detail page loads correctly
- [ ] Category navigation works with new API
- [ ] Activity logging creates entries in PayloadCMS
- [ ] Admin scripts work with PayloadCMS API

### 4.2 Compare Results

Run side-by-side comparison:

```bash
# Sanity query
curl "https://<project-id>.api.sanity.io/v1/data/query/production?query=*[_type=='video']"

# PayloadCMS query
curl "http://localhost:3000/api/videos"

# Compare counts and sample records
```

### 4.3 Performance Testing

Test query performance:

```bash
# Measure video list load time
time curl "http://localhost:3000/api/videos?limit=100"

# Measure category tree load time
time curl "http://localhost:3000/api/categories?where[isAgeRangeRoot][equals]=true"

# Target: <300ms for video lists, <200ms for category trees
```

---

## Troubleshooting

### Issue: MongoDB Connection Fails

**Error**: `MongooseError: Could not connect to MongoDB`

**Solution**:
1. Verify MongoDB Atlas cluster is running
2. Check connection string in `.env` (correct username, password, cluster name)
3. Whitelist your IP address in MongoDB Atlas Network Access
4. Test connection: `mongosh "<connection-string>"`

### Issue: PayloadCMS Admin UI Shows Empty Collections

**Error**: Collections appear but show 0 documents

**Solution**:
1. Verify import script completed successfully
2. Check MongoDB database directly: `mongosh` → `use curatekids` → `db.videos.count()`
3. Verify collection slugs match between payload.config.ts and import script

### Issue: Frontend API Calls Return 404

**Error**: `PayloadCMS API error: 404`

**Solution**:
1. Ensure PayloadCMS server is running (`npm run dev:payload`)
2. Verify `NEXT_PUBLIC_PAYLOAD_API_URL` in frontend `.env.local`
3. Check CORS configuration in `payload.config.ts`
4. Test API directly: `curl http://localhost:3000/api/videos`

### Issue: Migration Script Fails on References

**Error**: `Validation failed: parent must be a valid ID`

**Solution**:
1. Ensure collections are imported in dependency order (users → categories → videos)
2. Verify `idMap` correctly maps Sanity IDs to PayloadCMS IDs
3. Run migration in stages (import users first, then verify, then categories, etc.)

---

## Next Steps

1. ✅ PayloadCMS setup complete
2. ✅ Data migration complete
3. ✅ Frontend integration complete
4. ⏭️ Run full test suite (if available)
5. ⏭️ Update admin scripts to use PayloadCMS API
6. ⏭️ Deploy to staging environment for testing
7. ⏭️ Plan production migration (maintenance window, rollback plan)
8. ⏭️ Remove Sanity dependencies after validation period

---

## Support & Resources

- **PayloadCMS Docs**: https://payloadcms.com/docs
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **Project Constitution**: `.specify/memory/constitution.md`
- **Data Model Reference**: `specs/001-sanity-payload-migration/data-model.md`
- **API Contracts**: `specs/001-sanity-payload-migration/contracts/`

---

**QuickStart Version**: 1.0  
**Last Updated**: 2025-01-19  
**Estimated Completion Time**: 2-3 hours
