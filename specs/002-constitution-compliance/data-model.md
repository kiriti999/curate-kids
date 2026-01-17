# Data Model: Constitution Compliance Refactoring

**Feature**: Constitution Compliance Refactoring  
**Date**: 2025-01-17  
**Status**: Phase 1 Design

## Overview

This document defines the data structures and entities involved in the constitution compliance refactoring. Since this is primarily an infrastructure and code quality feature, the "data model" focuses on configuration structures, type definitions, and architectural components rather than traditional database entities.

---

## Core Entities

### 1. Logger Interface

**Purpose**: Centralized logging with structured output

**Structure**:
```typescript
interface LogContext {
  [key: string]: any
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface Logger {
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  debug(message: string, context?: LogContext): void
}

interface LogEntry {
  timestamp: string      // ISO 8601 format
  level: LogLevel
  message: string
  [key: string]: any     // Additional context
}
```

**Validation Rules**:
- `message` must be non-empty string
- `timestamp` must be valid ISO 8601 format
- `level` must be one of the four defined levels
- Context keys should use camelCase naming

**State Transitions**: N/A (stateless utility)

---

### 2. Environment Configuration

**Purpose**: Validated environment variables with type safety

**Structure**:
```typescript
interface EnvConfig {
  // Sanity CMS Configuration
  SANITY_PROJECT_ID: string
  SANITY_DATASET: string
  SANITY_TOKEN: string
  
  // Frontend Environment Variables (Next.js)
  NEXT_PUBLIC_SANITY_PROJECT_ID: string
  NEXT_PUBLIC_SANITY_DATASET: string
  
  // Optional: External Services (if present)
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  YOUTUBE_API_KEY?: string
}

interface ValidationResult {
  valid: boolean
  missingRequired: string[]
  errors: string[]
}
```

**Validation Rules**:
- All non-optional fields must be present and non-empty
- `SANITY_PROJECT_ID` must match pattern: alphanumeric + underscores
- `SANITY_DATASET` must be alphanumeric (typically 'production' or 'development')
- `SANITY_TOKEN` must be non-empty (no format validation needed)
- Public variables must match their private counterparts (consistency check)

**State Transitions**:
1. **Unvalidated** → **Validated** (on startup via validateEnv())
2. **Validation Failed** → **Application Exit** (fail-fast behavior)

---

### 3. Constants Configuration

**Purpose**: Centralized constants to eliminate magic strings

**Structure**:
```typescript
// Sanity Configuration Constants
interface SanityConfigConstants {
  API_VERSION: string
  CACHE_REVALIDATE_SECONDS: number
}

// Retry Configuration Constants
interface RetryConfigConstants {
  MAX_RETRIES: number
  BASE_DELAY_MS: number
}

// YouTube URL Patterns
type YouTubeUrlPattern = RegExp

// Category Configuration (from existing schema)
interface CategoryOption {
  value: string
  label: string
}

// Age Range Configuration (from existing schema)
interface AgeRangeOption {
  value: string
  label: string
}
```

**Concrete Values**:
```typescript
const SANITY_CONFIG: SanityConfigConstants = {
  API_VERSION: '2024-01-01',
  CACHE_REVALIDATE_SECONDS: 300,
}

const RETRY_CONFIG: RetryConfigConstants = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 2000,
}

const YOUTUBE_URL_PATTERNS: readonly YouTubeUrlPattern[] = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /^([a-zA-Z0-9_-]{11})$/,
]
```

**Validation Rules**: N/A (compile-time constants)

---

### 4. Retry Options

**Purpose**: Configuration for retry logic with exponential backoff

**Structure**:
```typescript
interface RetryOptions {
  maxRetries?: number              // Default: 3
  baseDelayMs?: number             // Default: 2000
  shouldRetry?: (error: Error) => boolean  // Default: always retry
  onRetry?: (attempt: number, error: Error) => void
}

interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
}
```

**Validation Rules**:
- `maxRetries` must be ≥ 1 and ≤ 10
- `baseDelayMs` must be ≥ 100 and ≤ 10000
- `shouldRetry` must be a function returning boolean

**State Transitions**:
1. **Attempt 1** → **Success** (return data) OR **Retry** (if shouldRetry=true)
2. **Attempt N** → **Success** (return data) OR **Retry** (if N < maxRetries) OR **Failed** (return null)
3. **Failed** → **Logged** (error logged with context)

---

### 5. Sanity Client Configuration

**Purpose**: Type-safe Sanity client factory with retry logic

**Structure**:
```typescript
interface SanityClientConfig {
  projectId: string
  dataset: string
  apiVersion: string
  token?: string
  useCdn: boolean
}

interface SanityClientWrapper {
  fetch<T = any>(query: string, params?: Record<string, any>): Promise<T>
  create<T = any>(document: T): Promise<T>
  patch(documentId: string, operations: any): Promise<any>
  delete(documentId: string): Promise<void>
}
```

**Validation Rules**:
- Config must include all required fields from EnvConfig
- `useCdn` should be `false` for authenticated requests
- All operations must include retry logic wrapper

**State Transitions**:
1. **Unconfigured** → **Configured** (via createSanityClient factory)
2. **Request Initiated** → **Success** OR **Retry** OR **Failed**
3. **Failed** → **Logged** (with operation context)

---

### 6. Sanity Document Types

**Purpose**: Type-safe interfaces for Sanity CMS documents

**Structure**:
```typescript
// Base document interface
interface SanityDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
}

// Video document
interface VideoDocument extends SanityDocument {
  _type: 'video'
  title: string
  youtubeUrl?: string
  youtubeId?: string
  category?: string
  ageRange?: string
  tags?: string[]
}

// Category document
interface CategoryDocument extends SanityDocument {
  _type: 'category'
  title: string
  value: string
  parent?: { _ref: string; _type: 'reference' }
}

// Age range document
interface AgeRangeDocument extends SanityDocument {
  _type: 'ageRange'
  title: string
  value: string
  minAge: number
  maxAge: number
}

// Query result types (subset of full documents)
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

**Validation Rules**:
- `_id` must be non-empty and unique
- `_type` must match document type literal
- `youtubeId` must be 11 characters (alphanumeric, underscore, hyphen)
- `youtubeUrl` must match YouTube URL pattern if present

**Relationships**:
- VideoDocument → CategoryDocument (via category field)
- VideoDocument → AgeRangeDocument (via ageRange field)
- CategoryDocument → CategoryDocument (via parent reference, optional)

---

## Data Flow Diagrams

### Startup Flow (Environment Validation)

```
Application Start
    ↓
Load process.env
    ↓
validateEnv() in config/env.ts
    ↓
    ├─ Missing Required? → Throw Error (fail-fast)
    ├─ Invalid Format? → Throw Error (fail-fast)
    └─ Valid → Export EnvConfig
         ↓
Initialize Services (Sanity client, etc.)
         ↓
Application Ready
```

### Logging Flow

```
Code calls logger.error(message, context)
    ↓
Logger creates LogEntry
    ├─ timestamp: new Date().toISOString()
    ├─ level: 'error'
    ├─ message: message
    └─ ...context
    ↓
JSON.stringify(LogEntry)
    ↓
console.error(json) → stdout/stderr
```

### Retry Flow (External API Call)

```
withRetry(operation, options)
    ↓
Attempt 1
    ↓
    ├─ Success → Return result
    └─ Error → shouldRetry(error)?
         ├─ No → Return null, log error
         └─ Yes → Wait (baseDelayMs * 2^0)
              ↓
         Attempt 2
              ↓
              ├─ Success → Return result
              └─ Error → shouldRetry(error)?
                   ├─ No → Return null, log error
                   └─ Yes → Wait (baseDelayMs * 2^1)
                        ↓
                   Attempt 3
                        ↓
                        ├─ Success → Return result
                        └─ Error → Return null, log error
```

### Sanity Client Usage Flow

```
Import createSanityClient from services/sanity/client
    ↓
Pass EnvConfig
    ↓
createSanityClient returns SanityClientWrapper
    ↓
Call client.fetch(query) or client.create(doc)
    ↓
withRetry wraps the operation
    ↓
    ├─ Success → Return typed result
    └─ Error → Retry with exponential backoff
         ├─ Max retries reached → Return null
         └─ Error logged with context
```

---

## Entity Relationships

```
EnvConfig
    ↓ (used by)
SanityClientConfig
    ↓ (creates)
SanityClientWrapper
    ↓ (fetches/creates)
VideoDocument / CategoryDocument / AgeRangeDocument
    ↓ (logged by)
Logger

RetryOptions
    ↓ (configures)
withRetry
    ↓ (wraps)
SanityClientWrapper operations
    ↓ (logged by)
Logger

Constants (SANITY_CONFIG, RETRY_CONFIG, etc.)
    ↓ (used by)
All services and utilities
```

---

## Migration Considerations

### Existing Data
- **No database schema changes**: This refactoring doesn't modify Sanity document schemas
- **No data migration required**: Existing Sanity documents remain unchanged
- **Configuration migration**: Hardcoded values → environment variables

### Backward Compatibility
- **Sanity Studio**: Will continue to work during refactoring (gradual migration)
- **Frontend**: Will continue to work during refactoring (gradual migration)
- **Scripts**: Need to be updated to use new shared utilities

### Breaking Changes
- **Environment Variables**: Deployment requires setting all required env vars
- **Import Paths**: Code importing from old locations needs to update import paths
- **Type Changes**: Code using `any` types needs to adopt proper interfaces

---

## Validation Strategy

### Compile-Time Validation
- TypeScript strict mode catches type errors
- Const assertions prevent mutation of constants
- Interface compliance verified at build time

### Runtime Validation
- Environment variables validated at startup (fail-fast)
- Retry options validated before executing retry logic
- Sanity responses validated against type interfaces (type guards if needed)

### Testing Validation
- Unit tests verify logger output format
- Unit tests verify retry logic behavior
- Integration tests verify Sanity client wrapper
- Type tests verify interface compliance

---

## Summary

This data model establishes the foundation for constitutional compliance by defining:
1. **Logger** - Structured logging interface
2. **EnvConfig** - Type-safe environment configuration
3. **Constants** - Centralized configuration values
4. **RetryOptions** - Configurable retry behavior
5. **SanityClient** - Type-safe service wrapper
6. **Document Types** - Sanity CMS entity definitions

All entities are designed to support the constitutional requirements for code quality, error handling, type safety, and maintainability.

---

**Status**: Phase 1 Design Complete. Ready for contract generation.
