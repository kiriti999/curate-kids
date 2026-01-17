# Data Model: PayloadCMS Collections

**Phase**: 1 (Design)  
**Date**: 2025-01-19  
**Source**: Migrated from Sanity CMS schemas in `/schemaTypes/documents/`

## Overview

This document defines the PayloadCMS collection schemas for all six document types, preserving the exact structure, validations, and relationships from the current Sanity CMS implementation. All schemas follow PayloadCMS 3.x conventions and align with project constitution requirements.

---

## Collection 1: Video

**Purpose**: Stores video content from YouTube, including metadata, categorization, and engagement metrics.

**Relationships**:
- Belongs to one `Category` (required)
- Tracked by multiple `ActivityLog` entries (view events)
- Referenced by `AdPlacement` for inline ad positioning

### Fields

| Field Name | Type | Required | Validation | Description |
|------------|------|----------|------------|-------------|
| `id` | string | Auto | MongoDB ObjectId | PayloadCMS auto-generated unique identifier |
| `title` | text | Yes | Max 200 chars | Video title |
| `slug` | text | Yes | Unique, auto-generated from title, max 96 chars | URL-safe identifier |
| `youtubeUrl` | text | Yes | Valid YouTube URL regex | Full YouTube URL (e.g., https://www.youtube.com/watch?v=...) |
| `youtubeId` | text | Auto | Exactly 11 chars | Auto-extracted from youtubeUrl |
| `duration` | number | No | Positive integer | Duration in seconds (extracted from YouTube) |
| `category` | select | Yes | Enum from constants | Video category (dropdown) |
| `ageRange` | select | Yes | Enum from constants | Target age range (dropdown) |
| `tags` | array | No | Max 20 items | Array of string tags |
| `notes` | textarea | No | - | Admin notes (not displayed publicly) |
| `viewCount` | number | No | Read-only, default 0 | Aggregated from activity logs |
| `lastViewedAt` | date | No | Read-only | Timestamp of last view event |
| `createdAt` | date | Auto | - | PayloadCMS auto-timestamp |
| `updatedAt` | date | Auto | - | PayloadCMS auto-timestamp |

### Hooks

- **`beforeValidate`**: Extract `youtubeId` from `youtubeUrl` using regex
- **`afterRead`**: Populate calculated `viewCount` and `lastViewedAt` from ActivityLog collection (on-demand)

### Validations

- `youtubeUrl`: Must match regex `/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/`
- `tags`: Maximum 20 items in array
- `slug`: Must be unique across all Video documents

### Indexes

- `slug` (unique)
- `category` (non-unique, for filtering)
- `ageRange` (non-unique, for filtering)
- `createdAt` (descending, for sorting)

---

## Collection 2: Category

**Purpose**: Hierarchical categorization system for videos, supporting up to 10 levels of nesting with age range root categories.

**Relationships**:
- Has one parent `Category` (optional, null for root categories)
- Has many child `Category` entries
- Referenced by multiple `Video` entries

### Fields

| Field Name | Type | Required | Validation | Description |
|------------|------|----------|------------|-------------|
| `id` | string | Auto | MongoDB ObjectId | PayloadCMS auto-generated unique identifier |
| `name` | text | Yes | Max 100 chars | Category name (e.g., "Math", "Education") |
| `slug` | text | Yes | Unique, auto-generated from name, max 96 chars | URL-safe identifier |
| `description` | textarea | No | Max 500 chars | Category description |
| `icon` | upload | No | Image with hotspot | Category icon or representative image |
| `ageRange` | select | Yes | Enum from constants | Age range this category belongs to |
| `parent` | relationship | No | Reference to Category, conditional validation | Parent category (null for age range root categories) |
| `fullPath` | array | No | Read-only, array of strings | Complete path from root to this category (auto-calculated) |
| `depth` | number | Yes | Read-only, 0-9 | Depth in hierarchy (0 for age ranges, 1+ for content categories) |
| `isAgeRangeRoot` | checkbox | No | Read-only, default false | True for predefined age range categories (immutable) |
| `sortOrder` | number | No | Positive integer | Custom ordering within siblings (lower numbers appear first) |
| `isVisible` | checkbox | No | Default true | Show this category in frontend navigation |
| `childCount` | number | No | Read-only, default 0 | Number of direct child categories (auto-calculated) |
| `videoCount` | number | No | Read-only, default 0 | Number of videos assigned to this category (auto-calculated) |
| `notes` | textarea | No | - | Admin notes (not displayed publicly) |
| `createdAt` | date | Auto | - | PayloadCMS auto-timestamp |
| `updatedAt` | date | Auto | - | PayloadCMS auto-timestamp |

### Hooks

- **`beforeValidate`**: 
  - Validate parent category rules (see Validations section)
  - Calculate `depth` based on parent's depth + 1 (or 0 if no parent)
  - Build `fullPath` array by traversing up the parent chain
- **`afterChange`**: 
  - Update parent category's `childCount` when this category is added/removed
  - Recalculate `videoCount` for this category and ancestors
- **`beforeChange`**: 
  - Prevent deletion if `childCount > 0` or `videoCount > 0` (or implement cascade delete)

### Validations

- **Parent Category Rules**:
  1. If `isAgeRangeRoot === true`, then `parent` must be null
  2. If `isAgeRangeRoot === false`, then `parent` must be set
  3. Parent category must be in the same `ageRange`
  4. Parent category's `depth` must be < 9 (max depth is 10 levels)
  5. Circular reference prevention: parent cannot be this category or any of its descendants
- `name`: Required, max 100 characters
- `slug`: Must be unique across all Category documents
- `depth`: Must be between 0-9

### Indexes

- `slug` (unique)
- `parent` (non-unique, for hierarchy queries)
- `ageRange` (non-unique, for filtering)
- `isAgeRangeRoot` (non-unique, for root category queries)
- `sortOrder` (non-unique, for sorting siblings)

---

## Collection 3: User

**Purpose**: Admin and editor user accounts with role-based access control.

**Relationships**:
- Added by another `User` (admin only)
- Referenced by multiple `ActivityLog` entries (CRUD operations)
- Referenced by `User` as `addedBy`

### Fields

| Field Name | Type | Required | Validation | Description |
|------------|------|----------|------------|-------------|
| `id` | string | Auto | MongoDB ObjectId | PayloadCMS auto-generated unique identifier |
| `name` | text | Yes | Max 100 chars | User's full name |
| `email` | email | Yes | Valid email format, globally unique | User's email address (used for login) |
| `password` | text | Yes | PayloadCMS auth field, hashed | User's password (PayloadCMS handles hashing) |
| `role` | radio | Yes | Enum: "admin" or "editor", immutable after creation | User role |
| `status` | radio | Yes | Enum: "active" or "inactive", default "active" | Account status |
| `addedBy` | relationship | Yes | Reference to User with admin role, read-only | Admin who created this user account |
| `lastLoginAt` | date | No | Read-only | Timestamp of last successful login |
| `loginCount` | number | No | Read-only, default 0 | Total number of successful logins |
| `notes` | textarea | No | - | Admin notes (not displayed publicly) |
| `deactivatedAt` | date | No | Read-only | Timestamp when user was deactivated (if status === "inactive") |
| `createdAt` | date | Auto | - | PayloadCMS auto-timestamp |
| `updatedAt` | date | Auto | - | PayloadCMS auto-timestamp |

### Hooks

- **`beforeChange`**: 
  - Set `addedBy` to current logged-in admin user (if creating new user)
  - Prevent `role` changes after initial creation (immutable)
  - Set `deactivatedAt` timestamp when `status` changes from "active" to "inactive"
- **`afterRead`**: 
  - Update `lastLoginAt` and increment `loginCount` on successful login (via PayloadCMS auth hooks)

### Validations

- `email`: Must be valid email format and globally unique
- `role`: Must be "admin" or "editor", cannot be changed after creation
- `addedBy`: Must reference a User with `role === "admin"`
- `status`: Must be "active" or "inactive"

### Indexes

- `email` (unique)
- `role` (non-unique, for filtering)
- `status` (non-unique, for filtering)

---

## Collection 4: ActivityLog

**Purpose**: Immutable audit trail for user actions, video views, ad interactions, and system events.

**Relationships**:
- Weakly references `User` (nullable for anonymous actions)
- Weakly references any resource by `resourceType` + `resourceId`

### Fields

| Field Name | Type | Required | Validation | Description |
|------------|------|----------|------------|-------------|
| `id` | string | Auto | MongoDB ObjectId | PayloadCMS auto-generated unique identifier |
| `actionType` | text | Yes | Pattern: `resource.action` (e.g., "video.view", "ad.click") | Action type in resource.action format |
| `userId` | relationship | No | Weak reference to User, nullable | User who performed action (null for anonymous) |
| `sessionId` | text | No | UUID format | Session identifier (browser session) |
| `ipAddress` | text | No | Anonymized (last octet removed) | Anonymized IP address (e.g., "192.168.1.0") |
| `userAgent` | text | No | - | Browser user agent string |
| `resourceType` | select | Yes | Enum: "video", "category", "ad", "user", "system" | Type of resource affected |
| `resourceId` | text | Yes | Document ID | ID of the affected resource |
| `metadata` | json | No | Flexible object | Action-specific metadata (see Metadata Schema below) |
| `createdAt` | date | Auto | Read-only | PayloadCMS auto-timestamp (immutable) |

### Metadata Schema

Flexible JSON object with action-specific fields:

**For `video.view`**:
```json
{
  "videoTitle": "string",
  "categoryPath": ["string"],
  "ageRange": "string",
  "duration": "number"
}
```

**For `ad.click` / `ad.impression`**:
```json
{
  "adName": "string",
  "adType": "string",
  "position": "string",
  "affiliatePartner": "string (optional)"
}
```

**For `user.login` / `user.logout`**:
```json
{
  "userName": "string",
  "userRole": "string"
}
```

**For `category.navigate`**:
```json
{
  "categoryName": "string",
  "categoryPath": ["string"],
  "depth": "number"
}
```

**For CRUD operations** (`video.create`, `category.update`, `user.delete`):
```json
{
  "fieldChanges": { "before": {}, "after": {} },
  "performedBy": "string (user ID)"
}
```

### Hooks

- **`beforeCreate`**: Set `createdAt` to current timestamp (immutable)
- **Access Control**: Read-only collection - no manual creation, editing, or deletion through admin UI

### Validations

- `actionType`: Must match pattern `resource.action` (e.g., `video.view`, `ad.click`, `user.login`)
- `resourceType`: Must be one of: "video", "category", "ad", "user", "system"
- `ipAddress`: If provided, must be anonymized (last octet = 0)
- `sessionId`: If provided, should be UUID format

### Indexes

- `actionType` (non-unique, for filtering by action)
- `resourceType` + `resourceId` (compound, for finding all actions on a resource)
- `userId` (non-unique, for user activity history)
- `createdAt` (descending, for time-based queries)

---

## Collection 5: AdPlacement

**Purpose**: Configuration for advertisements displayed on the platform, including banners, affiliate links, and native ads.

**Relationships**:
- Weakly references `AffiliatePartner` (optional)
- Tracked by multiple `ActivityLog` entries (impressions, clicks)

### Fields

| Field Name | Type | Required | Validation | Description |
|------------|------|----------|------------|-------------|
| `id` | string | Auto | MongoDB ObjectId | PayloadCMS auto-generated unique identifier |
| `name` | text | Yes | Max 100 chars | Ad placement name (internal reference) |
| `type` | radio | Yes | Enum: "banner", "affiliate", "native" | Ad type |
| `position` | select | Yes | Enum: "header", "footer", "sidebar", "inline", "floating" | Ad position on page |
| `content` | group | Yes | See Content Schema below | Ad content configuration (HTML, image, link) |
| `ageRanges` | array | No | Array of age range strings, empty = all | Target age ranges (empty means all) |
| `priority` | number | Yes | 1-100, default 50 | Ad priority (higher numbers shown first) |
| `status` | radio | Yes | Enum: "active", "inactive", "scheduled", default "inactive" | Ad status |
| `startDate` | date | No | Must be before endDate | Ad start date/time (for scheduled ads) |
| `endDate` | date | No | Must be after startDate | Ad end date/time (for scheduled ads) |
| `inlinePosition` | group | Conditional | Required if position === "inline" | Inline ad positioning config |
| `affiliatePartner` | relationship | No | Weak reference to AffiliatePartner | Associated affiliate partner (if applicable) |
| `impressionCount` | number | No | Read-only, default 0 | Total impressions (aggregated from ActivityLog) |
| `clickCount` | number | No | Read-only, default 0 | Total clicks (aggregated from ActivityLog) |
| `ctr` | number | No | Read-only, default 0 | Click-through rate (clickCount / impressionCount) |
| `notes` | textarea | No | - | Admin notes (not displayed publicly) |
| `createdAt` | date | Auto | - | PayloadCMS auto-timestamp |
| `updatedAt` | date | Auto | - | PayloadCMS auto-timestamp |

### Content Schema (Group Field)

```typescript
{
  contentType: "html" | "image", // Radio selection
  htmlCode: string, // Textarea, required if contentType === "html"
  imageUrl: string, // URL field, required if contentType === "image"
  linkUrl: string, // URL field, required
  altText: string // Text field, required if contentType === "image"
}
```

### Inline Position Schema (Group Field)

```typescript
{
  everyNVideos: number, // Required, positive integer (e.g., 5 = show ad every 5 videos)
  offsetStart: number // Optional, default 0 (start showing after N videos)
}
```

### Hooks

- **`beforeValidate`**:
  - If `position === "inline"`, require `inlinePosition` to be set
  - Validate `startDate` < `endDate` if both provided
- **`afterRead`**: 
  - Calculate `ctr` from `clickCount` / `impressionCount` (avoid division by zero)

### Validations

- `name`: Required, max 100 characters
- `priority`: Must be between 1-100
- `startDate` and `endDate`: If both provided, `startDate` must be before `endDate`
- `inlinePosition.everyNVideos`: Must be positive integer
- `content.linkUrl`: Must be valid URL format
- `content.imageUrl`: Must be valid URL format (if `contentType === "image"`)
- `content.altText`: Required if `contentType === "image"`

### Indexes

- `position` (non-unique, for filtering by position)
- `status` (non-unique, for filtering active ads)
- `priority` (descending, for sorting)
- `startDate`, `endDate` (for scheduled ad queries)

---

## Collection 6: AffiliatePartner

**Purpose**: Affiliate partner management for tracking commissions and performance metrics.

**Relationships**:
- Referenced by multiple `AdPlacement` entries

### Fields

| Field Name | Type | Required | Validation | Description |
|------------|------|----------|------------|-------------|
| `id` | string | Auto | MongoDB ObjectId | PayloadCMS auto-generated unique identifier |
| `name` | text | Yes | Max 100 chars | Partner name |
| `contactEmail` | email | Yes | Valid email format | Partner contact email |
| `website` | text | No | Valid URL format | Partner website |
| `trackingUrlTemplate` | text | Yes | Valid URL with placeholders `{adId}` and `{sessionId}` | Tracking URL template (e.g., `https://partner.com/track?ad={adId}&session={sessionId}`) |
| `commissionRate` | number | No | 0-100 | Commission rate percentage |
| `commissionType` | radio | Yes | Enum: "cpc", "cpa", "cpm" | Commission type (Cost Per Click, Action, or Mille) |
| `paymentTerms` | textarea | No | - | Payment terms description |
| `status` | radio | Yes | Enum: "active", "inactive", "pending", default "pending" | Partner status |
| `totalImpressions` | number | No | Read-only, default 0 | Total impressions across all partner ads (aggregated) |
| `totalClicks` | number | No | Read-only, default 0 | Total clicks across all partner ads (aggregated) |
| `conversionRate` | number | No | Read-only, default 0 | Conversion rate (totalClicks / totalImpressions) |
| `onboardedAt` | date | No | - | Timestamp when partner was onboarded |
| `lastPayoutAt` | date | No | - | Timestamp of last payout |
| `notes` | textarea | No | - | Admin notes (not displayed publicly) |
| `createdAt` | date | Auto | - | PayloadCMS auto-timestamp |
| `updatedAt` | date | Auto | - | PayloadCMS auto-timestamp |

### Hooks

- **`afterRead`**: 
  - Calculate `conversionRate` from `totalClicks` / `totalImpressions` (avoid division by zero)

### Validations

- `name`: Required, max 100 characters
- `contactEmail`: Must be valid email format
- `website`: Must be valid URL format (if provided)
- `trackingUrlTemplate`: Must be valid URL format and include `{adId}` and `{sessionId}` placeholders
- `commissionRate`: Must be between 0-100
- `commissionType`: Must be one of: "cpc", "cpa", "cpm"

### Indexes

- `contactEmail` (non-unique, for partner lookup)
- `status` (non-unique, for filtering)

---

## Relationships Diagram

```text
User (1) ──────────────> User (Many)         [addedBy relationship]
  │
  └──(weak)──> ActivityLog (Many)             [userId nullable reference]

Category (1) ──────────> Category (Many)      [parent → children hierarchy]
  │
  └──(strong)──> Video (Many)                 [category foreign key]

Video (1) ──────────────> ActivityLog (Many) [resourceType="video", resourceId]
  │
  └──(referenced by)──> AdPlacement          [for inline positioning]

AdPlacement (1) ──(weak)──> AffiliatePartner (1) [optional affiliation]
  │
  └──────────────> ActivityLog (Many)        [ad.impression, ad.click events]

AffiliatePartner (1) ──> AdPlacement (Many)  [partner's ads]
```

**Legend**:
- `──────────>`: Strong reference (enforced foreign key)
- `──(weak)──>`: Weak reference (nullable, not enforced)
- `(Many)`: One-to-many relationship

---

## Migration Considerations

### ID Preservation

- Original Sanity `_id` will be stored in a custom field `sanityId` for reference tracking
- PayloadCMS will auto-generate new MongoDB `_id` values
- All references will be updated to use new PayloadCMS IDs during transformation

### Calculated Fields

- `fullPath`, `depth`, `childCount`, `videoCount` (Category): Recalculated in PayloadCMS hooks after import
- `viewCount`, `lastViewedAt` (Video): Recalculated from ActivityLog after import
- `impressionCount`, `clickCount`, `ctr` (AdPlacement): Recalculated from ActivityLog after import
- `totalImpressions`, `totalClicks`, `conversionRate` (AffiliatePartner): Recalculated from AdPlacement after import

### Image Migration

- Sanity `image` type → PayloadCMS `upload` type
- **Option 1** (fast): Keep Sanity image URLs as-is (temporary dependency on Sanity CDN)
- **Option 2** (full migration): Download images and re-upload to PayloadCMS media collection

### Validation Preservation

All Sanity custom validation rules (circular reference prevention, depth limits, parent-child age range consistency) will be reimplemented as PayloadCMS `validate` hooks.

---

**Data Model Version**: 1.0  
**Last Updated**: 2025-01-19  
**Status**: Design complete, ready for implementation
