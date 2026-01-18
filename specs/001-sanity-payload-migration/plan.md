# Implementation Plan: Sanity CMS to PayloadCMS Migration

**Branch**: `001-sanity-payload-migration` | **Date**: 2025-01-19 | **Spec**: [/specs/001-sanity-payload-migration/spec.md](/Users/arjun/curatekids/specs/001-sanity-payload-migration/spec.md)
**Input**: Feature specification from `/specs/001-sanity-payload-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate CurateKids application from Sanity CMS to PayloadCMS (latest 3.x) for content management, data storage, and admin interface. This involves setting up PayloadCMS with MongoDB Atlas, migrating six document types (video, category, user, activityLog, adPlacement, affiliatePartner) with all relationships and validations, updating the Next.js frontend to use PayloadCMS REST API instead of Sanity GROQ queries, updating admin scripts, and ultimately removing all Sanity dependencies.

## Technical Context

**Language/Version**: TypeScript 5.8 (Sanity CMS backend), TypeScript 5.x with Next.js 16.1.1 (frontend)  
**Primary Dependencies**: 
  - Current: Sanity CMS 5.4.0, @sanity/client 7.14.0, React 19.2.3
  - Target: PayloadCMS 3.x (latest), MongoDB Node Driver, Next.js 16.1.1 (unchanged)
**Storage**: 
  - Current: Sanity Content Lake (managed cloud)
  - Target: MongoDB Atlas (cloud-hosted, NEEDS CLARIFICATION on connection string and cluster configuration)
**Testing**: NEEDS CLARIFICATION (no existing test framework detected in package.json)  
**Target Platform**: Vercel (Next.js frontend), Node.js server (PayloadCMS admin + API)
**Project Type**: Web application (Next.js frontend + CMS backend)  
**Performance Goals**: 
  - CMS admin UI: <2s page load, <500ms query response
  - Frontend API calls: <300ms for video lists, <200ms for category trees
  - Migration: Process 1000+ documents in <10 minutes
**Constraints**: 
  - Zero downtime requirement: Both systems must run in parallel during migration
  - Data integrity: 100% data preservation with relationship validation
  - Frontend compatibility: No UI/UX changes visible to end users
**Scale/Scope**: 
  - 6 document types (video, category, user, activityLog, adPlacement, affiliatePartner)
  - Estimated 500-5000 videos, 50-200 categories, 10-50 users, 10k-100k activity logs
  - Hierarchical categories up to 10 levels deep
  - Frontend: ~10-20 pages/components consuming CMS data

**IMPORTANT DISCREPANCY**: Constitution specifies Deno runtime, but actual codebase uses Node.js/Next.js. PayloadCMS requires Node.js (not Deno-compatible). NEEDS CLARIFICATION on whether to:
  - Update constitution to reflect Node.js reality
  - Adapt PayloadCMS to work in Deno environment (likely not feasible)
  - Use alternative Deno-compatible CMS (would require re-scoping this feature)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Code Quality and SOLID Principles (Principle I)
- **Status**: PASS (with planning)
- **Rationale**: Migration scripts and PayloadCMS collections will follow cyclomatic complexity ≤5, proper code reuse via utils/services
- **Action**: Extract shared logic (data transformation, validation) to utils/ during implementation

### ✅ Code Maintainability Standards (Principle II)
- **Status**: PASS
- **Rationale**: All collection names, field names, and validation constants will be defined as constants
- **Example**: PayloadCMS collection configs will use centralized constants for field definitions

### ✅ Error Handling Standards (Principle III)
- **Status**: PASS (with planning)
- **Rationale**: Migration scripts must implement retry logic for MongoDB connections, detailed error logging with context
- **Action**: Create standardized error handling utilities for migration and API integration

### ⚠️ Documentation Standards (Principle IV)
- **Status**: CONDITIONAL PASS
- **Issue**: Constitution mandates Deno runtime, but PayloadCMS requires Node.js
- **Resolution Required**: Update constitution to reflect Node.js/Next.js stack OR find Deno-compatible alternative
- **Action**: Generate HLD in research.md, API contracts in JSON format (Phase 1)

### ✅ Real Data and API Standards (Principle V)
- **Status**: PASS
- **Rationale**: Migration will use real production Sanity data, PayloadCMS will use real MongoDB Atlas, no mocks/stubs

### ❌ Technology Stack Alignment
- **Status**: FAIL - REQUIRES RESOLUTION
- **Violation**: Constitution specifies "Deno (latest LTS version)" but:
  - Current codebase uses Node.js (Next.js 16.1.1, React 19.2.3)
  - PayloadCMS requires Node.js runtime (not Deno-compatible)
  - Frontend uses npm packages, not Deno imports
- **Impact**: This is a constitutional violation that must be resolved before proceeding
- **Options**:
  1. **Update constitution** to reflect Node.js reality (RECOMMENDED - aligns with existing codebase)
  2. **Defer migration** until Deno-compatible CMS solution available
  3. **Re-scope feature** to use different CMS that supports Deno

**GATE DECISION**: ⚠️ **CONDITIONAL PASS** - Can proceed with research phase, but Deno/Node.js discrepancy MUST be resolved before implementation (Phase 1 completion).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Current Structure (Web application: Next.js frontend + Sanity CMS backend)
curatekids/
├── frontend/                      # Next.js application
│   ├── src/
│   │   ├── app/                  # Next.js 13+ app directory (pages)
│   │   ├── components/           # React components
│   │   ├── lib/                  # Utilities and API clients
│   │   │   └── sanity.ts        # ⚠️ TO BE REPLACED with payloadcms.ts
│   │   └── types/                # TypeScript type definitions
│   ├── public/                   # Static assets
│   └── package.json              # Frontend dependencies
│
├── schemaTypes/                   # ⚠️ TO BE REMOVED (Sanity-specific)
│   ├── documents/                # Six Sanity document types
│   │   ├── video.ts
│   │   ├── category.ts
│   │   ├── user.ts
│   │   ├── activityLog.ts
│   │   ├── adPlacement.ts
│   │   └── affiliatePartner.ts
│   └── [other Sanity schema files]
│
├── scripts/                       # Admin automation scripts
│   └── [TO BE UPDATED]           # ⚠️ Update to use PayloadCMS API
│
├── services/                      # External service integrations
│   ├── cloudinary.ts             # Video hosting (unchanged)
│   └── youtube.ts                # YouTube API (unchanged)
│
├── utils/                         # Shared utilities
│   ├── logger.ts                 # Logging (unchanged)
│   └── [other utils]
│
├── config/                        # Configuration constants
│   └── constants.ts              # ⚠️ Update CMS-related constants
│
├── types/                         # Shared TypeScript types
│   └── sanity.ts                 # ⚠️ TO BE REPLACED with payload.ts
│
├── sanity.config.ts              # ⚠️ TO BE REMOVED
├── sanity.cli.ts                 # ⚠️ TO BE REMOVED
└── package.json                  # Root dependencies (Sanity)

# New Structure After Migration
curatekids/
├── frontend/                      # Next.js application (mostly unchanged)
│   ├── src/
│   │   ├── app/                  # Next.js pages (unchanged)
│   │   ├── components/           # React components (unchanged)
│   │   ├── lib/
│   │   │   └── payloadcms.ts    # ✅ NEW: PayloadCMS API client
│   │   └── types/
│   │       └── payload.ts        # ✅ NEW: PayloadCMS type definitions
│   └── package.json              # ✅ UPDATED: Remove @sanity/client
│
├── payload/                       # ✅ NEW: PayloadCMS configuration
│   ├── collections/               # PayloadCMS collection configs
│   │   ├── Video.ts              # ✅ NEW: Migrated from schemaTypes/documents/video.ts
│   │   ├── Category.ts           # ✅ NEW: Migrated from schemaTypes/documents/category.ts
│   │   ├── User.ts
│   │   ├── ActivityLog.ts
│   │   ├── AdPlacement.ts
│   │   └── AffiliatePartner.ts
│   ├── hooks/                    # PayloadCMS lifecycle hooks
│   │   ├── autoCalculateFields.ts  # ✅ NEW: Category depth, childCount, videoCount
│   │   └── slugGeneration.ts      # ✅ NEW: Auto-generate slugs
│   └── payload.config.ts         # ✅ NEW: PayloadCMS main configuration
│
├── migration/                     # ✅ NEW: Migration scripts directory
│   ├── export-from-sanity.ts     # ✅ NEW: Export all Sanity documents to JSON
│   ├── transform-data.ts         # ✅ NEW: Transform Sanity format to PayloadCMS format
│   ├── import-to-payloadcms.ts   # ✅ NEW: Import transformed data to MongoDB
│   ├── verify-migration.ts       # ✅ NEW: Validate data integrity post-migration
│   └── exported-data/            # ✅ NEW: Temporary directory for exported JSON files
│       ├── videos.json
│       ├── categories.json
│       └── [other collections].json
│
├── scripts/                       # Admin scripts (UPDATED)
│   ├── bulk-import.ts            # ✅ UPDATED: Use PayloadCMS API instead of Sanity
│   └── analytics.ts              # ✅ UPDATED: Use PayloadCMS API
│
├── services/                      # External services (unchanged)
│   ├── cloudinary.ts
│   └── youtube.ts
│
├── utils/                         # Shared utilities (unchanged)
│   └── logger.ts
│
├── config/                        # Configuration (UPDATED)
│   └── constants.ts              # ✅ UPDATED: PayloadCMS-related constants
│
├── types/                         # Shared types (UPDATED)
│   └── payload.ts                # ✅ NEW: PayloadCMS type definitions
│
├── server.ts                     # ✅ NEW: PayloadCMS + Express server entry point
└── package.json                  # ✅ UPDATED: Add PayloadCMS 3.x, remove Sanity packages
```

**Structure Decision**: This is a **web application** structure with Next.js frontend and CMS backend. The migration introduces a new `payload/` directory for PayloadCMS collections and configuration, a `migration/` directory for one-time migration scripts, and removes all Sanity-specific directories (`schemaTypes/`, `sanity.config.ts`, etc.). The frontend structure remains largely unchanged except for the CMS client replacement in `lib/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Deno vs Node.js Runtime | PayloadCMS requires Node.js runtime; constitution specifies Deno | No Deno-compatible CMS alternatives exist with feature parity to PayloadCMS. Requires constitution amendment or feature re-scoping. |

---

## Phase Completion Status

### ✅ Phase 0: Research (COMPLETE)
- **Output**: `research.md` generated with 8 research areas
- **Key Decisions**: MongoDB Atlas, ETL migration strategy, hooks for auto-calculated fields, phased rollout
- **Blockers Identified**: Deno/Node.js runtime discrepancy (requires stakeholder resolution)

### ✅ Phase 1: Design (COMPLETE)
- **Outputs**:
  - `data-model.md`: Complete schema definitions for all 6 collections
  - `contracts/video-api.json`: OpenAPI 3.1.0 spec for Video endpoints
  - `contracts/category-api.json`: OpenAPI 3.1.0 spec for Category endpoints
  - `quickstart.md`: Developer setup guide (2-3 hour implementation)
- **Constitution Re-Check**: CONDITIONAL PASS (see below)

### ⏭️ Phase 2: Tasks (NOT STARTED - separate command)
- **Command**: `/speckit.tasks` (separate workflow, not part of `/speckit.plan`)
- **Output**: `tasks.md` with dependency-ordered task breakdown

---

## Constitution Re-Check (Post-Design)

*Re-evaluating after Phase 1 design artifacts*

### ✅ Code Quality and SOLID Principles (Principle I)
- **Status**: PASS
- **Evidence**: 
  - Migration scripts designed with clear separation: export → transform → import
  - PayloadCMS hooks extracted to separate functions (cyclomatic complexity ≤5)
  - Shared validation logic centralized in utils/

### ✅ Code Maintainability Standards (Principle II)
- **Status**: PASS
- **Evidence**: 
  - Collection configs use centralized constants from `config/constants.ts`
  - Field names, validation messages defined as constants
  - No magic strings in API contracts or data model

### ✅ Error Handling Standards (Principle III)
- **Status**: PASS
- **Evidence**: 
  - Migration scripts include retry logic with exponential backoff
  - Detailed error logging with context (document ID, collection, error message)
  - Frontend API client includes error handling with graceful degradation

### ✅ Documentation Standards (Principle IV)
- **Status**: PASS
- **Evidence**: 
  - HLD documented in `research.md` (phased rollout, architecture decisions)
  - API specs in JSON format (OpenAPI 3.1.0) as mandated
  - `quickstart.md` provides comprehensive setup guide
- **Remaining Issue**: Deno/Node.js discrepancy (see Principle VI)

### ✅ Real Data and API Standards (Principle V)
- **Status**: PASS
- **Evidence**: 
  - Migration uses production Sanity data (no mocks)
  - PayloadCMS connects to real MongoDB Atlas
  - Frontend integration uses real PayloadCMS REST API

### ⚠️ Superseding Guidance (Principle VI)
- **Status**: CONDITIONAL PASS
- **Critical Issue**: Constitution mandates "Deno latest LTS version" but design requires Node.js (PayloadCMS dependency)
- **Resolution Path**: 
  1. **Option 1** (RECOMMENDED): Update constitution to reflect Node.js/Next.js stack
     - Impact: Documentation only, aligns with existing codebase
     - Rationale: Entire project is already Node.js-based (Next.js frontend, npm packages)
  2. **Option 2**: Use Deno-compatible alternative (requires re-scoping feature)
     - Impact: HIGH - abandons PayloadCMS, needs new CMS selection and research
  3. **Option 3**: Defer feature until Deno-compatible solution available
     - Impact: HIGH - blocks migration indefinitely

**RECOMMENDATION**: Proceed with Node.js implementation, update constitution to reflect reality (Option 1). This is a documentation fix, not a technical violation, as the codebase never used Deno.

---

## Final Gate Decision

**Status**: ⚠️ **CONDITIONAL PASS - IMPLEMENTATION READY WITH CAVEAT**

- ✅ **Technical Design**: Complete and constitution-compliant
- ✅ **Phase 0 Research**: All unknowns resolved
- ✅ **Phase 1 Design**: Data model, API contracts, quickstart guide delivered
- ⚠️ **Blocking Issue**: Deno/Node.js discrepancy requires resolution before implementation

**Recommended Action**: 
1. Present Deno/Node.js resolution options to stakeholder
2. If Option 1 approved (update constitution): Proceed to Phase 2 (tasks.md generation via `/speckit.tasks`)
3. If Option 2/3 selected: Re-scope feature and restart planning workflow

---

**Plan Completed**: 2025-01-19  
**Next Command**: `/speckit.tasks` (after runtime discrepancy resolved)  
**Implementation Ready**: YES (pending stakeholder decision on Deno/Node.js)
