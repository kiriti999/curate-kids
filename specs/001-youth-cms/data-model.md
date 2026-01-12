# Data Model Design: Youth Content CMS

**Date**: 2026-01-10  
**Branch**: `001-youth-cms`  
**Phase**: Phase 1 - Data Model & Contracts

This document defines the complete data model for the Youth Content CMS, including all entities, relationships, validation rules, and computed fields.

---

## Entity Relationship Diagram

```
┌─────────────────┐
│  Category       │◄────────┐
│  (Age Ranges)   │         │
└────────┬────────┘         │
         │ 1                │
         │                  │ parent
         │ *                │ (self-ref)
         │                  │
         │         ┌────────┴────────┐
         │         │  Category       │
         │         │  (Content Cats) │
         │         └────────┬────────┘
         │                  │ 1
         │                  │
         │ category         │ *
         │                  │
┌────────▼────────┐         │
│     Video       │─────────┘
└─────────────────┘

┌─────────────────┐         ┌──────────────────┐
│  AdPlacement    │────────►│ AffiliatePartner │
└─────────────────┘  0..*   └──────────────────┘
                      1

┌─────────────────┐         ┌──────────────────┐
│      User       │◄────────│       User       │
│    (addedBy)    │  1      │   (self-ref)     │
└─────────────────┘    *    └──────────────────┘

┌─────────────────┐
│  ActivityLog    │────────► Video | Category | Ad | User
│                 │  0..*    (resource reference)
└─────────────────┘
```

---

## Entity Definitions

### 1. Video

**Purpose**: Represents a YouTube video curated for a specific age group and category

**Schema Definition**:

```typescript
interface Video {
  // System fields
  _id: string                      // Auto-generated: video-{uuid}
  _type: 'video'                   // Constant
  _createdAt: string               // ISO 8601 timestamp (auto)
  _updatedAt: string               // ISO 8601 timestamp (auto)
  _rev: string                     // Revision ID (auto)
  
  // Core identification
  title: string                    // REQUIRED | Max 200 chars
  slug: {                          // REQUIRED | Auto-generated from title
    current: string                // URL-safe slug (unique)
    _type: 'slug'
  }
  
  // YouTube integration
  youtubeUrl: string               // REQUIRED | Full YouTube URL
  youtubeId: string                // REQUIRED | Extracted video ID (11 chars)
  description?: string             // Optional | Max 5000 chars | Rich text
  thumbnail?: string               // Optional | URL | Default from YouTube
  duration?: number                // Optional | Seconds | From YouTube API
  
  // Categorization
  category: {                      // REQUIRED | Reference to leaf category
    _ref: string                   // Category document ID
    _type: 'reference'
    _weak?: boolean                // Optional weak reference
  }
  categoryPath?: string[]          // COMPUTED | Full path from age range
  ageRange?: string                // COMPUTED | From category root
  
  // Publishing workflow
  status: 'draft' | 'published' | 'archived'  // REQUIRED | Default: draft
  publishedAt?: string             // ISO 8601 | Set when status → published
  
  // Metadata
  tags?: string[]                  // Optional | Max 20 tags
  notes?: string                   // Optional | Admin notes (not public)
  
  // Analytics (future)
  viewCount?: number               // Optional | Aggregated from activity logs
  lastViewedAt?: string            // Optional | ISO 8601
}
```

**Validation Rules**:

| Field | Rule | Error Message |
|-------|------|---------------|
| `title` | Required, 1-200 chars | "Title is required and must be under 200 characters" |
| `youtubeUrl` | Required, matches YouTube URL regex | "Please enter a valid YouTube URL" |
| `youtubeId` | Auto-extracted, read-only | N/A |
| `slug.current` | Unique across all videos | "A video with this slug already exists" |
| `category` | Required, must reference leaf category | "Please select a category without subcategories" |
| `status` | Required, one of enum values | "Status must be draft, published, or archived" |
| `tags` | Max 20 items | "Maximum 20 tags allowed" |

**Computed Fields**:

```typescript
// categoryPath: Built from category reference chain
function computeCategoryPath(categoryRef: string): string[] {
  const category = fetchCategory(categoryRef)
  return category.fullPath  // Use pre-computed path from category
}

// ageRange: Extracted from category
function computeAgeRange(categoryRef: string): string {
  const category = fetchCategory(categoryRef)
  return category.ageRange
}

// publishedAt: Set automatically on status change
function onStatusChange(newStatus: string, currentPublishedAt?: string): string | undefined {
  if (newStatus === 'published' && !currentPublishedAt) {
    return new Date().toISOString()
  }
  return currentPublishedAt  // Preserve original publish date
}
```

**Indexes** (for query performance):

```groq
// Primary queries
*[_type == "video" && status == "published"] | order(publishedAt desc)
*[_type == "video" && category._ref == $categoryId]
*[_type == "video" && $ageRange in categoryPath]
```

**Example Document**:

```json
{
  "_id": "video-123abc",
  "_type": "video",
  "_createdAt": "2026-01-10T12:00:00Z",
  "_updatedAt": "2026-01-10T14:30:00Z",
  "title": "Learn Basic Addition with Blocks",
  "slug": {
    "current": "learn-basic-addition-with-blocks",
    "_type": "slug"
  },
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "youtubeId": "dQw4w9WgXcQ",
  "description": "This video teaches children ages 5-7 how to add single-digit numbers using colorful blocks.",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "duration": 180,
  "category": {
    "_ref": "category-5-7-edu-math-addition",
    "_type": "reference"
  },
  "categoryPath": ["5-7 years", "Education", "Math", "Basic Addition"],
  "ageRange": "5-7",
  "status": "published",
  "publishedAt": "2026-01-10T14:30:00Z",
  "tags": ["math", "addition", "blocks", "counting"]
}
```

---

### 2. Category

**Purpose**: Represents nodes in the age-based hierarchical category tree

**Schema Definition**:

```typescript
interface Category {
  // System fields
  _id: string                      // Auto-generated: category-{uuid}
  _type: 'category'
  _createdAt: string
  _updatedAt: string
  _rev: string
  
  // Core identification
  name: string                     // REQUIRED | Max 100 chars | "Math", "5-7 years"
  slug: {                          // REQUIRED | Auto-generated from name
    current: string                // URL-safe slug (unique within parent)
    _type: 'slug'
  }
  description?: string             // Optional | Max 500 chars
  icon?: {                         // Optional | Category icon/image
    _type: 'image'
    asset: {
      _ref: string                 // Reference to Sanity image asset
      _type: 'reference'
    }
    hotspot?: {
      x: number
      y: number
      height: number
      width: number
    }
  }
  
  // Hierarchy structure
  ageRange: '0-2' | '2-4' | '5-7' | '8-9' | '10-15' | '16+' | '18+'  // REQUIRED
  parent?: {                       // REQUIRED if !isAgeRangeRoot
    _ref: string                   // Parent category ID
    _type: 'reference'
  }
  fullPath: string[]               // REQUIRED | COMPUTED | ["5-7 years", "Education", "Math"]
  depth: number                    // REQUIRED | COMPUTED | 0 for age ranges, 1+ for others
  isAgeRangeRoot: boolean          // REQUIRED | Immutable | true for 7 age ranges
  
  // Relationships (computed/cached)
  childCount?: number              // COMPUTED | Number of direct children
  videoCount?: number              // COMPUTED | Number of videos in this category
  hasChildren?: boolean            // COMPUTED | Alias for childCount > 0
  isLeaf?: boolean                 // COMPUTED | Alias for !hasChildren
  
  // Display ordering
  sortOrder?: number               // Optional | Custom sort within siblings (0-999)
  
  // Metadata
  isVisible?: boolean              // Optional | Default true | Hide from frontend
  notes?: string                   // Optional | Admin notes
}
```

**Validation Rules**:

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required, 1-100 chars | "Category name is required" |
| `ageRange` | Required, must be one of 7 predefined values | "Please select an age range" |
| `parent` | Required if `isAgeRangeRoot === false` | "Non-root categories must have a parent" |
| `parent.ageRange` | Must match category's `ageRange` | "Parent must be in same age range" |
| `depth` | Max 10 levels | "Maximum category depth (10 levels) exceeded" |
| `isAgeRangeRoot` | Immutable after creation | "Cannot change age range root status" |
| Deletion | Blocked if `childCount > 0 || videoCount > 0` | "Cannot delete category with videos or subcategories" |

**Computed Fields**:

```typescript
// fullPath: Built from parent chain (recursive)
function computeFullPath(category: Category): string[] {
  if (!category.parent) {
    return [category.name]  // Root category
  }
  const parent = fetchCategory(category.parent._ref)
  return [...parent.fullPath, category.name]
}

// depth: Distance from age range root
function computeDepth(category: Category): number {
  if (category.isAgeRangeRoot) return 0
  const parent = fetchCategory(category.parent._ref)
  return parent.depth + 1
}

// childCount: Number of categories with this as parent
function computeChildCount(categoryId: string): number {
  return count(*[_type == "category" && parent._ref == ^._id])
}

// videoCount: Number of videos assigned to this category
function computeVideoCount(categoryId: string): number {
  return count(*[_type == "video" && category._ref == ^._id])
}

// hasChildren / isLeaf: Derived from childCount
const hasChildren = childCount > 0
const isLeaf = childCount === 0
```

**Age Range Seeds** (pre-populated, immutable):

```json
[
  {
    "_id": "category-age-0-2",
    "_type": "category",
    "name": "0-2 years",
    "slug": { "current": "0-2-years" },
    "ageRange": "0-2",
    "isAgeRangeRoot": true,
    "depth": 0,
    "fullPath": ["0-2 years"],
    "description": "Content for infants and toddlers (0-2 years old)"
  },
  {
    "_id": "category-age-2-4",
    "_type": "category",
    "name": "2-4 years",
    "slug": { "current": "2-4-years" },
    "ageRange": "2-4",
    "isAgeRangeRoot": true,
    "depth": 0,
    "fullPath": ["2-4 years"],
    "description": "Content for preschoolers (2-4 years old)"
  },
  {
    "_id": "category-age-5-7",
    "_type": "category",
    "name": "5-7 years",
    "slug": { "current": "5-7-years" },
    "ageRange": "5-7",
    "isAgeRangeRoot": true,
    "depth": 0,
    "fullPath": ["5-7 years"],
    "description": "Content for early elementary (5-7 years old)"
  },
  {
    "_id": "category-age-8-9",
    "_type": "category",
    "name": "8-9 years",
    "slug": { "current": "8-9-years" },
    "ageRange": "8-9",
    "isAgeRangeRoot": true,
    "depth": 0,
    "fullPath": ["8-9 years"],
    "description": "Content for middle elementary (8-9 years old)"
  },
  {
    "_id": "category-age-10-15",
    "_type": "category",
    "name": "10-15 years",
    "slug": { "current": "10-15-years" },
    "ageRange": "10-15",
    "isAgeRangeRoot": true,
    "depth": 0,
    "fullPath": ["10-15 years"],
    "description": "Content for pre-teens and early teens (10-15 years old)"
  },
  {
    "_id": "category-age-16-plus",
    "_type": "category",
    "name": "16+ years",
    "slug": { "current": "16-plus-years" },
    "ageRange": "16+",
    "isAgeRangeRoot": true,
    "depth": 0,
    "fullPath": ["16+ years"],
    "description": "Content for older teens (16+ years old)"
  },
  {
    "_id": "category-age-18-plus",
    "_type": "category",
    "name": "18+ years",
    "slug": { "current": "18-plus-years" },
    "ageRange": "18+",
    "isAgeRangeRoot": true,
    "depth": 0,
    "fullPath": ["18+ years"],
    "description": "Content for adults (18+ years old)"
  }
]
```

**Example Document** (Content Category):

```json
{
  "_id": "category-5-7-edu-math",
  "_type": "category",
  "_createdAt": "2026-01-10T10:00:00Z",
  "name": "Math",
  "slug": { "current": "math" },
  "description": "Math videos for early learners",
  "icon": {
    "_type": "image",
    "asset": {
      "_ref": "image-abc123",
      "_type": "reference"
    }
  },
  "ageRange": "5-7",
  "parent": {
    "_ref": "category-5-7-education",
    "_type": "reference"
  },
  "fullPath": ["5-7 years", "Education", "Math"],
  "depth": 2,
  "isAgeRangeRoot": false,
  "childCount": 3,
  "videoCount": 0,
  "hasChildren": true,
  "isLeaf": false,
  "sortOrder": 10,
  "isVisible": true
}
```

---

### 3. AdPlacement

**Purpose**: Represents a dynamically placed advertisement with targeting and scheduling

**Schema Definition**:

```typescript
interface AdPlacement {
  // System fields
  _id: string                      // Auto-generated: ad-{uuid}
  _type: 'adPlacement'
  _createdAt: string
  _updatedAt: string
  _rev: string
  
  // Core identification
  name: string                     // REQUIRED | Max 100 chars | Admin reference name
  
  // Ad configuration
  type: 'banner' | 'affiliate' | 'native'  // REQUIRED
  position: 'header' | 'footer' | 'sidebar' | 'inline' | 'floating'  // REQUIRED
  
  // Content definition
  content: {                       // REQUIRED
    contentType: 'html' | 'image'  // REQUIRED
    htmlCode?: string              // REQUIRED if contentType === 'html'
    imageUrl?: string              // REQUIRED if contentType === 'image'
    linkUrl?: string               // Optional | Click destination
    altText?: string               // Optional | Image alt text (accessibility)
  }
  
  // Targeting rules
  ageRanges?: Array<'0-2' | '2-4' | '5-7' | '8-9' | '10-15' | '16+' | '18+'>  // Optional
  priority: number                 // REQUIRED | 1-100 | Higher = shown first
  
  // Scheduling
  status: 'active' | 'inactive' | 'scheduled'  // REQUIRED | Default: inactive
  startDate?: string               // Optional | ISO 8601 | Ad starts showing
  endDate?: string                 // Optional | ISO 8601 | Ad stops showing
  
  // Inline positioning (only if position === 'inline')
  inlinePosition?: {
    everyNVideos: number           // REQUIRED | Show after every N videos
    offsetStart: number            // Optional | Start after N videos (default: 0)
  }
  
  // Affiliate linking
  affiliatePartner?: {             // Optional | Reference to affiliate
    _ref: string
    _type: 'reference'
  }
  
  // Analytics (aggregated from activity logs)
  impressionCount?: number         // COMPUTED | Total impressions
  clickCount?: number              // COMPUTED | Total clicks
  ctr?: number                     // COMPUTED | Click-through rate (clicks/impressions)
  
  // Metadata
  notes?: string                   // Optional | Admin notes
}
```

**Validation Rules**:

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required, 1-100 chars | "Ad name is required" |
| `type` | Required, one of enum | "Please select an ad type" |
| `position` | Required, one of enum | "Please select an ad position" |
| `content.htmlCode` OR `content.imageUrl` | At least one required | "Please provide HTML code or image URL" |
| `priority` | Required, 1-100 range | "Priority must be between 1 and 100" |
| `inlinePosition` | Required if `position === 'inline'` | "Inline ads require positioning configuration" |
| `inlinePosition.everyNVideos` | Min 1 | "Must show after at least 1 video" |

**Computed Fields**:

```typescript
// impressionCount: Aggregated from activity logs
function computeImpressionCount(adId: string): number {
  return count(*[_type == "activityLog" && actionType == "ad.impression" && resourceId == ^._id])
}

// clickCount: Aggregated from activity logs
function computeClickCount(adId: string): number {
  return count(*[_type == "activityLog" && actionType == "ad.click" && resourceId == ^._id])
}

// ctr: Click-through rate percentage
function computeCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return (clicks / impressions) * 100
}
```

**Example Document**:

```json
{
  "_id": "ad-header-banner-1",
  "_type": "adPlacement",
  "_createdAt": "2026-01-10T09:00:00Z",
  "name": "Main Header Banner - Educational Toys",
  "type": "banner",
  "position": "header",
  "content": {
    "contentType": "image",
    "imageUrl": "https://cdn.example.com/ads/educational-toys.jpg",
    "linkUrl": "https://shop.example.com/toys?utm_source=curatekids",
    "altText": "Shop educational toys for kids"
  },
  "ageRanges": ["5-7", "8-9"],
  "priority": 90,
  "status": "active",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-03-31T23:59:59Z",
  "affiliatePartner": {
    "_ref": "affiliate-educational-shop",
    "_type": "reference"
  },
  "impressionCount": 15234,
  "clickCount": 487,
  "ctr": 3.19,
  "notes": "Q1 2026 campaign - renew if performance stays above 3% CTR"
}
```

---

### 4. AffiliatePartner

**Purpose**: Represents an affiliate marketing partner with tracking configuration

**Schema Definition**:

```typescript
interface AffiliatePartner {
  // System fields
  _id: string                      // Auto-generated: affiliate-{uuid}
  _type: 'affiliatePartner'
  _createdAt: string
  _updatedAt: string
  _rev: string
  
  // Core identification
  name: string                     // REQUIRED | Max 100 chars | Partner name
  contactEmail?: string            // Optional | Email format
  website?: string                 // Optional | URL format
  
  // Tracking configuration
  trackingUrlTemplate: string      // REQUIRED | Template with placeholders
                                   // Example: "https://partner.com/track?id={adId}&session={sessionId}"
  
  // Financial terms
  commissionRate?: number          // Optional | Percentage (0-100)
  commissionType?: 'cpc' | 'cpa' | 'cpm'  // Optional | Cost model
  paymentTerms?: string            // Optional | Free text
  
  // Status
  status: 'active' | 'inactive' | 'pending'  // REQUIRED | Default: pending
  
  // Analytics (aggregated from ad placements)
  totalImpressions?: number        // COMPUTED | Sum across all ads
  totalClicks?: number             // COMPUTED | Sum across all ads
  conversionRate?: number          // COMPUTED | clicks/impressions percentage
  
  // Metadata
  notes?: string                   // Optional | Admin notes
  onboardedAt?: string             // Optional | ISO 8601 | When partner added
  lastPayoutAt?: string            // Optional | ISO 8601 | Last payment date
}
```

**Validation Rules**:

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required, 1-100 chars | "Partner name is required" |
| `contactEmail` | Valid email format if provided | "Please enter a valid email" |
| `website` | Valid URL format if provided | "Please enter a valid URL" |
| `trackingUrlTemplate` | Required, must be valid URL | "Tracking URL template is required" |
| `commissionRate` | 0-100 range if provided | "Commission rate must be between 0 and 100" |

**Computed Fields**:

```typescript
// totalImpressions: Sum of all ad placements for this partner
function computeTotalImpressions(partnerId: string): number {
  const ads = *[_type == "adPlacement" && affiliatePartner._ref == ^._id]
  return sum(ads.impressionCount)
}

// totalClicks: Sum of all ad placements for this partner
function computeTotalClicks(partnerId: string): number {
  const ads = *[_type == "adPlacement" && affiliatePartner._ref == ^._id]
  return sum(ads.clickCount)
}

// conversionRate: Overall CTR across all ads
function computeConversionRate(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return (clicks / impressions) * 100
}
```

**Example Document**:

```json
{
  "_id": "affiliate-educational-shop",
  "_type": "affiliatePartner",
  "_createdAt": "2026-01-05T14:00:00Z",
  "name": "Educational Toy Shop",
  "contactEmail": "partnerships@educationalshop.com",
  "website": "https://educationalshop.com",
  "trackingUrlTemplate": "https://educationalshop.com/track?ref=curatekids&ad={adId}&s={sessionId}",
  "commissionRate": 8.5,
  "commissionType": "cpa",
  "paymentTerms": "Net 30 days, minimum $100 payout",
  "status": "active",
  "totalImpressions": 45678,
  "totalClicks": 1234,
  "conversionRate": 2.70,
  "notes": "Strong performer, approved for premium placements",
  "onboardedAt": "2026-01-05T14:00:00Z",
  "lastPayoutAt": "2026-01-01T00:00:00Z"
}
```

---

### 5. User

**Purpose**: Represents a CMS user with role-based access control

**Schema Definition**:

```typescript
interface User {
  // System fields
  _id: string                      // Auto-generated: user-{uuid}
  _type: 'user'
  _createdAt: string
  _updatedAt: string
  _rev: string
  
  // Core identification
  name: string                     // REQUIRED | Max 100 chars | Full name
  email: string                    // REQUIRED | UNIQUE | Email format
  
  // Access control
  role: 'admin' | 'editor'         // REQUIRED | Immutable after creation
  status: 'active' | 'inactive'    // REQUIRED | Default: active
  
  // Audit trail
  addedBy: {                       // REQUIRED | Admin who created this user
    _ref: string                   // User document ID
    _type: 'reference'
  }
  
  // Analytics
  lastLoginAt?: string             // Optional | ISO 8601 | Last login timestamp
  loginCount?: number              // Optional | Total login count
  
  // Metadata
  notes?: string                   // Optional | Admin notes
  deactivatedAt?: string           // Optional | ISO 8601 | When status → inactive
}
```

**Validation Rules**:

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required, 1-100 chars | "Name is required" |
| `email` | Required, unique, valid format | "Please enter a valid email address" |
| `role` | Required, one of enum, immutable | "Role must be admin or editor" |
| `addedBy` | Required, must reference admin user | "User must be added by an admin" |
| Self-deletion | Blocked | "You cannot delete your own account" |

**Permission Matrix**:

| Document Type | Admin (CRUD) | Editor (CRUD) |
|---------------|--------------|---------------|
| Video | ✅ Create, Read, Update, Delete | ✅ Create, Read, Update, Delete |
| Category | ✅ Create, Read, Update, Delete | ✅ Create, Read, Update, Delete |
| AdPlacement | ✅ Create, Read, Update, Delete | ❌ No access |
| AffiliatePartner | ✅ Create, Read, Update, Delete | ❌ No access |
| User | ✅ Create, Read, Update, Delete | ❌ No access |
| ActivityLog | ✅ Read only | ❌ No access |

**Example Document**:

```json
{
  "_id": "user-jane-editor",
  "_type": "user",
  "_createdAt": "2026-01-08T10:00:00Z",
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "role": "editor",
  "status": "active",
  "addedBy": {
    "_ref": "user-admin-john",
    "_type": "reference"
  },
  "lastLoginAt": "2026-01-10T09:15:00Z",
  "loginCount": 23,
  "notes": "Content curator for 5-7 age range"
}
```

---

### 6. ActivityLog

**Purpose**: Captures all user actions and system events for analytics and auditing

**Schema Definition**:

```typescript
interface ActivityLog {
  // System fields
  _id: string                      // Auto-generated: log-{uuid}
  _type: 'activityLog'
  _createdAt: string               // ISO 8601 | Primary index for time queries
  _updatedAt: string               // (Usually same as _createdAt for logs)
  _rev: string
  
  // Event classification
  actionType: string               // REQUIRED | Pattern: "{resource}.{action}"
                                   // Examples: "video.view", "ad.click", "user.login"
  
  // Actor identification
  userId?: {                       // Optional | Reference to user (null for anonymous)
    _ref: string
    _type: 'reference'
  }
  sessionId?: string               // Optional | Client session identifier (UUID)
  ipAddress?: string               // Optional | Anonymized IP (last octet removed)
  userAgent?: string               // Optional | Client user agent
  
  // Resource reference
  resourceType?: string            // Optional | "video", "ad", "category", "user"
  resourceId?: string              // Optional | Document _id
  
  // Contextual metadata (flexible JSON)
  metadata?: {
    // Video view metadata
    videoId?: string
    categoryPath?: string[]
    ageRange?: string
    duration?: number              // Seconds watched
    watchedToEnd?: boolean
    
    // Ad interaction metadata
    adId?: string
    adPosition?: string
    clickDestination?: string
    visibleDuration?: number       // Milliseconds ad was visible
    
    // CRUD operation metadata
    previousValue?: any            // Before update
    newValue?: any                 // After update
    
    // Category navigation metadata
    fromCategory?: string
    toCategory?: string
    navigationPath?: string[]
    
    // User authentication metadata
    loginMethod?: string           // "google", "github", etc.
    failureReason?: string         // For failed logins
    
    // Generic metadata
    [key: string]: any             // Flexible for future needs
  }
}
```

**Validation Rules**:

| Field | Rule | Error Message |
|-------|------|---------------|
| `actionType` | Required, follows pattern | "Action type is required" |
| `_createdAt` | Auto-generated, indexed | N/A |
| `metadata` | Valid JSON if provided | "Metadata must be valid JSON" |

**Common Action Types**:

```typescript
// Video actions
"video.create"    | "video.update"    | "video.delete"    | "video.view"
"video.publish"   | "video.archive"   | "video.tag"

// Category actions
"category.create" | "category.update" | "category.delete" | "category.navigate"
"category.reorder"

// Ad actions
"ad.impression"   | "ad.click"        | "ad.create"       | "ad.update"
"ad.activate"     | "ad.deactivate"

// User actions
"user.login"      | "user.logout"     | "user.create"     | "user.deactivate"
"user.delete"     | "user.failed_login"

// System actions
"system.backup"   | "system.restore"  | "system.migration"
```

**Example Documents**:

```json
// Video view log
{
  "_id": "log-abc123",
  "_type": "activityLog",
  "_createdAt": "2026-01-10T15:30:45Z",
  "actionType": "video.view",
  "userId": null,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "ipAddress": "192.168.1.0",
  "resourceType": "video",
  "resourceId": "video-123abc",
  "metadata": {
    "videoId": "video-123abc",
    "categoryPath": ["5-7 years", "Education", "Math", "Basic Addition"],
    "ageRange": "5-7",
    "duration": 142,
    "watchedToEnd": true
  }
}

// Ad click log
{
  "_id": "log-def456",
  "_type": "activityLog",
  "_createdAt": "2026-01-10T16:22:10Z",
  "actionType": "ad.click",
  "sessionId": "550e8400-e29b-41d4-a716-446655440001",
  "ipAddress": "203.0.113.0",
  "resourceType": "ad",
  "resourceId": "ad-header-banner-1",
  "metadata": {
    "adId": "ad-header-banner-1",
    "adPosition": "header",
    "clickDestination": "https://shop.example.com/toys?utm_source=curatekids",
    "ageRange": "5-7"
  }
}

// User login log
{
  "_id": "log-ghi789",
  "_type": "activityLog",
  "_createdAt": "2026-01-10T09:00:00Z",
  "actionType": "user.login",
  "userId": {
    "_ref": "user-jane-editor",
    "_type": "reference"
  },
  "ipAddress": "198.51.100.0",
  "resourceType": "user",
  "resourceId": "user-jane-editor",
  "metadata": {
    "loginMethod": "google"
  }
}
```

---

## Data Integrity Rules

### Referential Integrity

1. **Video → Category**: 
   - Required reference
   - Category must exist (strong reference)
   - Category must be leaf (no children)

2. **Category → Parent Category**:
   - Optional reference (null for age range roots)
   - Parent must exist (strong reference)
   - Parent must have same `ageRange`
   - Circular references prevented

3. **AdPlacement → AffiliatePartner**:
   - Optional reference
   - Weak reference (ad survives if affiliate deleted)

4. **User → User (addedBy)**:
   - Required reference
   - Referenced user must be admin role
   - Self-reference prevented

5. **ActivityLog → Resource**:
   - Optional weak references
   - Log survives if resource deleted (historical audit)

### Cascade Operations

**Category Deletion**:
```
BLOCKED if:
  - Has child categories (childCount > 0)
  - Has assigned videos (videoCount > 0)
  - Is age range root (isAgeRangeRoot === true)

ALLOWED if:
  - Leaf category with no videos
  - Activity logs remain (weak reference)
```

**Video Deletion**:
```
ALLOWED always (soft delete option available)
  - Category.videoCount decremented
  - Activity logs remain (weak reference)
```

**User Deletion**:
```
BLOCKED if:
  - Self-deletion (current user)
  - Has users they added (addedBy references)

ALLOWED if:
  - Admin deleting another user
  - No dependent users
  - Activity logs remain (weak reference)
```

---

## Query Patterns & Performance

### Most Common Queries

```groq
// 1. Get published videos in age range (filtered by category)
*[_type == "video" && status == "published" && ageRange == $ageRange] 
  | order(publishedAt desc) [0...20]

// 2. Get category tree for age range
*[_type == "category" && ageRange == $ageRange] 
  | order(depth asc, sortOrder asc)
  {
    ...,
    children[]-> { name, slug, depth, videoCount }
  }

// 3. Get active ads for position
*[_type == "adPlacement" 
  && status == "active" 
  && position == $position 
  && (!defined(ageRanges) || $ageRange in ageRanges)
] | order(priority desc) [0]

// 4. Get user activity history
*[_type == "activityLog" && userId._ref == $userId] 
  | order(_createdAt desc) [0...50]

// 5. Get video with category path
*[_type == "video" && _id == $videoId][0] {
  ...,
  "category": category-> {
    name,
    fullPath,
    ageRange
  }
}
```

### Indexes Required

- `_type` + `status` (videos, ads)
- `_type` + `ageRange` (categories, videos)
- `_type` + `_createdAt` (activity logs)
- `_type` + `actionType` (activity logs)
- `_type` + `userId` (activity logs)

---

**Data Model Status**: ✅ COMPLETE  
**Total Entities**: 6  
**Total Fields**: 93  
**Constitution Compliance**: ✅ All complexity limits maintained  
**Ready for**: Contract Generation (JSON Schemas)
