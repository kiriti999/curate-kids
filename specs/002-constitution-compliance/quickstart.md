# Quickstart Guide: Constitution Compliance Refactoring

**Feature**: Constitution Compliance Refactoring  
**Date**: 2025-01-17  
**For**: Developers implementing the constitutional compliance updates

## Overview

This quickstart guide provides practical examples and patterns for implementing the constitutional compliance refactoring. Use this as a reference while working through the tasks in `tasks.md`.

---

## Quick Reference

### Import Paths

```typescript
// Logger
import { logger } from '@/utils/logger'

// Retry utility
import { withRetry } from '@/utils/retry'

// Environment configuration
import { env } from '@/config/env'

// Constants
import { SANITY_CONFIG, RETRY_CONFIG, YOUTUBE_URL_PATTERNS } from '@/config/constants'

// YouTube utilities
import { extractYoutubeId } from '@/utils/extractYoutubeId'

// Sanity client
import { createSanityClient } from '@/services/sanity/client'

// Types
import { VideoDocument, VideoQueryResult } from '@/types/sanity'
```

---

## Common Patterns

### 1. Replace console.log with logger

**Before**:
```typescript
console.log('Fetching videos...')
console.log(`Found ${videos.length} videos`)
```

**After**:
```typescript
import { logger } from '@/utils/logger'

logger.info('Fetching videos')
logger.info('Videos fetched', { count: videos.length })
```

**With errors**:
```typescript
// Before
try {
  // ...
} catch (error) {
  console.error('Failed to fetch:', error)
}

// After
import { logger } from '@/utils/logger'

try {
  // ...
} catch (error) {
  logger.error('Failed to fetch videos', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
}
```

---

### 2. Extract hardcoded values to constants

**Before**:
```typescript
const client = createClient({
  projectId: '3rcl6ir9',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
```

**After**:
```typescript
import { env } from '@/config/env'
import { SANITY_CONFIG } from '@/config/constants'

const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: SANITY_CONFIG.API_VERSION,
  useCdn: true,
})
```

---

### 3. Add retry logic to external API calls

**Before**:
```typescript
async function fetchYoutubeData(videoId: string) {
  const response = await fetch(`https://youtube.com/api/...`)
  return response.json()
}
```

**After**:
```typescript
import { withRetry } from '@/utils/retry'
import { RETRY_CONFIG } from '@/config/constants'
import { logger } from '@/utils/logger'

async function fetchYoutubeData(videoId: string) {
  const result = await withRetry(
    async () => {
      const response = await fetch(`https://youtube.com/api/...`)
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }
      return response.json()
    },
    {
      maxRetries: RETRY_CONFIG.MAX_RETRIES,
      baseDelayMs: RETRY_CONFIG.BASE_DELAY_MS,
    }
  )

  if (result === null) {
    logger.error('Failed to fetch YouTube data after retries', { videoId })
    return null
  }

  return result
}
```

---

### 4. Consolidate duplicate code

**Before** (duplicate in 3 places):
```typescript
// schemaTypes/utils/extractYoutubeId.ts
export function extractYoutubeId(url: string): string | null { /* ... */ }

// frontend/src/lib/sanity.ts
function extractYoutubeId(url: string): string | null { /* ... duplicate ... */ }
```

**After** (single source of truth):
```typescript
// utils/extractYoutubeId.ts
import { YOUTUBE_URL_PATTERNS } from '@/config/constants'

export function extractYoutubeId(url: string): string | null {
  if (!url) return null

  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

// All other files import from here
import { extractYoutubeId } from '@/utils/extractYoutubeId'
```

---

### 5. Add type safety (remove `any`)

**Before**:
```typescript
const videos = await client.fetch(`*[_type == "video"]`)
videos.forEach((video: any) => {
  console.log(video.title)
})
```

**After**:
```typescript
import { VideoQueryResult } from '@/types/sanity'
import { logger } from '@/utils/logger'

const videos = await client.fetch<VideoQueryResult[]>(
  `*[_type == "video"] { _id, title, youtubeId, category, ageRange }`
)

videos.forEach((video: VideoQueryResult) => {
  logger.info('Processing video', { title: video.title, id: video._id })
})
```

---

### 6. Add documentation headers

**Before**:
```typescript
// No header
export function processVideo(video: VideoDocument) {
  // ...
}
```

**After**:
```typescript
/**
 * Video processing utility
 * Handles video validation, transformation, and enrichment
 */

import { VideoDocument } from '@/types/sanity'
import { logger } from '@/utils/logger'

/**
 * Process and validate a video document
 * @param video - Video document from Sanity CMS
 * @returns Processed video with enriched metadata
 */
export function processVideo(video: VideoDocument): ProcessedVideo {
  logger.info('Processing video', { videoId: video._id })
  // ...
}
```

---

### 7. Reduce cyclomatic complexity

**Before** (complexity = 8):
```typescript
function validateCategory(category: string, parent?: string): boolean {
  if (!category) return false
  if (category.length < 3) return false
  if (category.length > 50) return false
  if (!/^[a-zA-Z0-9-]+$/.test(category)) return false
  if (parent) {
    if (parent === category) return false
    if (!isValidParent(parent)) return false
  }
  if (category === 'admin' || category === 'system') return false
  return true
}
```

**After** (complexity ≤ 5 per function):
```typescript
function validateCategory(category: string, parent?: string): boolean {
  if (!isValidCategoryString(category)) return false
  if (!isValidCategoryLength(category)) return false
  if (!isValidCategoryPattern(category)) return false
  if (parent && !isValidParentRelation(category, parent)) return false
  if (isReservedCategory(category)) return false
  return true
}

function isValidCategoryString(category: string): boolean {
  return !!category
}

function isValidCategoryLength(category: string): boolean {
  return category.length >= 3 && category.length <= 50
}

function isValidCategoryPattern(category: string): boolean {
  return /^[a-zA-Z0-9-]+$/.test(category)
}

function isValidParentRelation(category: string, parent: string): boolean {
  if (parent === category) return false
  return isValidParent(parent)
}

function isReservedCategory(category: string): boolean {
  const RESERVED = ['admin', 'system']
  return RESERVED.includes(category)
}
```

---

## Step-by-Step Implementation Flow

### Phase 1: Infrastructure Setup

1. **Create logger utility**:
   ```bash
   mkdir -p utils
   touch utils/logger.ts
   ```
   - Copy implementation from research.md
   - Test: `logger.info('test')` outputs JSON

2. **Create environment validation**:
   ```bash
   mkdir -p config
   touch config/env.ts
   ```
   - Copy implementation from research.md
   - Test: Start app without env vars → should throw error

3. **Create constants file**:
   ```bash
   touch config/constants.ts
   ```
   - Extract all hardcoded values
   - Use `as const` for type safety

### Phase 2: Utilities

4. **Create retry utility**:
   ```bash
   touch utils/retry.ts
   ```
   - Implement exponential backoff
   - Test with failing function

5. **Consolidate YouTube ID extractor**:
   ```bash
   touch utils/extractYoutubeId.ts
   ```
   - Copy from schemaTypes/utils
   - Update imports in all files

### Phase 3: Services

6. **Create Sanity client service**:
   ```bash
   mkdir -p services/sanity
   touch services/sanity/client.ts
   ```
   - Factory function using env config
   - Wrap mutations with retry logic

7. **Create type definitions**:
   ```bash
   mkdir -p types
   touch types/sanity.ts
   ```
   - Define all document interfaces
   - Export query result types

### Phase 4: Refactoring

8. **Replace console.log statements** (35 instances):
   - Search: `console.log`, `console.error`, `console.warn`
   - Replace with appropriate logger calls
   - Add context objects

9. **Replace hardcoded values**:
   - Search for project ID: `'3rcl6ir9'`
   - Search for dataset: `'production'`
   - Replace with `env.*` references

10. **Remove duplicate code**:
    - Update imports to use consolidated utilities
    - Delete duplicate implementations
    - Test all affected files

11. **Add type safety**:
    - Replace `any` types with proper interfaces
    - Add return type annotations
    - Test TypeScript compilation

12. **Reduce complexity**:
    - Run ESLint complexity rule
    - Refactor functions > complexity 5
    - Extract helper functions

### Phase 5: Documentation & Testing

13. **Add documentation headers**:
    - File headers describing purpose
    - JSDoc on complex functions
    - Update README with env vars

14. **Add ESLint rule**:
    ```javascript
    // eslint.config.mjs
    export default [
      {
        rules: {
          'complexity': ['error', { max: 5 }],
        }
      }
    ]
    ```

15. **Set up Vitest** (optional but recommended):
    ```bash
    pnpm add -D vitest @vitest/ui
    ```
    - Create `vitest.config.ts`
    - Write tests for utilities

---

## Testing Checklist

After implementation, verify:

- [ ] No `console.log` statements remain (search codebase)
- [ ] All env vars validated at startup
- [ ] App fails fast with clear error when env var missing
- [ ] All external API calls have retry logic
- [ ] No hardcoded project IDs or datasets
- [ ] No duplicate YouTube ID extraction code
- [ ] All files have header comments
- [ ] No `any` types without justification
- [ ] All functions have complexity ≤ 5 (run ESLint)
- [ ] TypeScript compiles without errors (`pnpm tsc`)
- [ ] All imports use new shared utilities
- [ ] README documents all env vars

---

## Common Issues & Solutions

### Issue: Import path not resolving

**Solution**: Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: Circular dependency (env → logger → env)

**Solution**: Logger should NOT import from config/env. It's a low-level utility.

### Issue: Sanity Studio not finding shared utilities

**Solution**: Update Sanity Studio's `tsconfig.json` separately to include paths.

### Issue: Frontend and backend both try to validate env

**Solution**: 
- Backend: Validate all env vars
- Frontend: Only validate public env vars (NEXT_PUBLIC_*)

### Issue: Tests fail due to missing env vars

**Solution**: Mock environment in test setup:
```typescript
// vitest.setup.ts
process.env.SANITY_PROJECT_ID = 'test-project'
process.env.SANITY_DATASET = 'test'
// ... etc
```

### Issue: Retry logic makes tests slow

**Solution**: Use shorter delays in tests:
```typescript
await withRetry(operation, { maxRetries: 2, baseDelayMs: 10 })
```

---

## Example: Complete File Refactoring

**Before** (`scripts/extract-youtube-ids.ts`):
```typescript
import { createClient } from '@sanity/client'
import { extractYoutubeId } from '../schemaTypes/utils/extractYoutubeId'

const client = createClient({
    projectId: '3rcl6ir9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

async function updateYoutubeIds() {
    console.log('🔍 Fetching all video documents...')
    const videos = await client.fetch(`*[_type == "video"]`)
    console.log(`📊 Found ${videos.length} video documents`)
    // ...
}
```

**After**:
```typescript
/**
 * Migration script: Extract and populate YouTube IDs from URLs
 * Processes all video documents missing youtubeId field
 */

import { createSanityClient } from '@/services/sanity/client'
import { extractYoutubeId } from '@/utils/extractYoutubeId'
import { logger } from '@/utils/logger'
import { env } from '@/config/env'
import { SANITY_CONFIG } from '@/config/constants'
import { VideoDocument } from '@/types/sanity'

const client = createSanityClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: SANITY_CONFIG.API_VERSION,
  token: env.SANITY_TOKEN,
  useCdn: false,
})

async function updateYoutubeIds(): Promise<void> {
  logger.info('Fetching video documents')
  
  const videos = await client.fetch<VideoDocument[]>(`*[_type == "video"]`)
  
  logger.info('Videos fetched', { count: videos.length })
  
  // ... rest of implementation
}

updateYoutubeIds()
  .then(() => {
    logger.info('Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('Migration failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })
```

---

## Performance Considerations

1. **Logger Performance**: JSON.stringify is fast, but avoid logging large objects in hot paths
2. **Retry Logic**: Exponential backoff can make requests take up to ~14 seconds (2s + 4s + 8s)
3. **Environment Validation**: Happens once at startup, zero runtime cost
4. **Type Safety**: Zero runtime cost, all checks happen at compile time

---

## Migration Path

You can implement this refactoring incrementally:

1. **Week 1**: Infrastructure (logger, env, constants, retry, types)
2. **Week 2**: Replace console.log and hardcoded values
3. **Week 3**: Consolidate duplicate code, add type safety
4. **Week 4**: Reduce complexity, add documentation, testing

Each week's changes can be deployed independently without breaking the application.

---

## Next Steps

1. Review the [spec.md](./spec.md) for full requirements
2. Review the [plan.md](./plan.md) for technical context
3. Review the [research.md](./research.md) for implementation decisions
4. Review the [data-model.md](./data-model.md) for type definitions
5. Review the [contracts/](./contracts/) for API contracts
6. Start implementing following the step-by-step flow above
7. When ready, generate tasks with `/speckit.tasks` command

---

**Status**: Ready for implementation. Use this guide as reference during development.
