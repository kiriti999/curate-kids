# API Contracts: Constitution Compliance Refactoring

**Feature**: Constitution Compliance Refactoring  
**Date**: 2025-01-17  
**Version**: 1.0.0

## Overview

This document defines the public API contracts for the infrastructure utilities and services created during the constitution compliance refactoring. These are **internal APIs** (TypeScript modules) rather than HTTP APIs, as this feature focuses on code infrastructure.

---

## Module Contracts

### 1. Logger Utility (`utils/logger.ts`)

**Purpose**: Centralized structured logging

#### Exports

##### `logger.info(message, context?)`
```typescript
function info(message: string, context?: LogContext): void
```

**Parameters**:
- `message` (string, required): Human-readable log message
- `context` (LogContext, optional): Additional structured data

**Returns**: `void`

**Side Effects**: Writes JSON to stdout via `console.log`

**Example**:
```typescript
import { logger } from '@/utils/logger'

logger.info('User logged in', { userId: '123', email: 'user@example.com' })
// Output: {"timestamp":"2025-01-17T10:30:00.000Z","level":"info","message":"User logged in","userId":"123","email":"user@example.com"}
```

##### `logger.warn(message, context?)`
```typescript
function warn(message: string, context?: LogContext): void
```

**Parameters**: Same as `info`

**Returns**: `void`

**Side Effects**: Writes JSON to stdout via `console.warn`

##### `logger.error(message, context?)`
```typescript
function error(message: string, context?: LogContext): void
```

**Parameters**: Same as `info`

**Returns**: `void`

**Side Effects**: Writes JSON to stderr via `console.error`

**Example**:
```typescript
import { logger } from '@/utils/logger'

try {
  // risky operation
} catch (error) {
  logger.error('Operation failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    operationId: 'op-123',
  })
}
```

##### `logger.debug(message, context?)`
```typescript
function debug(message: string, context?: LogContext): void
```

**Parameters**: Same as `info`

**Returns**: `void`

**Side Effects**: Writes JSON to stdout via `console.log`

**Note**: Debug logs may be conditionally disabled in production based on environment.

#### Types

```typescript
interface LogContext {
  [key: string]: any
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug'
```

---

### 2. Retry Utility (`utils/retry.ts`)

**Purpose**: Wrap async operations with exponential backoff retry logic

#### Exports

##### `withRetry<T>(operation, options?)`
```typescript
function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T | null>
```

**Parameters**:
- `operation` (function, required): Async function to execute with retry logic
- `options` (RetryOptions, optional): Retry configuration

**Returns**: `Promise<T | null>`
- Returns result of type `T` on success
- Returns `null` if all retries exhausted

**Behavior**:
1. Executes `operation()`
2. On success: returns result
3. On error: 
   - Checks `shouldRetry(error)` (if provided)
   - Waits `baseDelayMs * 2^(attempt-1)` milliseconds
   - Retries up to `maxRetries` times
4. On max retries: logs error and returns `null`

**Example**:
```typescript
import { withRetry } from '@/utils/retry'

const result = await withRetry(
  async () => {
    const response = await fetch('https://api.example.com/data')
    if (!response.ok) throw new Error('API error')
    return response.json()
  },
  {
    maxRetries: 3,
    baseDelayMs: 1000,
    shouldRetry: (error) => {
      // Don't retry on 4xx errors
      return !error.message.includes('400')
    }
  }
)

if (result === null) {
  // Handle failure after all retries
}
```

#### Types

```typescript
interface RetryOptions {
  maxRetries?: number              // Default: 3
  baseDelayMs?: number             // Default: 2000
  shouldRetry?: (error: Error) => boolean  // Default: always retry
}
```

**Defaults**:
```typescript
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelayMs: 2000,
  shouldRetry: () => true,
}
```

---

### 3. Environment Configuration (`config/env.ts`)

**Purpose**: Validate and export type-safe environment variables

#### Exports

##### `env` (constant)
```typescript
const env: EnvConfig
```

**Type**:
```typescript
interface EnvConfig {
  SANITY_PROJECT_ID: string
  SANITY_DATASET: string
  SANITY_TOKEN: string
  NEXT_PUBLIC_SANITY_PROJECT_ID: string
  NEXT_PUBLIC_SANITY_DATASET: string
}
```

**Behavior**:
- Validates all required environment variables on module load
- Throws error with descriptive message if any required variable is missing
- Exports validated configuration object

**Error Behavior**:
```typescript
// If SANITY_TOKEN is missing:
throw new Error(
  'Missing required environment variables: SANITY_TOKEN\n' +
  'Please check your .env file and ensure all required variables are set.'
)
```

**Example**:
```typescript
import { env } from '@/config/env'

const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  token: env.SANITY_TOKEN,
})
```

---

### 4. Constants Configuration (`config/constants.ts`)

**Purpose**: Centralized constants to eliminate magic strings

#### Exports

##### `SANITY_CONFIG`
```typescript
const SANITY_CONFIG: {
  readonly API_VERSION: '2024-01-01'
  readonly CACHE_REVALIDATE_SECONDS: 300
}
```

##### `RETRY_CONFIG`
```typescript
const RETRY_CONFIG: {
  readonly MAX_RETRIES: 3
  readonly BASE_DELAY_MS: 2000
}
```

##### `YOUTUBE_URL_PATTERNS`
```typescript
const YOUTUBE_URL_PATTERNS: readonly RegExp[]
```

**Value**:
```typescript
[
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /^([a-zA-Z0-9_-]{11})$/,
]
```

**Example**:
```typescript
import { SANITY_CONFIG, RETRY_CONFIG } from '@/config/constants'

const client = createClient({
  apiVersion: SANITY_CONFIG.API_VERSION,
  // ...
})

await withRetry(operation, {
  maxRetries: RETRY_CONFIG.MAX_RETRIES,
  baseDelayMs: RETRY_CONFIG.BASE_DELAY_MS,
})
```

---

### 5. YouTube ID Extractor (`utils/extractYoutubeId.ts`)

**Purpose**: Extract YouTube video ID from various URL formats

#### Exports

##### `extractYoutubeId(url)`
```typescript
function extractYoutubeId(url: string): string | null
```

**Parameters**:
- `url` (string, required): YouTube URL or video ID

**Returns**: 
- `string`: 11-character YouTube video ID if found
- `null`: If no valid ID could be extracted

**Supported Formats**:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `VIDEO_ID` (direct ID, 11 characters)

**Example**:
```typescript
import { extractYoutubeId } from '@/utils/extractYoutubeId'

const id1 = extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
// Returns: 'dQw4w9WgXcQ'

const id2 = extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')
// Returns: 'dQw4w9WgXcQ'

const id3 = extractYoutubeId('dQw4w9WgXcQ')
// Returns: 'dQw4w9WgXcQ'

const id4 = extractYoutubeId('invalid-url')
// Returns: null
```

---

### 6. Sanity Client Service (`services/sanity/client.ts`)

**Purpose**: Type-safe Sanity client factory with retry logic

#### Exports

##### `createSanityClient(config)`
```typescript
function createSanityClient(config: SanityClientConfig): SanityClient
```

**Parameters**:
- `config` (SanityClientConfig, required): Sanity client configuration

**Type**:
```typescript
interface SanityClientConfig {
  projectId: string
  dataset: string
  apiVersion: string
  token?: string
  useCdn: boolean
}
```

**Returns**: `SanityClient` (from `@sanity/client` package)

**Behavior**:
- Creates Sanity client with provided configuration
- Wraps mutations with retry logic
- Logs errors with context

**Example**:
```typescript
import { createSanityClient } from '@/services/sanity/client'
import { env } from '@/config/env'
import { SANITY_CONFIG } from '@/config/constants'

const client = createSanityClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: SANITY_CONFIG.API_VERSION,
  token: env.SANITY_TOKEN,
  useCdn: false,
})

const videos = await client.fetch('*[_type == "video"]')
```

---

### 7. Sanity Document Types (`types/sanity.ts`)

**Purpose**: TypeScript interfaces for Sanity CMS documents

#### Exports

##### Document Interfaces

```typescript
interface SanityDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
}

interface VideoDocument extends SanityDocument {
  _type: 'video'
  title: string
  youtubeUrl?: string
  youtubeId?: string
  category?: string
  ageRange?: string
  tags?: string[]
}

interface CategoryDocument extends SanityDocument {
  _type: 'category'
  title: string
  value: string
  parent?: { _ref: string; _type: 'reference' }
}

interface AgeRangeDocument extends SanityDocument {
  _type: 'ageRange'
  title: string
  value: string
  minAge: number
  maxAge: number
}
```

##### Query Result Types

```typescript
interface VideoQueryResult {
  _id: string
  _createdAt: string
  title: string
  youtubeId: string
  youtubeUrl?: string
  category?: string
  ageRange?: string
  tags?: string[]
}
```

**Example**:
```typescript
import { VideoDocument, VideoQueryResult } from '@/types/sanity'
import { createSanityClient } from '@/services/sanity/client'

const client = createSanityClient(config)

// Type-safe query
const videos = await client.fetch<VideoQueryResult[]>(
  '*[_type == "video"] { _id, _createdAt, title, youtubeId, youtubeUrl, category, ageRange, tags }'
)

// Type-safe mutation
const newVideo: Omit<VideoDocument, keyof SanityDocument> = {
  _type: 'video',
  title: 'New Video',
  youtubeId: 'dQw4w9WgXcQ',
  category: 'education',
}

const created = await client.create(newVideo)
```

---

## Contract Versioning

**Current Version**: 1.0.0

**Breaking Changes**:
- Major version bump (2.0.0) if function signatures change
- Major version bump if exported types change in non-backward-compatible ways

**Non-Breaking Changes**:
- Minor version bump (1.1.0) for new exports
- Patch version bump (1.0.1) for bug fixes

---

## Import Paths

All utilities use path aliases for clean imports:

```typescript
// Recommended import style
import { logger } from '@/utils/logger'
import { withRetry } from '@/utils/retry'
import { env } from '@/config/env'
import { SANITY_CONFIG } from '@/config/constants'
import { extractYoutubeId } from '@/utils/extractYoutubeId'
import { createSanityClient } from '@/services/sanity/client'
import { VideoDocument } from '@/types/sanity'
```

**Path Alias Configuration** (tsconfig.json):
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Error Handling Contract

All utilities follow consistent error handling:

1. **Logger**: Never throws, always succeeds (even if logging fails)
2. **Retry**: Returns `null` on failure, logs errors
3. **Environment**: Throws on validation failure (fail-fast on startup)
4. **YouTube Extractor**: Returns `null` on invalid input (never throws)
5. **Sanity Client**: Throws on unrecoverable errors, retries on transient failures

---

## Testing Contract

All utilities must be testable in isolation:

```typescript
// Example: Testing logger
import { logger } from '@/utils/logger'

test('logger formats messages correctly', () => {
  const consoleSpy = jest.spyOn(console, 'log')
  logger.info('test message', { key: 'value' })
  
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('"message":"test message"')
  )
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('"key":"value"')
  )
})

// Example: Testing retry
import { withRetry } from '@/utils/retry'

test('withRetry retries on failure', async () => {
  let attempts = 0
  const operation = jest.fn(() => {
    attempts++
    if (attempts < 3) throw new Error('fail')
    return Promise.resolve('success')
  })
  
  const result = await withRetry(operation, { maxRetries: 3, baseDelayMs: 10 })
  
  expect(result).toBe('success')
  expect(attempts).toBe(3)
})
```

---

**Status**: Contracts defined. Ready for implementation.
