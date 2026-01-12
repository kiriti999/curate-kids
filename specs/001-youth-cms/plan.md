# Implementation Plan: Youth Content CMS with Dynamic Ad Management

**Branch**: `001-youth-cms` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-youth-cms/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a Sanity CMS for curating YouTube videos organized by age-based hierarchical categories (0-2, 2-4, 5-7, 8-9, 10-15, 16+, 18+ as root categories) with dynamic ad placement, affiliate marketing support, comprehensive activity logging, and role-based access control. The system enables admins to manage video content, categories, advertisements, and users through Sanity Studio while maintaining responsive layouts and preparing for future analytics dashboards.

## Technical Context

**Language/Version**: TypeScript 5.8+ with React 19.1  
**Primary Dependencies**: Sanity CMS 5.2.0, Sanity Vision, Styled Components  
**Storage**: Sanity Content Lake (managed cloud storage with real-time sync)  
**Testing**: Sanity schema validation, TypeScript strict mode, ESLint 9.28  
**Target Platform**: Web-based Sanity Studio (cross-browser, responsive)  
**Project Type**: Single CMS application (Sanity Studio)  
**Performance Goals**: 
- Video retrieval by age/category: <1s for 10K videos
- Activity log queries: <2s for 1M entries
- Video metadata extraction: 95% success rate
- Studio load time: <2s initial load

**Constraints**:
- Responsive layout integrity: 320px (mobile) to 1920px (desktop)
- Affiliate click tracking accuracy: 99.9%
- Zero unauthorized access (100% role-based control)
- Age range categories immutable (predefined, cannot be deleted)

**Scale/Scope**:
- Target: 10,000 videos across 7 age ranges
- Expected users: 5-10 admin/editor users initially
- Activity logs: 1M+ entries for analytics
- Ad placements: 50-100 dynamic ads across positions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Single Responsibility Principle (SRP)
✅ **PASS** - Each schema type has ONE clear purpose:
- `video.ts`: Video document structure only
- `category.ts`: Category hierarchy structure only
- `adPlacement.ts`: Advertisement configuration only
- `affiliatePartner.ts`: Affiliate partner metadata only
- `user.ts`: User management and roles only
- `activityLog.ts`: Event logging structure only
- Validation logic in separate `/validation` utilities
- Preview configurations in separate `/preview` utilities

### Open/Closed Principle (OCP)
✅ **PASS** - Extension without modification:
- Schema types use Sanity references (not inheritance)
- Custom fields via Sanity custom components
- Functionality extended via Sanity plugins
- No modification of deployed schemas (only extension via new fields with defaults)

### Liskov Substitution Principle (LSP)
✅ **PASS** - All document types substitutable:
- All documents implement base metadata (createdAt, updatedAt, status)
- Reference fields consistently use `reference` type
- Array fields maintain consistent structure
- Preview configurations follow standard `select/prepare` pattern

### Interface Segregation Principle (ISP)
✅ **PASS** - No unnecessary dependencies:
- Document types expose only required fields
- Optional fields grouped separately (field groups)
- Validation rules per-field (not global)
- Preview selections include only needed fields

### Dependency Inversion Principle (DIP)
✅ **PASS** - Abstractions over implementations:
- All schemas use `defineType` and `defineField` abstractions
- YouTube API access via abstraction layer
- Custom components depend on Sanity component API
- No direct database coupling

### Cyclomatic Complexity Limit: 5
✅ **PASS** - All functions maintain complexity ≤ 5:
- YouTube URL validation: simple regex check (complexity = 1)
- Category path builder: single recursive call (complexity = 2)
- Ad priority resolver: single comparison (complexity = 1)
- All validation functions decomposed to ≤ 4 decision points
- ESLint `complexity` rule enforced at 5

### Quality Gates
✅ **PASS** - All requirements met:
- TypeScript strict mode enabled
- ESLint configured with complexity checks
- Prettier formatting enforced
- Schema types properly typed (no `any` without justification)
- One schema type per file
- Central export via `index.ts`

### Risk Assessment
🟡 **ATTENTION REQUIRED** - Potential complexity in:
1. **Category Path Resolution**: Recursive category hierarchy traversal
   - **Mitigation**: Cache category paths, limit depth to 10 levels
2. **Activity Log Volume**: 1M+ entries may impact query performance
   - **Mitigation**: Use indexed fields (timestamp, actionType, userId), consider log rotation
3. **YouTube Metadata Extraction**: External API dependency
   - **Mitigation**: Graceful fallback to manual entry, cache extracted data

**RE-CHECK REQUIRED**: After Phase 1 data model and contracts are complete

## Project Structure

### Documentation (this feature)

```text
specs/001-youth-cms/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── schemas.json     # OpenAPI/JSON Schema for all document types
│   ├── video.schema.json
│   ├── category.schema.json
│   ├── adPlacement.schema.json
│   ├── affiliatePartner.schema.json
│   ├── user.schema.json
│   └── activityLog.schema.json
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
schemaTypes/
├── index.ts                    # Central schema export
├── blockContent.ts             # Rich text configuration (existing)
├── documents/                  # Document type schemas
│   ├── video.ts               # YouTube video document
│   ├── category.ts            # Age-based hierarchical category
│   ├── adPlacement.ts         # Dynamic advertisement placement
│   ├── affiliatePartner.ts    # Affiliate marketing partner
│   ├── user.ts                # CMS user with roles
│   └── activityLog.ts         # Activity logging for analytics
├── objects/                    # Embedded object types
│   ├── youtubeEmbed.ts        # YouTube URL with validation
│   ├── categoryPath.ts        # Category path with age range
│   ├── adContent.ts           # Ad creative (HTML/image)
│   └── logMetadata.ts         # Structured log context
├── validation/                 # Validation utilities (complexity ≤ 5)
│   ├── youtubeUrl.ts          # YouTube URL validation
│   ├── categoryPath.ts        # Category hierarchy validation
│   ├── adPosition.ts          # Ad position validation
│   └── userRole.ts            # Role permission validation
├── preview/                    # Preview configurations
│   ├── video.ts               # Video preview with thumbnail
│   ├── category.ts            # Category preview with path
│   ├── adPlacement.ts         # Ad preview
│   └── activityLog.ts         # Log entry preview
└── utils/                      # Utility functions
    ├── extractYoutubeId.ts    # Extract video ID from URL
    ├── buildCategoryPath.ts   # Build full category path
    └── formatDuration.ts      # Format video duration

static/
└── icons/                      # Category icons and UI assets
    ├── age-ranges/
    └── categories/

.specify/
├── memory/
│   ├── constitution.md        # Development standards (existing)
│   └── context-copilot.md     # Agent context (to be updated)
└── scripts/
    └── bash/
        └── update-agent-context.sh  # Context updater script

tests/                          # Test suite (future)
├── schemas/
│   ├── video.test.ts
│   ├── category.test.ts
│   └── validation.test.ts
└── integration/
    └── categoryHierarchy.test.ts
```

**Structure Decision**: Single Sanity Studio project with organized schema types. Documents represent top-level content (video, category, ad, user, log), while objects are reusable embedded types. Validation and preview logic separated into dedicated utilities following SRP. This structure supports the CMS-only scope where Sanity Studio is both the editing interface and the data source for a future frontend.

## Complexity Tracking

> **STATUS**: ✅ NO VIOLATIONS - All constitution checks passed. This section tracks potential complexity that requires monitoring during implementation.

### Monitored Complexity Areas

| Area | Current Assessment | Mitigation Strategy | Re-check Trigger |
|------|-------------------|---------------------|------------------|
| Category Path Resolution | Recursive traversal to build full paths | Cache paths, enforce 10-level depth limit | After Phase 1 implementation |
| Activity Log Queries | 1M+ entries may slow queries | Index on timestamp/actionType/userId, consider rotation | After Phase 3 implementation |
| YouTube API Integration | External dependency, rate limits | Graceful fallback, cache responses, manual override | After Phase 1 implementation |

### Complexity Justifications

**None required** - All current design decisions align with constitution complexity limits (cyclomatic complexity ≤ 5).

---

## Phase 0: Research & Technical Decisions

**Goal**: Resolve all NEEDS CLARIFICATION items and establish technical foundations

### Research Tasks

#### 1. Sanity Schema Design Patterns for Hierarchical Data
**Question**: How to efficiently implement age-based category hierarchy with unlimited nesting in Sanity?

**Research Focus**:
- Parent-child reference patterns in Sanity schemas
- Path storage strategies (materialized path vs adjacency list)
- Query performance for hierarchical data retrieval
- Reference integrity for cascade operations

**Deliverable**: Decision on category hierarchy implementation approach

#### 2. YouTube Video Embedding Best Practices
**Question**: What's the optimal approach for extracting and storing YouTube metadata?

**Research Focus**:
- YouTube oEmbed API vs Data API v3
- Rate limiting and caching strategies
- Video ID extraction from various URL formats
- Thumbnail resolution selection
- Graceful degradation when API unavailable

**Deliverable**: YouTube integration strategy with fallback mechanisms

#### 3. Dynamic Ad Positioning Without Layout Breaking
**Question**: How to dynamically inject ads into content grids without breaking responsive layouts?

**Research Focus**:
- CSS Grid and Flexbox strategies for dynamic content insertion
- Ad position calculations for "every N videos" scenarios
- Responsive breakpoint handling (mobile/tablet/desktop)
- Layout shift prevention (CLS optimization)
- Intersection Observer for impression tracking

**Deliverable**: Ad rendering strategy for responsive layouts

#### 4. Activity Logging for Future Analytics
**Question**: What log structure and indexing strategy supports efficient analytics queries?

**Research Focus**:
- Sanity document structure vs external logging service
- Index strategies for time-series data
- Query patterns for common analytics needs
- Log rotation and archival strategies
- JSONB/structured metadata for flexible querying

**Deliverable**: Activity log schema design optimized for analytics

#### 5. Role-Based Access Control in Sanity
**Question**: How to implement granular role-based permissions in Sanity Studio?

**Research Focus**:
- Sanity's built-in role system capabilities
- Custom role definitions and permissions
- Document-level access control patterns
- Field-level permission restrictions
- Admin vs Editor permission boundaries

**Deliverable**: Access control implementation strategy

#### 6. Affiliate Link Tracking and Click Attribution
**Question**: How to accurately track affiliate ad clicks while maintaining privacy?

**Research Focus**:
- Click tracking without third-party cookies
- Session identification strategies
- Impression vs click attribution
- Referrer policy handling
- Privacy-compliant tracking approaches

**Deliverable**: Affiliate tracking implementation plan

### Expected Outcomes (research.md)

```markdown
# Research Findings: Youth Content CMS

## 1. Category Hierarchy Implementation

**Decision**: Materialized path with parent reference hybrid approach

**Rationale**:
- Store both `parentRef` and `fullPath` array on each category
- `fullPath` enables efficient "all children" queries
- `parentRef` maintains referential integrity
- Cache category paths in memory for UI navigation
- 10-level depth limit enforced at schema validation

**Alternatives Considered**:
- Pure adjacency list: Requires recursive queries (slow)
- Pure materialized path: No referential integrity
- Closure table: Overkill for this use case

## 2. YouTube Integration Strategy

**Decision**: YouTube oEmbed API with manual override fallback

**Rationale**:
- oEmbed simpler than Data API (no API key required)
- Automatic metadata extraction (title, thumbnail, embed code)
- Manual fields always available if API fails
- Cache responses in Sanity document
- Video ID extraction via regex (supports multiple URL formats)

**URL Format Support**:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

## 3. Dynamic Ad Positioning

**Decision**: CSS Grid with ad-aware layout algorithm

**Rationale**:
- Frontend calculates ad insertion points based on video count
- "Every N videos" uses modulo math: `if (index % N === 0) insertAd()`
- Ads occupy full grid columns to prevent layout shift
- Responsive breakpoints adjust grid columns (1/2/3/4 cols)
- Intersection Observer tracks impressions when ad enters viewport

**Layout Strategy**:
- Mobile (320-767px): 1 column, ads every 3 videos
- Tablet (768-1023px): 2 columns, ads every 6 videos
- Desktop (1024px+): 3-4 columns, ads every 9-12 videos

## 4. Activity Log Schema

**Decision**: Dedicated Sanity document type with indexed fields

**Rationale**:
- Sanity documents indexed by default on common fields
- Separate document type enables independent querying
- Structured metadata as JSON for flexible analytics
- Filter fields: `actionType`, `userId`, `timestamp`, `resourceType`
- Future migration to dedicated analytics DB if needed

**Index Strategy**:
- Primary: `timestamp` (DESC) for recent activity
- Secondary: `actionType` for filtering by event type
- Composite: `userId + timestamp` for user activity history

## 5. Role-Based Access Control

**Decision**: Sanity's built-in role system with custom role definitions

**Rationale**:
- Admin role: Full access to all document types
- Editor role: Read/write videos and categories only (no users, ads, logs)
- Sanity's document-level permissions handle access control
- Custom validation ensures only admins can modify users

**Permission Matrix**:
| Document Type | Admin | Editor |
|--------------|-------|--------|
| Video | CRUD | CRUD |
| Category | CRUD | CRUD |
| Ad Placement | CRUD | None |
| Affiliate Partner | CRUD | None |
| User | CRUD | None |
| Activity Log | Read | None |

## 6. Affiliate Click Tracking

**Decision**: Server-side redirect with activity log entry

**Rationale**:
- Frontend generates tracking URL: `/track/click/{adId}`
- Server logs click event to activity log
- Server redirects to affiliate tracking URL
- No third-party cookies required
- Session ID from client provides attribution

**Click Flow**:
1. User clicks ad → `/track/click/{adId}?session={sessionId}`
2. Server creates activity log entry (click event)
3. Server responds with 302 redirect to affiliate URL
4. Affiliate URL includes their tracking parameters
```

### Research Completion Criteria

- [ ] All 6 research questions answered with concrete decisions
- [ ] Alternatives documented with rejection rationale
- [ ] Technical approach validated against constitution (complexity ≤ 5)
- [ ] research.md file created with all findings
- [ ] No NEEDS CLARIFICATION items remaining

---

## Phase 1: Data Model & Contracts

**Goal**: Define complete data structures and API contracts

**Prerequisites**: Phase 0 research.md completed

### 1.1 Data Model Design (data-model.md)

#### Entity: Video

```typescript
interface Video {
  _id: string
  _type: 'video'
  _createdAt: string
  _updatedAt: string
  
  // Core fields
  title: string                    // Manual override or extracted
  slug: { current: string }        // Auto-generated from title
  youtubeUrl: string              // Full YouTube URL (validated)
  youtubeId: string               // Extracted video ID
  description?: string            // Manual or extracted
  thumbnail?: string              // Manual override or YouTube default
  duration?: number               // Seconds (from YouTube)
  
  // Categorization
  category: Reference<Category>   // Leaf category only (required)
  categoryPath: string[]          // Computed from category reference
  ageRange: string                // Computed from category root
  
  // Metadata
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  tags?: string[]
  
  // Analytics
  viewCount?: number              // Future: tracked via activity logs
}
```

**Validation Rules**:
- `youtubeUrl`: Must match YouTube URL regex
- `youtubeId`: Auto-extracted, read-only
- `category`: Must reference a leaf category (no children)
- `status`: Defaults to 'draft'

#### Entity: Category

```typescript
interface Category {
  _id: string
  _type: 'category'
  _createdAt: string
  _updatedAt: string
  
  // Core fields
  name: string                    // e.g., "Math", "Education", "5-7 years"
  slug: { current: string }       // URL-safe name
  description?: string
  icon?: Image                    // Category icon/image
  
  // Hierarchy
  ageRange: '0-2' | '2-4' | '5-7' | '8-9' | '10-15' | '16+' | '18+'
  parent?: Reference<Category>    // Null for age range roots
  fullPath: string[]              // Materialized path: ["5-7 years", "Education", "Math"]
  depth: number                   // 0 for age ranges, 1+ for content categories
  isAgeRangeRoot: boolean         // True for predefined age ranges
  
  // Computed/cached
  childCount?: number             // Number of direct children
  videoCount?: number             // Number of videos in this category
  
  // Metadata
  sortOrder?: number              // Custom ordering within siblings
}
```

**Validation Rules**:
- `ageRange`: Required, must match predefined values
- `parent`: Required if `isAgeRangeRoot === false`
- `isAgeRangeRoot`: Immutable once set
- `depth`: Auto-calculated from parent depth + 1
- `fullPath`: Auto-built from parent chain
- Deletion blocked if `childCount > 0 || videoCount > 0`

**Age Range Seeds** (pre-populated, immutable):
```json
[
  { "name": "0-2 years", "ageRange": "0-2", "isAgeRangeRoot": true, "depth": 0 },
  { "name": "2-4 years", "ageRange": "2-4", "isAgeRangeRoot": true, "depth": 0 },
  { "name": "5-7 years", "ageRange": "5-7", "isAgeRangeRoot": true, "depth": 0 },
  { "name": "8-9 years", "ageRange": "8-9", "isAgeRangeRoot": true, "depth": 0 },
  { "name": "10-15 years", "ageRange": "10-15", "isAgeRangeRoot": true, "depth": 0 },
  { "name": "16+ years", "ageRange": "16+", "isAgeRangeRoot": true, "depth": 0 },
  { "name": "18+ years", "ageRange": "18+", "isAgeRangeRoot": true, "depth": 0 }
]
```

#### Entity: AdPlacement

```typescript
interface AdPlacement {
  _id: string
  _type: 'adPlacement'
  _createdAt: string
  _updatedAt: string
  
  // Core fields
  name: string                    // Admin reference name
  type: 'banner' | 'affiliate' | 'native'
  position: 'header' | 'footer' | 'sidebar' | 'inline' | 'floating'
  
  // Content
  content: AdContent              // HTML/JS embed or image with link
  
  // Targeting
  ageRanges?: string[]            // Show only for specific age ranges
  priority: number                // Higher = shown first (1-100)
  
  // Scheduling
  status: 'active' | 'inactive' | 'scheduled'
  startDate?: string
  endDate?: string
  
  // Inline positioning
  inlinePosition?: {
    everyNVideos: number          // Show after every N videos
    offsetStart: number           // Start after N videos
  }
  
  // Affiliate linking
  affiliatePartner?: Reference<AffiliatePartner>
  
  // Analytics
  impressionCount?: number        // Tracked via activity logs
  clickCount?: number            // Tracked via activity logs
}

interface AdContent {
  contentType: 'html' | 'image'
  htmlCode?: string               // HTML/JS embed code
  imageUrl?: string              // Image source
  linkUrl?: string               // Click destination
  altText?: string               // Image alt text
}
```

**Validation Rules**:
- `priority`: 1-100 range
- `position`: Required
- `content.htmlCode` OR `content.imageUrl`: At least one required
- `inlinePosition`: Required if `position === 'inline'`

#### Entity: AffiliatePartner

```typescript
interface AffiliatePartner {
  _id: string
  _type: 'affiliatePartner'
  _createdAt: string
  _updatedAt: string
  
  // Core fields
  name: string                    // Partner name
  contactEmail?: string
  trackingUrlTemplate: string     // e.g., "https://partner.com/track?id={adId}&session={sessionId}"
  
  // Financial
  commissionRate?: number         // Percentage
  paymentTerms?: string
  
  // Status
  status: 'active' | 'inactive' | 'pending'
  
  // Analytics (aggregated)
  totalImpressions?: number
  totalClicks?: number
  conversionRate?: number         // Calculated: clicks/impressions
}
```

#### Entity: User

```typescript
interface User {
  _id: string
  _type: 'user'
  _createdAt: string
  _updatedAt: string
  
  // Core fields
  name: string
  email: string                   // Unique
  role: 'admin' | 'editor'
  
  // Access control
  status: 'active' | 'inactive'
  addedBy: Reference<User>        // Admin who added this user
  
  // Metadata
  lastLoginAt?: string
  loginCount?: number
}
```

**Validation Rules**:
- `email`: Must be valid email format, unique
- `role`: Required, immutable after creation
- `addedBy`: Required, must reference admin user
- Self-deletion blocked (cannot delete own account)

#### Entity: ActivityLog

```typescript
interface ActivityLog {
  _id: string
  _type: 'activityLog'
  _createdAt: string              // Log timestamp
  
  // Core fields
  actionType: string              // e.g., "video.view", "ad.click", "user.login", "category.create"
  userId?: Reference<User>        // Null for anonymous actions
  sessionId?: string              // Client session identifier
  ipAddress?: string              // Anonymized for privacy
  
  // Resource reference
  resourceType?: string           // e.g., "video", "ad", "category"
  resourceId?: string             // Document _id
  
  // Contextual metadata (flexible JSON)
  metadata?: {
    videoId?: string
    categoryPath?: string[]
    ageRange?: string
    adPosition?: string
    duration?: number             // For video views
    clickDestination?: string     // For ad clicks
    previousValue?: any           // For updates
    newValue?: any               // For updates
    [key: string]: any
  }
}
```

**Validation Rules**:
- `actionType`: Required, follows pattern `{resource}.{action}`
- `_createdAt`: Auto-generated, indexed for time queries
- `metadata`: Optional, validated as valid JSON

**Common Action Types**:
- `video.create`, `video.update`, `video.delete`, `video.view`
- `category.create`, `category.update`, `category.delete`, `category.navigate`
- `ad.impression`, `ad.click`
- `user.login`, `user.logout`, `user.create`, `user.deactivate`

### 1.2 API Contracts (contracts/)

#### Video Schema (video.schema.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Video",
  "type": "object",
  "required": ["title", "youtubeUrl", "category", "status"],
  "properties": {
    "_id": { "type": "string" },
    "_type": { "const": "video" },
    "title": { "type": "string", "minLength": 1, "maxLength": 200 },
    "slug": {
      "type": "object",
      "properties": {
        "current": { "type": "string", "pattern": "^[a-z0-9-]+$" }
      }
    },
    "youtubeUrl": {
      "type": "string",
      "pattern": "^(https?://)?(www\\.)?(youtube\\.com/watch\\?v=|youtu\\.be/)[a-zA-Z0-9_-]{11}"
    },
    "youtubeId": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9_-]{11}$",
      "readOnly": true
    },
    "description": { "type": "string", "maxLength": 5000 },
    "thumbnail": { "type": "string", "format": "uri" },
    "duration": { "type": "integer", "minimum": 0 },
    "category": {
      "type": "object",
      "properties": {
        "_ref": { "type": "string" },
        "_type": { "const": "reference" }
      }
    },
    "status": {
      "type": "string",
      "enum": ["draft", "published", "archived"],
      "default": "draft"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 20
    }
  }
}
```

#### Category Schema (category.schema.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Category",
  "type": "object",
  "required": ["name", "ageRange", "depth", "isAgeRangeRoot"],
  "properties": {
    "_id": { "type": "string" },
    "_type": { "const": "category" },
    "name": { "type": "string", "minLength": 1, "maxLength": 100 },
    "slug": {
      "type": "object",
      "properties": {
        "current": { "type": "string", "pattern": "^[a-z0-9-]+$" }
      }
    },
    "description": { "type": "string", "maxLength": 500 },
    "ageRange": {
      "type": "string",
      "enum": ["0-2", "2-4", "5-7", "8-9", "10-15", "16+", "18+"]
    },
    "parent": {
      "type": "object",
      "properties": {
        "_ref": { "type": "string" },
        "_type": { "const": "reference" }
      }
    },
    "fullPath": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "maxItems": 10
    },
    "depth": {
      "type": "integer",
      "minimum": 0,
      "maximum": 10
    },
    "isAgeRangeRoot": {
      "type": "boolean",
      "default": false
    },
    "sortOrder": {
      "type": "integer",
      "minimum": 0
    }
  }
}
```

#### AdPlacement Schema (adPlacement.schema.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AdPlacement",
  "type": "object",
  "required": ["name", "type", "position", "priority", "status"],
  "properties": {
    "_id": { "type": "string" },
    "_type": { "const": "adPlacement" },
    "name": { "type": "string", "minLength": 1, "maxLength": 100 },
    "type": {
      "type": "string",
      "enum": ["banner", "affiliate", "native"]
    },
    "position": {
      "type": "string",
      "enum": ["header", "footer", "sidebar", "inline", "floating"]
    },
    "content": {
      "type": "object",
      "properties": {
        "contentType": {
          "type": "string",
          "enum": ["html", "image"]
        },
        "htmlCode": { "type": "string" },
        "imageUrl": { "type": "string", "format": "uri" },
        "linkUrl": { "type": "string", "format": "uri" },
        "altText": { "type": "string" }
      },
      "required": ["contentType"],
      "oneOf": [
        { "required": ["htmlCode"] },
        { "required": ["imageUrl"] }
      ]
    },
    "priority": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "status": {
      "type": "string",
      "enum": ["active", "inactive", "scheduled"],
      "default": "inactive"
    },
    "ageRanges": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["0-2", "2-4", "5-7", "8-9", "10-15", "16+", "18+"]
      }
    },
    "inlinePosition": {
      "type": "object",
      "properties": {
        "everyNVideos": { "type": "integer", "minimum": 1 },
        "offsetStart": { "type": "integer", "minimum": 0 }
      }
    }
  }
}
```

### 1.3 Quickstart Guide (quickstart.md)

```markdown
# Youth Content CMS - Quickstart Guide

## Prerequisites

- Node.js 18+ and pnpm installed
- Sanity account and project created

## Installation

\`\`\`bash
# Install dependencies
pnpm install

# Start Sanity Studio locally
pnpm dev
\`\`\`

Studio runs at `http://localhost:3333`

## Initial Setup

### 1. Age Range Categories (Pre-populated)

Seven age ranges are automatically created as root categories:
- 0-2 years
- 2-4 years
- 5-7 years
- 8-9 years
- 10-15 years
- 16+ years
- 18+ years

These CANNOT be deleted or modified.

### 2. Create Content Categories

1. Go to "Categories" in Studio
2. Click "Create new Category"
3. Fill in:
   - Name: "Education"
   - Age Range: Select "5-7 years" from dropdown
   - Description: "Educational content for 5-7 year olds"
   - Icon: Upload category icon (optional)
4. Click "Publish"

### 3. Create Subcategories

1. Create another category:
   - Name: "Math"
   - Age Range: "5-7 years" (same as parent)
   - Parent: Select "Education" category
   - Description: "Math videos for early learners"
2. Publish

Result: Hierarchy is "5-7 years → Education → Math"

### 4. Add Your First Video

1. Go to "Videos" in Studio
2. Click "Create new Video"
3. Fill in:
   - YouTube URL: Paste full URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
   - Title: Auto-filled, but you can override
   - Description: Auto-filled or custom
   - Category: Select "Math" (under 5-7 years → Education)
   - Status: Change to "Published"
4. Click "Publish"

### 5. Create an Ad Placement

1. Go to "Ad Placements"
2. Click "Create new Ad Placement"
3. Configure:
   - Name: "Header Banner"
   - Type: "Banner"
   - Position: "Header"
   - Priority: 10
   - Content Type: "Image"
   - Image URL: Your ad image URL
   - Link URL: Where ad should link
   - Status: "Active"
4. Publish

### 6. Add Admin Users

1. Go to "Users"
2. Click "Create new User"
3. Fill in:
   - Name: "Jane Editor"
   - Email: "jane@example.com"
   - Role: "Editor" (or "Admin")
   - Status: "Active"
4. Publish

## Key Concepts

### Category Hierarchy

- **Age ranges are roots**: All content lives under an age range
- **Unlimited nesting**: Create as many subcategory levels as needed
- **Leaf categories**: Videos can only be assigned to categories without children
- **Path display**: Full path always shown (e.g., "5-7 years → Education → Math → Basic Addition")

### Video Management

- **YouTube URLs**: System extracts video ID, title, thumbnail automatically
- **Manual override**: All auto-filled fields can be manually edited
- **Status workflow**: Draft → Published → Archived
- **Category assignment**: Videos assigned to ONE leaf category

### Ad Positioning

- **Static positions**: Header, Footer, Sidebar (one ad per position)
- **Dynamic inline**: Ads inserted every N videos in content grid
- **Priority**: Higher priority ads shown first when multiple target same position
- **Age targeting**: Optionally target ads to specific age ranges

### Activity Logs

- **Automatic**: All actions logged automatically
- **Read-only**: Logs cannot be edited or deleted via Studio
- **Analytics ready**: Structured for future dashboard integration

## Common Tasks

### Move a Video to Different Category

1. Open video document
2. Change "Category" reference to new category
3. Publish (old category automatically updated)

### Delete a Category

Requirements:
- No videos assigned to category
- No child categories

If blocked, reassign videos and delete/move child categories first.

### Deactivate an Ad

1. Open ad placement document
2. Change "Status" to "Inactive"
3. Publish (ad immediately stops showing)

### View Activity Logs

1. Go to "Activity Logs"
2. Use filters:
   - Action Type (e.g., "video.view", "ad.click")
   - Date range
   - User
3. Export for analytics (future feature)

## Troubleshooting

**Video won't save**: Check that category is a leaf (no children)
**YouTube metadata not loading**: Paste URL and wait 2-3 seconds, or enter manually
**Can't delete category**: Ensure no videos assigned and no child categories exist
**Ad not showing**: Check status is "Active" and age range targeting (if set)
\`\`\`

### 1.4 Update Agent Context

Run the agent context update script to add Sanity-specific context:

```bash
cd /Users/arjun/curatekids
.specify/scripts/bash/update-agent-context.sh copilot
```

This updates `.specify/memory/context-copilot.md` with:
- Sanity CMS 5.2.0 schema patterns
- TypeScript schema definitions
- React 19.1 component context
- Category hierarchy implementation notes

### Phase 1 Completion Criteria

- [ ] data-model.md created with all 6 entities fully specified
- [ ] contracts/ directory created with 6 JSON schema files
- [ ] quickstart.md created with setup and usage instructions
- [ ] Agent context updated with Sanity-specific technologies
- [ ] All entity relationships documented
- [ ] All validation rules specified
- [ ] Constitution re-check passed (complexity ≤ 5)

---

## Phase 2: Implementation Tasks (Generated by /speckit.tasks)

**Status**: NOT STARTED - This phase is executed by the `/speckit.tasks` command

This command will generate `tasks.md` with:
- Atomic implementation tasks based on data model
- Task dependencies and execution order
- Acceptance criteria per task
- Estimated complexity per task

**Phase 2 is outside the scope of the `/speckit.plan` command.**

---

## Migration Plan

### Remove Existing Movie Schema

**Status**: ✅ NO ACTION REQUIRED - No movie schemas exist in current codebase

Verification performed:
- Searched for movie/screening/person/cast/crew references
- Only found references in README (template boilerplate)
- `schemaTypes/` directory clean (only blockContent.ts)

### Setup Initial Age Range Categories

**Approach**: Sanity CLI script or Studio initialization hook

**Script**: `scripts/seed-age-ranges.ts`

```typescript
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '3rcl6ir9',
  dataset: 'production',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const ageRanges = [
  { name: '0-2 years', ageRange: '0-2', slug: '0-2-years' },
  { name: '2-4 years', ageRange: '2-4', slug: '2-4-years' },
  { name: '5-7 years', ageRange: '5-7', slug: '5-7-years' },
  { name: '8-9 years', ageRange: '8-9', slug: '8-9-years' },
  { name: '10-15 years', ageRange: '10-15', slug: '10-15-years' },
  { name: '16+ years', ageRange: '16+', slug: '16-plus-years' },
  { name: '18+ years', ageRange: '18+', slug: '18-plus-years' },
]

async function seedAgeRanges() {
  for (const ageRange of ageRanges) {
    await client.create({
      _type: 'category',
      name: ageRange.name,
      slug: { current: ageRange.slug },
      ageRange: ageRange.ageRange,
      isAgeRangeRoot: true,
      depth: 0,
      fullPath: [ageRange.name],
      description: `Content curated for children aged ${ageRange.ageRange}`,
    })
  }
  console.log('Age range categories created successfully')
}

seedAgeRanges()
```

**Execution**:
```bash
SANITY_TOKEN=your_token npx tsx scripts/seed-age-ranges.ts
```

### Sample Data Structure

**Example Category Hierarchy**:
```
5-7 years (Root, Depth 0)
├── Education (Depth 1)
│   ├── Math (Depth 2)
│   │   ├── Basic Addition (Depth 3) ← Leaf category (videos go here)
│   │   └── Counting (Depth 3) ← Leaf category
│   ├── Science (Depth 2)
│   │   └── Animals (Depth 3) ← Leaf category
│   └── Reading (Depth 2) ← Leaf category (no children)
└── Entertainment (Depth 1)
    ├── Stories (Depth 2) ← Leaf category
    └── Music (Depth 2) ← Leaf category
```

**Sample Video Data**:
```json
{
  "_type": "video",
  "title": "Counting to 10 with Blocks",
  "youtubeUrl": "https://www.youtube.com/watch?v=SAMPLE123",
  "youtubeId": "SAMPLE123",
  "category": {"_ref": "category-5-7-edu-math-counting-id"},
  "status": "published",
  "description": "Learn to count from 1 to 10 using colorful blocks",
  "tags": ["counting", "numbers", "blocks"]
}
```

---

## Key Technical Decisions Summary

### 1. Category Parent-Child Relationships
**Decision**: Hybrid approach with both `parent` reference and `fullPath` materialized path
**Rationale**: Combines referential integrity (parent ref) with query performance (fullPath array)

### 2. YouTube Video ID Extraction and Validation
**Decision**: Regex-based extraction with oEmbed API fallback for metadata
**Rationale**: No API key required, supports multiple URL formats, graceful manual override

### 3. Ad Position Management Without Breaking Layouts
**Decision**: Frontend calculates insertion points using modulo math, ads occupy full grid columns
**Rationale**: Prevents layout shift (CLS), responsive across breakpoints, predictable positioning

### 4. Activity Log Structure for Future Analytics
**Decision**: Dedicated Sanity document type with indexed fields and flexible JSON metadata
**Rationale**: Queryable within Sanity, structured for analytics, future migration path to dedicated DB

### 5. Affiliate Link Tracking Approach
**Decision**: Server-side redirect with activity log entry capturing click events
**Rationale**: Accurate tracking, privacy-compliant (no third-party cookies), session attribution

---

## Success Metrics Alignment

| Spec Success Criteria | Implementation Approach | Verification Method |
|-----------------------|------------------------|---------------------|
| SC-001: Add video <2min | Simple form with YouTube URL, auto-extract metadata | Manual test: time from click to publish |
| SC-002: Responsive layout integrity | CSS Grid with ad-aware layout, CLS prevention | Lighthouse audit + manual viewport testing |
| SC-003: Video retrieval <1s (10K videos) | Indexed category references, cached paths | Load test with 10K documents |
| SC-004: 100% action logging | Activity log created via Sanity hooks/webhooks | Audit log coverage analysis |
| SC-005: 99.9% click tracking accuracy | Server-side redirect logging | Compare logs to affiliate reports |
| SC-006: Configure ad <3min | Simple ad form with preview | Manual test: time from click to active |
| SC-007: 100% unauthorized access prevention | Sanity role system + custom validation | Security audit + penetration test |
| SC-008: Activity log queries <2s (1M entries) | Indexed timestamp/actionType/userId | Load test with 1M log documents |
| SC-009: 95% metadata extraction success | YouTube oEmbed API with manual fallback | Track extraction success rate in logs |
| SC-010: Zero movie schema references | Verification complete (no movies found) | ✅ PASSED |
| SC-011: 3-click navigation to video | Age range → Category → Subcategory → Videos | User testing + click tracking |
| SC-012: Display full category path | Breadcrumb UI using fullPath array | UI review + accessibility audit |

---

## Next Steps

1. **Complete Phase 0 Research** (if not already done):
   - Generate `research.md` with all technical decisions documented
   - Resolve any remaining NEEDS CLARIFICATION items

2. **Complete Phase 1 Artifacts** (this command's output):
   - ✅ `plan.md` (this file)
   - Generate `research.md` 
   - Generate `data-model.md`
   - Generate `contracts/` directory with JSON schemas
   - Generate `quickstart.md`
   - Run agent context update script

3. **Execute Phase 2** (separate command):
   - Run `/speckit.tasks` to generate `tasks.md`
   - Begin implementation of schema types
   - Set up validation utilities
   - Create preview configurations
   - Seed age range categories

4. **Implementation Phases** (Post-Planning):
   - Phase 1: Core schema setup (video, category, user)
   - Phase 2: Ad management (adPlacement, affiliatePartner)
   - Phase 3: Activity logging (activityLog, tracking hooks)
   - Phase 4: Access control (role validation, permissions)
   - Phase 5: Data validation and business rules

---

**Plan Status**: ✅ COMPLETE  
**Branch**: `001-youth-cms`  
**Generated**: 2026-01-10  
**Ready for**: Phase 0 Research Execution
