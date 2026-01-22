# Research: Constitution Compliance Refactoring

**Feature**: Constitution Compliance Refactoring  
**Date**: 2025-01-17  
**Status**: Phase 0 Complete

## Overview

This document consolidates research findings for bringing the CuratedReels codebase into constitutional compliance. All NEEDS CLARIFICATION items from Technical Context have been resolved through codebase analysis and best practices research.

---

## Research Tasks

### 1. Testing Framework Selection

**Context**: No test framework currently configured. Constitution requires quality gates and testing.

**Research Findings**:

For TypeScript/Node.js projects with Next.js + Sanity Studio:

**Option 1: Vitest** (RECOMMENDED)
- ✅ Fast, modern test runner with TypeScript support
- ✅ Jest-compatible API (easy migration path)
- ✅ Built-in TypeScript support, no additional setup
- ✅ Great for unit and integration tests
- ✅ Works well with ESM modules
- Package: `vitest`, `@vitest/ui`

**Option 2: Jest**
- ✅ Industry standard, extensive ecosystem
- ⚠️ Requires additional TypeScript setup (ts-jest)
- ⚠️ Slower than Vitest for TypeScript projects
- Package: `jest`, `@types/jest`, `ts-jest`

**Option 3: Playwright** (for E2E testing)
- ✅ Best for end-to-end testing of Next.js frontend
- ✅ Can test Sanity Studio UI interactions
- ⚠️ Complementary to unit tests, not a replacement
- Package: `@playwright/test`

**Decision**: Vitest for unit/integration tests
- **Rationale**: Modern, fast, TypeScript-first. Constitutional requirement for quality gates satisfied.
- **Deployment**: Install vitest + @vitest/ui, create vitest.config.ts
- **Alternatives Considered**: Jest (slower setup, less modern), Playwright (E2E only, not suitable for unit tests)

---

### 2. Logger Utility Implementation Pattern

**Context**: Constitution requires centralized logger with structured logging, replacing console.log.

**Research Findings**:

**Option 1: Winston** (RECOMMENDED for Node.js)
- ✅ Industry standard for Node.js logging
- ✅ Multiple transports (console, file, external services)
- ✅ Log levels (info, warn, error, debug)
- ✅ Structured logging with metadata
- ✅ Production-ready with log rotation
- Package: `winston`

**Option 2: Pino**
- ✅ Very fast (benchmarks show 5x faster than Winston)
- ✅ JSON-first logging format
- ⚠️ Less ecosystem support than Winston
- Package: `pino`, `pino-pretty`

**Option 3: Simple Custom Logger**
- ✅ Lightweight, no dependencies
- ⚠️ Limited features (no transports, rotation, etc.)
- ⚠️ Reinventing the wheel

**Decision**: Custom lightweight logger (utils/logger.ts)
- **Rationale**: For this project's scope, a simple wrapper around console methods with structured formatting is sufficient. No need for heavy dependencies. Can be upgraded to Winston/Pino later if needed.
- **Implementation Pattern**:
  ```typescript
  // utils/logger.ts
  type LogLevel = 'info' | 'warn' | 'error' | 'debug'
  
  interface LogContext {
    [key: string]: any
  }
  
  function log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    }
    
    if (level === 'error') {
      console.error(JSON.stringify(logEntry))
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry))
    } else {
      console.log(JSON.stringify(logEntry))
    }
  }
  
  export const logger = {
    info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
    warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
    error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
    debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  }
  ```
- **Alternatives Considered**: Winston (too heavy), Pino (overkill for current needs)

---

### 3. Retry Logic Implementation Pattern

**Context**: Constitution requires retry logic with exponential backoff for external API calls (Sanity, YouTube).

**Research Findings**:

**Option 1: ts-retry** (library)
- ✅ Battle-tested, TypeScript-first
- ✅ Configurable backoff strategies
- ⚠️ Additional dependency
- Package: `ts-retry`

**Option 2: p-retry** (library)
- ✅ Popular, well-maintained
- ✅ Promise-based, clean API
- ⚠️ Additional dependency
- Package: `p-retry`

**Option 3: Custom Retry Utility**
- ✅ No dependencies, full control
- ✅ Tailored to project needs
- ⚠️ Need to implement backoff logic

**Decision**: Custom retry utility (utils/retry.ts)
- **Rationale**: Simple implementation satisfies constitutional requirements without adding dependencies. Full control over error handling behavior.
- **Implementation Pattern**:
  ```typescript
  // utils/retry.ts
  interface RetryOptions {
    maxRetries?: number
    baseDelayMs?: number
    shouldRetry?: (error: Error) => boolean
  }
  
  const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelayMs: 2000,
    shouldRetry: () => true,
  }
  
  export async function withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T | null> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    
    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === opts.maxRetries || !opts.shouldRetry(err)) {
          logger.error('Operation failed after max retries', {
            attempts: attempt,
            error: err.message,
          })
          return null
        }
        
        const delay = opts.baseDelayMs * Math.pow(2, attempt - 1)
        logger.warn('Operation failed, retrying', {
          attempt,
          nextRetryIn: delay,
          error: err.message,
        })
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    return null
  }
  ```
- **Alternatives Considered**: ts-retry and p-retry (unnecessary dependencies for simple use case)

---

### 4. Environment Variable Validation Approach

**Context**: Constitution requires validation of all environment variables at startup with fail-fast behavior.

**Research Findings**:

**Option 1: zod** (schema validation library)
- ✅ TypeScript-first, excellent type inference
- ✅ Comprehensive validation (string, number, enum, etc.)
- ✅ Great error messages
- ⚠️ Additional dependency (but widely used)
- Package: `zod`

**Option 2: envalid**
- ✅ Purpose-built for environment variables
- ✅ Clean API
- ⚠️ Less flexible than zod
- Package: `envalid`

**Option 3: Custom Validation**
- ✅ No dependencies
- ⚠️ Need to write validation logic
- ⚠️ Type inference requires manual work

**Decision**: Custom validation in config/env.ts
- **Rationale**: Given small number of environment variables, custom validation provides type safety without dependencies. Can upgrade to zod if validation complexity grows.
- **Implementation Pattern**:
  ```typescript
  // config/env.ts
  interface EnvConfig {
    SANITY_PROJECT_ID: string
    SANITY_DATASET: string
    SANITY_TOKEN: string
    NEXT_PUBLIC_SANITY_PROJECT_ID: string
    NEXT_PUBLIC_SANITY_DATASET: string
  }
  
  function validateEnv(): EnvConfig {
    const required = [
      'SANITY_PROJECT_ID',
      'SANITY_DATASET',
      'SANITY_TOKEN',
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
    ] as const
    
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
      )
    }
    
    return {
      SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID!,
      SANITY_DATASET: process.env.SANITY_DATASET!,
      SANITY_TOKEN: process.env.SANITY_TOKEN!,
      NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    }
  }
  
  export const env = validateEnv()
  ```
- **Alternatives Considered**: zod (overkill for simple string validation), envalid (extra dependency)

---

### 5. Constants Extraction Strategy

**Context**: Extract magic strings and hardcoded values to constants with SCREAMING_SNAKE_CASE naming.

**Research Findings**:

**Best Practices**:
- Group related constants in separate files
- Use `as const` for literal type inference
- Co-locate constants with their usage domain
- Export typed constant objects, not individual exports

**Identified Hardcoded Values**:
1. Sanity project ID: `'3rcl6ir9'` (appears in multiple files)
2. Sanity dataset: `'production'` (appears in multiple files)
3. Sanity API version: `'2024-01-01'` (appears in multiple files)
4. Cache revalidation time: `300` (appears in frontend/src/lib/sanity.ts)
5. YouTube URL patterns (regex patterns in extractYoutubeId functions)
6. Age range labels and values (scattered across schema types)
7. Category labels and values (scattered across schema types)

**Decision**: Create config/constants.ts with grouped constant objects
- **Rationale**: Centralized configuration following Open/Closed principle. Easy to extend by adding to constant arrays.
- **Implementation Pattern**:
  ```typescript
  // config/constants.ts
  export const SANITY_CONFIG = {
    API_VERSION: '2024-01-01',
    CACHE_REVALIDATE_SECONDS: 300,
  } as const
  
  export const YOUTUBE_URL_PATTERNS = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ] as const
  
  export const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    BASE_DELAY_MS: 2000,
  } as const
  ```
- **Alternatives Considered**: Scattered individual exports (harder to maintain), single flat constant file (poor organization)

---

### 6. Code Deduplication Strategy

**Context**: YouTube ID extraction logic duplicated in 3 places, Sanity client initialization scattered.

**Research Findings**:

**Duplicate Code Locations**:

1. **YouTube ID Extraction**:
   - `schemaTypes/utils/extractYoutubeId.ts` (21 lines)
   - `scripts/extract-youtube-ids.ts` (imported from schemaTypes)
   - `frontend/src/lib/sanity.ts` (duplicated inline, 18 lines)

2. **Sanity Client Initialization**:
   - `scripts/extract-youtube-ids.ts` (inline client creation)
   - `frontend/src/lib/sanity.ts` (inline client creation)
   - Multiple schema files may create clients

**Decision**: Consolidate shared code to root-level directories
- **YouTube ID Extraction**: Move to `utils/extractYoutubeId.ts` (single source of truth)
  - All other files import from this location
  - Remove duplicates from frontend and schemaTypes
  
- **Sanity Client**: Create `services/sanity/client.ts` with factory function
  - Exports `createSanityClient(options)` function
  - Centralizes configuration from `config/sanity.ts`
  - Wrapper includes retry logic for mutations
  
- **Rationale**: Single Responsibility Principle. Utilities are pure functions, services wrap external APIs. Clear separation of concerns.
- **Alternatives Considered**: Keep code duplicated (violates constitution), use monorepo workspace structure (overkill for project size)

---

### 7. TypeScript Type Safety Improvements

**Context**: Constitution prohibits `any` types without explicit justification. Need proper type definitions.

**Research Findings**:

**Current Type Issues**:
- Sanity responses use `any` types in scripts (e.g., `videos.filter((video: any) => ...)`)
- No centralized type definitions for Sanity documents
- Missing return type annotations on some functions

**Best Practices**:
- Define interfaces for all Sanity document types
- Use TypeScript utility types (`Pick`, `Omit`, `Partial`) for variations
- Export types alongside implementations in `types/` directory
- Use `unknown` with type guards instead of `any` when type is truly unknown

**Decision**: Create types/sanity.ts with document interfaces
- **Implementation Pattern**:
  ```typescript
  // types/sanity.ts
  export interface SanityDocument {
    _id: string
    _type: string
    _createdAt: string
    _updatedAt: string
    _rev: string
  }
  
  export interface VideoDocument extends SanityDocument {
    _type: 'video'
    title: string
    youtubeUrl?: string
    youtubeId?: string
    category?: string
    ageRange?: string
    tags?: string[]
  }
  
  export interface CategoryDocument extends SanityDocument {
    _type: 'category'
    title: string
    value: string
    parent?: { _ref: string }
  }
  
  // Query response types
  export interface VideoQueryResult {
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
- **Rationale**: Strong typing catches errors at compile time, enables better IDE support, documents expected shapes.
- **Alternatives Considered**: Using `any` everywhere (violates constitution), using Sanity's auto-generated types (complex setup for limited benefit)

---

### 8. Cyclomatic Complexity Reduction Techniques

**Context**: Constitution mandates maximum cyclomatic complexity of 5. Need to identify and refactor complex functions.

**Research Findings**:

**Measuring Complexity**:
- Use ESLint plugin: `eslint-plugin-complexity`
- Add rule: `"complexity": ["error", 5]`
- Run during CI/CD to enforce

**Common Refactoring Patterns**:
1. **Extract Methods**: Break large functions into smaller, named functions
2. **Replace Conditionals with Polymorphism**: Use strategy pattern for complex branching
3. **Guard Clauses**: Early returns to reduce nesting
4. **Compose Functions**: Chain small, single-purpose functions

**Decision**: Add complexity linting + refactor complex functions during implementation
- **Implementation**:
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
- **Rationale**: Automated enforcement prevents future violations. Refactoring during implementation ensures code quality.
- **Alternatives Considered**: Manual review (error-prone), higher complexity threshold (violates constitution)

---

## Summary of Decisions

| Research Area | Decision | Key Package/Pattern |
|---------------|----------|-------------------|
| Testing Framework | Vitest | `vitest`, `@vitest/ui` |
| Logger Utility | Custom lightweight logger | `utils/logger.ts` |
| Retry Logic | Custom retry utility | `utils/retry.ts` |
| Env Validation | Custom validation | `config/env.ts` |
| Constants Strategy | Grouped constant objects | `config/constants.ts` |
| Code Deduplication | Root-level utils/services | `utils/`, `services/` dirs |
| Type Safety | Centralized type definitions | `types/sanity.ts` |
| Complexity Enforcement | ESLint complexity rule | `eslint-plugin-complexity` |

---

## Implementation Order

Based on dependencies between components:

1. **Phase 1A: Infrastructure** (nothing depends on anything else)
   - Create `utils/logger.ts`
   - Create `config/env.ts` and validate environment
   - Create `config/constants.ts`

2. **Phase 1B: Utilities** (depends on logger)
   - Create `utils/retry.ts` (uses logger)
   - Create `utils/extractYoutubeId.ts` (uses constants)

3. **Phase 1C: Services** (depends on utilities + config)
   - Create `services/sanity/client.ts` (uses env, retry, logger)
   - Create `types/sanity.ts`

4. **Phase 2: Refactoring** (depends on all above)
   - Replace all console.log with logger
   - Replace hardcoded values with constants
   - Remove duplicate code
   - Add type definitions
   - Reduce complexity where needed

5. **Phase 3: Quality Gates** (verification)
   - Add ESLint complexity rule
   - Set up Vitest
   - Add documentation headers
   - Update README with environment variables

---

**Status**: All NEEDS CLARIFICATION items resolved. Ready for Phase 1 (Design & Contracts).
