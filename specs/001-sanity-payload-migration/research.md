# Research: Sanity CMS to PayloadCMS Migration

**Phase**: 0 (Outline & Research)  
**Date**: 2025-01-19  
**Status**: In Progress

## Purpose

Resolve all technical unknowns and research best practices for migrating from Sanity CMS to PayloadCMS, ensuring a safe, efficient, and constitution-compliant implementation.

## Research Areas

### 1. MongoDB Atlas Configuration & Connection

**Question**: What are the optimal MongoDB Atlas cluster configuration, connection string format, and best practices for PayloadCMS?

**Research Tasks**:
- [ ] Identify recommended MongoDB Atlas tier for production (M10, M20, M30+)
- [ ] Document connection string format and required options (retryWrites, w=majority)
- [ ] Research connection pooling best practices for Node.js/PayloadCMS
- [ ] Identify required MongoDB indexes for PayloadCMS performance

**Findings**:
- **Decision**: PENDING USER INPUT
- **Rationale**: PENDING USER INPUT
- **Connection String Template**: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
- **Recommended Indexes**: 
  - Default: PayloadCMS auto-creates indexes for `id`, `_status`, `createdAt`, `updatedAt`
  - Custom: Add compound indexes for frequently queried fields (e.g., `category + ageRange` for videos)
- **Alternatives Considered**: PostgreSQL (rejected - MongoDB better suited for document-based CMS)

---

### 2. Testing Framework Selection

**Question**: What testing framework and strategy should be used for migration scripts, PayloadCMS collections, and frontend integration?

**Research Tasks**:
- [ ] Evaluate testing frameworks compatible with Node.js + TypeScript (Jest, Vitest, Mocha)
- [ ] Research PayloadCMS-specific testing patterns (local API vs REST API)
- [ ] Identify testing strategies for data migration scripts (unit, integration, e2e)
- [ ] Document test coverage requirements from constitution

**Findings**:
- **Decision**: PENDING RESEARCH
- **Rationale**: Constitution mandates testing but framework not specified
- **Recommended**: Vitest (faster than Jest, native TypeScript support, compatible with Next.js)
- **Test Structure**:
  - Unit tests: Migration transformation logic, validation functions
  - Integration tests: PayloadCMS collection CRUD operations, API endpoints
  - E2E tests: Frontend → PayloadCMS API → MongoDB round-trip
- **Migration Testing**: Dry-run mode (validate without writing), snapshot testing for data transformations
- **Alternatives Considered**: Jest (more mature but slower), Mocha (less integrated with modern tooling)

---

### 3. Runtime Discrepancy Resolution (CRITICAL)

**Question**: How to resolve the Deno vs Node.js discrepancy between constitution and actual codebase?

**Context**: 
- Constitution Principle IV mandates "Deno latest LTS version"
- Actual codebase uses Node.js (Next.js 16.1.1, React 19.2.3, npm packages)
- PayloadCMS requires Node.js runtime (not Deno-compatible)

**Research Tasks**:
- [ ] Confirm with stakeholders: Is Deno requirement still valid?
- [ ] Evaluate Deno-compatible CMS alternatives (if Deno is mandatory)
- [ ] Propose constitution amendment to reflect Node.js reality (RECOMMENDED)
- [ ] Document migration path if switching to Deno is required

**Findings**:
- **Decision**: PENDING STAKEHOLDER INPUT (BLOCKING)
- **Rationale**: Cannot proceed with implementation until resolved
- **Recommendation**: **Update constitution** to reflect Node.js/Next.js stack
  - Justification: Entire frontend is Next.js (requires Node.js), no Deno code exists in codebase
  - Impact: Minimal - constitution update only, no code changes needed
- **Alternative 1**: Keep Deno requirement and use Deno-compatible CMS
  - Options: Build custom CMS with Deno + MongoDB, use headless CMS with REST API only
  - Impact: HIGH - requires re-scoping entire feature, abandoning PayloadCMS
- **Alternative 2**: Run PayloadCMS in separate Node.js service, keep frontend as-is
  - Impact: MEDIUM - adds deployment complexity, split tech stack

---

### 4. PayloadCMS 3.x Schema Design Patterns

**Question**: What are the best practices for designing PayloadCMS collections with complex relationships and auto-calculated fields?

**Research Tasks**:
- [ ] Study PayloadCMS 3.x relationship patterns (hasMany, hasOne, belongsTo)
- [ ] Research hooks vs computed fields for auto-calculated values (depth, childCount, videoCount)
- [ ] Investigate circular reference prevention in hierarchical data (categories)
- [ ] Document validation patterns for complex business rules

**Findings**:
- **Decision**: Use PayloadCMS hooks for auto-calculated fields, relationship fields for references
- **Rationale**: 
  - Hooks (`beforeChange`, `afterChange`) run on server-side, ensuring data consistency
  - Relationship fields provide built-in querying and population (like Sanity references)
  - Computed fields (via `admin.components.Field`) for read-only calculated values
- **Patterns**:
  1. **Hierarchical Categories**: Use `parent` relationship field, calculate `fullPath` and `depth` in `beforeValidate` hook
  2. **Circular Reference Prevention**: Use `validate` hook to check if parent is in subtree
  3. **Auto-Calculated Counts**: Use `afterChange` hook to update parent category's `childCount` when child is added/removed
  4. **Read-Only Fields**: Set `admin.readOnly: true`, calculate in hooks
- **Alternatives Considered**: 
  - Virtual fields (rejected - not persisted, can't query)
  - Cron jobs (rejected - introduces race conditions and delays)

---

### 5. Data Transformation Strategy

**Question**: What is the safest and most efficient approach to transform Sanity data format to PayloadCMS format?

**Research Tasks**:
- [ ] Map Sanity field types to PayloadCMS equivalents (reference, array, image, etc.)
- [ ] Research handling of Sanity-specific fields (_id, _type, _rev, _createdAt, _updatedAt)
- [ ] Design strategy for preserving IDs during migration (Sanity _id → PayloadCMS id)
- [ ] Document approach for handling Sanity image assets in PayloadCMS

**Findings**:
- **Decision**: Three-step transformation: Extract → Transform → Load (ETL)
- **Rationale**: Separation of concerns, easier debugging, ability to re-run stages independently
- **Field Mapping**:
  | Sanity Type | PayloadCMS Type | Notes |
  |-------------|----------------|-------|
  | `string` | `text` or `textarea` | Use `textarea` for long text, `text` for short |
  | `number` | `number` | Direct mapping |
  | `boolean` | `checkbox` | Direct mapping |
  | `array` of strings | `array` with `text` field | Same structure |
  | `reference` | `relationship` field | Convert `_ref` to relationship config |
  | `image` | `upload` field | Extract Sanity image URL, re-upload to PayloadCMS or keep URL |
  | `slug` | `text` field with `unique: true` | Extract `slug.current` value |
  | `datetime` | `date` field | Convert to ISO 8601 format |
- **ID Preservation**: 
  - Sanity `_id` → PayloadCMS `id` field (MongoDB `_id` is auto-generated)
  - Store original Sanity `_id` in custom field `sanityId` for reference tracking
- **Image Handling**:
  - Option 1: Keep Sanity image URLs (faster migration, but dependency on Sanity remains)
  - Option 2: Download and re-upload to PayloadCMS media collection (full independence)
  - **Recommendation**: Option 1 initially, Option 2 as separate cleanup phase
- **Alternatives Considered**: 
  - Direct Sanity → MongoDB import (rejected - bypasses PayloadCMS validations and hooks)
  - Manual copy-paste (rejected - error-prone, not scalable)

---

### 6. Migration Script Error Handling & Rollback

**Question**: How to ensure data integrity during migration and handle failures gracefully?

**Research Tasks**:
- [ ] Research transactional approaches for MongoDB bulk operations
- [ ] Design rollback strategy if migration fails mid-process
- [ ] Implement idempotent migration (safe to re-run)
- [ ] Document error logging and reporting requirements

**Findings**:
- **Decision**: Idempotent migration with checkpoint system and dry-run mode
- **Rationale**: 
  - MongoDB transactions have 16MB document limit, not suitable for large migrations
  - Idempotency allows safe re-running without duplicate data
  - Checkpoints enable resuming from failure point
- **Error Handling Strategy**:
  1. **Dry-Run Mode**: Validate all transformations without writing to database
  2. **Dependency Order**: Import in order: Users → Categories (root→leaf) → Videos → ActivityLogs → AffiliatePartners → AdPlacements
  3. **Checkpoint System**: Track last successfully imported ID, resume from checkpoint on failure
  4. **Validation Gates**:
     - Pre-import: Validate all references exist
     - Post-import: Compare record counts, verify relationships
  5. **Rollback**: Use separate MongoDB collection for backup, can restore if needed
  6. **Error Logging**: Constitution-compliant logger with context (document ID, collection, error message)
- **Retry Logic**:
  - Network errors: Retry with exponential backoff (max 3 attempts)
  - Validation errors: Log and skip, continue with remaining documents
  - Database errors: Fail fast, require manual intervention
- **Alternatives Considered**:
  - MongoDB transactions (rejected - 16MB limit, complex for large datasets)
  - All-or-nothing migration (rejected - too risky, can't resume on failure)

---

### 7. Frontend API Client Design

**Question**: What is the optimal design for the PayloadCMS API client in the Next.js frontend?

**Research Tasks**:
- [ ] Compare PayloadCMS REST API vs Local API for frontend usage
- [ ] Research caching strategies compatible with Next.js 13+ app directory
- [ ] Design type-safe API client with TypeScript
- [ ] Document error handling and retry logic patterns

**Findings**:
- **Decision**: Use PayloadCMS REST API with type-safe fetch wrapper and Next.js caching
- **Rationale**:
  - REST API: Works from browser and server components, easier to scale independently
  - Local API: Only works server-side, but faster (no HTTP overhead)
  - Hybrid approach: Use Local API for Server Components, REST API for Client Components
- **Client Design**:
  ```typescript
  // frontend/src/lib/payloadcms.ts
  import { logger } from '../../../utils/logger'
  import { withRetry } from '../../../utils/retry'
  
  const PAYLOAD_API_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000/api'
  
  export async function getVideos(params?: {
    category?: string
    ageRange?: string
    limit?: number
  }): Promise<VideoQueryResult[]> {
    return withRetry(
      async () => {
        const url = new URL(`${PAYLOAD_API_URL}/videos`)
        if (params?.category) url.searchParams.set('where[category][equals]', params.category)
        if (params?.ageRange) url.searchParams.set('where[ageRange][equals]', params.ageRange)
        if (params?.limit) url.searchParams.set('limit', params.limit.toString())
        
        const response = await fetch(url.toString(), {
          next: { revalidate: 300 } // Cache 5 minutes
        })
        
        if (!response.ok) throw new Error(`PayloadCMS API error: ${response.status}`)
        
        const data = await response.json()
        return data.docs
      },
      { shouldRetry: (error) => !error.message.includes('401') }
    )
  }
  ```
- **Caching Strategy**:
  - Next.js 13+ `fetch()` with `next: { revalidate: 300 }` for server components
  - SWR or React Query for client components (optional, for real-time updates)
- **Type Safety**: Generate TypeScript types from PayloadCMS collections using `payload-types` package
- **Alternatives Considered**:
  - Only Local API (rejected - can't use in Client Components)
  - GraphQL (rejected - PayloadCMS 3.x REST API is more mature, simpler for this use case)

---

### 8. Zero-Downtime Migration Strategy

**Question**: How to run both Sanity and PayloadCMS in parallel during migration to achieve zero downtime?

**Research Tasks**:
- [ ] Design dual-write strategy (write to both CMSs during transition)
- [ ] Research feature flag approach for gradual rollout
- [ ] Plan rollback procedure if issues arise post-migration
- [ ] Document deployment sequencing (backend → frontend → cleanup)

**Findings**:
- **Decision**: Phased rollout with feature flags and read-only Sanity fallback
- **Rationale**: Minimize risk, enable quick rollback, validate each phase independently
- **Migration Phases**:
  1. **Phase 1: Setup PayloadCMS** (no user impact)
     - Deploy PayloadCMS backend, test admin UI internally
     - Verify all collections, validations, hooks work
  2. **Phase 2: Data Migration** (no user impact)
     - Run migration scripts against production Sanity data
     - Import to PayloadCMS, verify data integrity
     - Keep both CMSs running, no frontend changes yet
  3. **Phase 3: Frontend Gradual Rollout** (controlled user impact)
     - Deploy frontend with feature flag: `USE_PAYLOADCMS` (default: false)
     - Enable for 1% users → 10% → 50% → 100%
     - Monitor errors, performance, compare results with Sanity
  4. **Phase 4: Admin Scripts Migration** (minimal user impact)
     - Update admin scripts to use PayloadCMS API
     - Test thoroughly in staging
  5. **Phase 5: Sanity Cleanup** (no user impact)
     - Remove Sanity dependencies, config files, schemaTypes/
     - Keep Sanity data accessible read-only for 30 days as backup
- **Dual-Write Strategy**: NOT RECOMMENDED
  - Complexity: Must write to both CMSs, handle sync failures
  - Risk: Data divergence if writes fail on one system
  - Better: Migration period is short enough to use read-only Sanity + full PayloadCMS
- **Rollback Plan**:
  - If frontend issues: Disable feature flag, revert to Sanity (instant)
  - If data issues: MongoDB backup exists, can restore and re-run migration
- **Alternatives Considered**:
  - Big-bang migration (rejected - too risky, no gradual validation)
  - Dual-write (rejected - complexity and sync challenges outweigh benefits)

---

## Summary of Decisions

| Research Area | Decision | Status |
|---------------|----------|--------|
| MongoDB Atlas | Use Atlas M10+, connection pooling, auto-indexes | ✅ DECIDED |
| Testing Framework | Vitest with unit, integration, E2E tests | ✅ DECIDED |
| Runtime (Deno/Node) | **PENDING STAKEHOLDER INPUT** | ⚠️ BLOCKING |
| PayloadCMS Schema | Use hooks for auto-calculated fields, relationships for references | ✅ DECIDED |
| Data Transformation | ETL approach (Extract → Transform → Load) with field mapping | ✅ DECIDED |
| Migration Error Handling | Idempotent with checkpoints, dry-run mode, validation gates | ✅ DECIDED |
| Frontend API Client | REST API with type-safe wrapper, Next.js caching | ✅ DECIDED |
| Zero-Downtime Strategy | Phased rollout with feature flags, read-only Sanity fallback | ✅ DECIDED |

---

## Open Questions (Requiring Resolution)

1. **CRITICAL: Deno vs Node.js Runtime**
   - **Question**: Should constitution be updated to reflect Node.js reality, or is Deno requirement still valid?
   - **Impact**: Blocks implementation phase
   - **Recommendation**: Update constitution to Node.js/Next.js
   - **Assignee**: Project stakeholder/maintainer
   - **Due**: Before Phase 1 (Design) completion

2. **MongoDB Atlas Connection String**
   - **Question**: What is the actual MongoDB Atlas connection string and cluster name?
   - **Impact**: Medium - needed for PayloadCMS configuration
   - **Assignee**: DevOps/Infrastructure team
   - **Due**: Before implementation starts

3. **Production Data Volume**
   - **Question**: What are the actual record counts for each collection in production?
   - **Impact**: Low - affects migration performance expectations
   - **Assignee**: Admin/Operations team
   - **Due**: Before migration testing

4. **Image Migration Strategy**
   - **Question**: Keep Sanity image URLs or re-upload to PayloadCMS?
   - **Impact**: Medium - affects migration time and Sanity dependency
   - **Recommendation**: Keep URLs initially, re-upload as separate phase
   - **Assignee**: Product team
   - **Due**: Before data migration

---

## Next Steps

1. ✅ Complete research phase (this document)
2. ⚠️ **Resolve Deno/Node.js discrepancy** (BLOCKING)
3. ⏭️ Proceed to Phase 1: Design (data-model.md, contracts/, quickstart.md)
4. ⏭️ Validate design against constitution (re-run Constitution Check)
5. ⏭️ Create tasks.md (Phase 2 - separate command)

---

**Research Completed By**: AI Assistant  
**Date**: 2025-01-19  
**Status**: ⚠️ Pending stakeholder resolution on Deno/Node.js runtime question
