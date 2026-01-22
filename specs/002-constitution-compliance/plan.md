# Implementation Plan: Constitution Compliance Refactoring

**Branch**: `002-constitution-compliance` | **Date**: 2025-01-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-constitution-compliance/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Bring the CuratedReels codebase into full compliance with the project constitution by implementing critical infrastructure (logger utility, environment validation), improving code quality (reducing complexity, extracting constants), adding robust error handling with retry logic, and enhancing type safety. This is a foundational refactoring that will establish patterns and utilities for all future development.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js (currently using Node.js/TypeScript stack, not Deno as mentioned in constitution)  
**Primary Dependencies**: 
- Sanity CMS (@sanity/client, @sanity/ui) for content management
- Next.js 15.x for frontend
- Sanity Studio for content editing
**Storage**: Sanity CMS (cloud-hosted), no local database  
**Testing**: NEEDS CLARIFICATION - no test framework currently configured  
**Target Platform**: Web (Vercel for frontend, Sanity hosted Studio)
**Project Type**: Web application (Sanity Studio backend + Next.js frontend)  
**Performance Goals**: 
- Sanity API response time <500ms p95
- Frontend initial load <2s
- Build time <2 minutes
**Constraints**: 
- Must maintain backward compatibility with existing Sanity documents
- Zero downtime during refactoring (gradual rollout)
- No breaking changes to Sanity Studio UI
**Scale/Scope**: 
- ~43 TypeScript files to refactor
- ~35 console.log statements to replace
- Multiple duplicate code patterns (YouTube ID extraction, Sanity client init)
- Hardcoded project IDs and configuration throughout codebase

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Code Quality and SOLID Principles
- **Cyclomatic Complexity**: Current code likely exceeds complexity of 5 in some functions
- **Action Required**: Refactor complex functions during implementation
- **Status**: NEEDS REFACTORING (not a blocker for planning)
- **Post-Design Status**: ✅ ADDRESSED - ESLint complexity rule added to plan, refactoring patterns documented in quickstart.md

### ✅ Principle II: Code Maintainability Standards
- **Constants Over Literals**: Current code has hardcoded project IDs and magic strings
- **Action Required**: Extract to constants during Phase 1
- **Status**: NEEDS REFACTORING (not a blocker for planning)
- **Post-Design Status**: ✅ ADDRESSED - config/constants.ts designed with grouped constant objects, extraction patterns documented

### ✅ Principle III: Error Handling Standards
- **Current State**: console.log used extensively, no structured error handling or retry logic
- **Action Required**: Implement logger utility and retry patterns
- **Status**: NEEDS IMPLEMENTATION (this is the goal of the feature)
- **Post-Design Status**: ✅ ADDRESSED - Logger utility designed (utils/logger.ts), retry utility with exponential backoff designed (utils/retry.ts)

### ✅ Principle IV: Documentation Standards
- **Current State**: Some files lack header comments and JSDoc
- **Action Required**: Add documentation headers during implementation
- **Status**: NEEDS IMPROVEMENT (not a blocker for planning)
- **Post-Design Status**: ✅ ADDRESSED - Documentation patterns and examples provided in quickstart.md

### ✅ Principle V: Real Data and API Standards
- **Current State**: All code uses real Sanity API, no mocks detected
- **Status**: COMPLIANT ✓
- **Post-Design Status**: ✅ STILL COMPLIANT - No mocks introduced in design

### ⚠️ Principle VI: Technology Stack (DEVIATION ACKNOWLEDGED)
- **Constitutional Requirement**: Deno runtime with Grammy for Telegram bot
- **Current Reality**: Node.js/TypeScript with Sanity Studio and Next.js frontend
- **Justification**: The codebase is NOT a Telegram bot despite constitution focus on bot patterns. This is a content management system (Sanity Studio) with a frontend display. The constitution appears to have been written for a different project scope.
- **Action**: Apply constitutional principles that are relevant (logging, error handling, code quality, constants, documentation) while acknowledging the runtime/framework deviation.
- **Status**: DEVIATION JUSTIFIED ✓
- **Post-Design Status**: ✅ STILL JUSTIFIED - Design applies all applicable constitutional principles to Node.js/TypeScript stack

**GATE RESULT**: ✅ PASS - All principles either compliant or have justified deviations. This refactoring will bring the codebase into compliance with applicable constitutional standards.

**POST-DESIGN RE-CHECK**: ✅ PASS - Phase 1 design successfully addresses all constitutional requirements that apply to this codebase. Ready for implementation.

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
# Web application structure (Sanity Studio + Next.js frontend)

# Backend: Sanity Studio & Scripts
schemaTypes/                    # Sanity schema definitions
├── documents/                  # Document type schemas
├── objects/                    # Reusable object schemas
├── utils/                      # Shared utilities
│   ├── extractYoutubeId.ts    # [DUPLICATE CODE] YouTube ID extraction
│   ├── buildCategoryPath.ts   # Category path building
│   └── formatDuration.ts      # Duration formatting
├── components/                 # React components for Studio
├── validation/                 # Schema validation rules
└── preview/                    # Preview configurations

scripts/                        # Migration and utility scripts
├── extract-youtube-ids.ts     # [DUPLICATE CODE] YouTube ID extraction
├── seed-age-ranges.ts         # Data seeding
└── remove-video-status-field.ts

# Frontend: Next.js application
frontend/
├── src/
│   ├── app/                   # Next.js app router pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── VideoGallery.tsx
│   │   ├── Header.tsx
│   │   └── ThemeProvider.tsx
│   └── lib/                   # Frontend utilities
│       ├── sanity.ts          # [DUPLICATE CODE] Sanity client + YouTube ID extraction
│       └── utils.ts           # General utilities

# Shared/Config (to be created)
utils/                          # [NEW] Shared utilities across all contexts
├── logger.ts                  # [NEW] Centralized logger
├── extractYoutubeId.ts        # [NEW] Consolidated YouTube ID extraction
└── retry.ts                   # [NEW] Retry utility with exponential backoff

config/                         # [NEW] Centralized configuration
├── sanity.ts                  # [NEW] Sanity configuration and client factory
├── constants.ts               # [NEW] App-wide constants
└── env.ts                     # [NEW] Environment variable validation

services/                       # [NEW] External service clients
└── sanity/                    # [NEW] Sanity service wrapper
    ├── client.ts              # [NEW] Sanity client with retry logic
    └── operations.ts          # [NEW] Common Sanity operations

types/                          # [NEW] Shared TypeScript types
└── sanity.ts                  # [NEW] Sanity response/document types
```

**Structure Decision**: 

The codebase follows a web application structure with three main areas:
1. **Sanity Studio** (schemaTypes/) - CMS backend schemas and components
2. **Next.js Frontend** (frontend/) - Public-facing website
3. **Scripts** (scripts/) - Migration and utility scripts

**Key Refactoring Targets**:
- **Duplicate Code**: YouTube ID extraction exists in 3 places (schemaTypes/utils, scripts, frontend/lib)
- **Duplicate Code**: Sanity client initialization scattered across files
- **Missing Structure**: No centralized utils/, config/, services/, or types/ at root level
- **Hardcoded Values**: Project IDs, dataset names embedded in multiple files

**New Structure (to be added)**:
- Create root-level `utils/`, `config/`, `services/`, and `types/` directories
- Consolidate duplicate code into these shared locations
- Both Sanity Studio and frontend will import from shared directories

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Deno runtime requirement | Existing Node.js/TypeScript codebase is stable and production-ready | Migration to Deno would require complete rewrite of Sanity Studio integration, Next.js frontend, and all dependencies. Zero business value for current scope. |
| Telegram bot patterns | CuratedReels is a content management system, not a Telegram bot | The constitution appears written for a different project. The actual codebase is Sanity CMS + Next.js frontend for video content curation. |
