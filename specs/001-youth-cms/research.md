# Research Findings: Youth Content CMS

**Date**: 2026-01-10  
**Branch**: `001-youth-cms`  
**Phase**: Phase 0 - Research & Technical Decisions

This document consolidates all technical research findings that inform the implementation plan for the Youth Content CMS feature.

---

## 1. Sanity Schema Design for Hierarchical Categories

### Question
How to efficiently implement age-based category hierarchy with unlimited nesting in Sanity?

### Decision
**Hybrid Materialized Path with Parent Reference**

### Rationale

**Chosen Approach**:
- Store both `parent` (reference field) and `fullPath` (string array) on each category document
- `parent`: Maintains referential integrity, enables constraint validation
- `fullPath`: Pre-computed array like `["5-7 years", "Education", "Math"]` for efficient queries
- `depth`: Integer field (0 for age ranges, increments by 1 for each level)
- Cache category paths in Sanity Studio UI for instant navigation

**Implementation Details**:
```typescript
// Category schema excerpt
{
  parent: {
    type: 'reference',
    to: [{type: 'category'}],
    validation: Rule => Rule.custom((parent, context) => {
      // Validate parent has same ageRange
      // Block if would create circular reference
    })
  },
  fullPath: {
    type: 'array',
    of: [{type: 'string'}],
    readOnly: true,  // Auto-computed on save
    validation: Rule => Rule.max(10)  // 10-level depth limit
  },
  depth: {
    type: 'number',
    readOnly: true,
    validation: Rule => Rule.min(0).max(10)
  }
}
```

**Query Benefits**:
- Get all videos in age range: `*[category->ageRange == "5-7"]`
- Get all subcategories: `*[parent._ref == $categoryId]`
- Display breadcrumb: Use `fullPath` directly (no recursion)
- Find leaf categories: `*[!(_id in *[_type=="category" && parent._ref != null].parent._ref)]`

### Alternatives Considered

**1. Pure Adjacency List (parent reference only)**
- ❌ Requires recursive queries to build full path
- ❌ Slow for "all descendants" queries
- ✅ Simple schema
- **Rejected**: Query performance unacceptable for navigation UI

**2. Pure Materialized Path (fullPath only)**
- ❌ No referential integrity
- ❌ Manual path updates when category renamed/moved
- ✅ Fast queries
- **Rejected**: Integrity risks outweigh performance benefits

**3. Closure Table (separate edges table)**
- ❌ Overkill for this use case
- ❌ Complex to maintain in Sanity
- ✅ Most flexible for complex hierarchy operations
- **Rejected**: Unnecessary complexity for 10-level limit

### Complexity Assessment
✅ **Complexity ≤ 5**
- Path builder function: Recursive with single loop (complexity = 2)
- Parent validation: Single if-check (complexity = 1)
- Depth calculator: Single arithmetic operation (complexity = 1)

---

## 2. YouTube Video Embedding Strategy

### Question
What's the optimal approach for extracting and storing YouTube metadata?

### Decision
**YouTube oEmbed API with Manual Override Fallback**

### Rationale

**Chosen Approach**:
- Use YouTube oEmbed endpoint: `https://www.youtube.com/oembed?url={videoUrl}&format=json`
- No API key required (simpler than Data API v3)
- Auto-extract: `title`, `thumbnail_url`, `html` (embed code)
- Store extracted data in Sanity document (cache)
- Manual fields always editable (override auto-extracted)
- Video ID extraction via regex (supports multiple URL formats)

**Implementation Flow**:
```
1. Admin pastes YouTube URL
2. Regex extracts video ID from URL
3. Client calls oEmbed API: fetch(`/api/youtube-metadata?id=${videoId}`)
4. Server proxies to oEmbed, returns metadata
5. Auto-fill title, description, thumbnail fields
6. Admin can override any field before saving
7. If oEmbed fails → graceful degradation to manual entry
```

**Supported URL Formats**:
```regex
^(https?://)?(www\.)?(
  youtube\.com/watch\?v=|
  youtu\.be/|
  youtube\.com/embed/|
  youtube\.com/v/
)([a-zA-Z0-9_-]{11})
```

**Metadata Caching**:
- Store in video document fields (not separate cache document)
- Update on manual "Refresh Metadata" button
- TTL not needed (video metadata rarely changes)

### Alternatives Considered

**1. YouTube Data API v3**
- ❌ Requires API key and quota management
- ❌ 10,000 units/day quota (100 videos = 100 units)
- ✅ More detailed metadata (duration, view count, categories)
- **Rejected**: API key management overhead for minimal benefit

**2. Third-party metadata service (e.g., Iframely)**
- ❌ External dependency and cost
- ❌ Rate limiting on free tier
- ✅ Supports more platforms (Vimeo, etc.)
- **Rejected**: Over-engineered for YouTube-only requirement

**3. Manual entry only (no auto-extraction)**
- ❌ Poor UX (admin must type everything)
- ❌ Error-prone (typos, missing fields)
- ✅ Simple implementation
- **Rejected**: Fails SC-001 (add video <2min)

### Rate Limiting Strategy

**oEmbed Rate Limits**:
- No official rate limit published
- Observed: ~100 requests/minute tolerated
- Mitigation: Client-side debouncing (500ms after paste)

**Fallback Plan**:
```typescript
async function fetchYoutubeMetadata(videoId: string) {
  try {
    const response = await fetch(`/api/youtube-metadata?id=${videoId}`, {
      timeout: 5000  // 5-second timeout
    })
    if (!response.ok) throw new Error('oEmbed failed')
    return await response.json()
  } catch (error) {
    console.warn('YouTube metadata extraction failed, using manual entry')
    return null  // Graceful degradation
  }
}
```

### Complexity Assessment
✅ **Complexity ≤ 5**
- Video ID extraction: Single regex match (complexity = 1)
- oEmbed fetch: Try-catch with single fetch (complexity = 2)
- Metadata mapping: Direct field assignment (complexity = 1)

---

## 3. Dynamic Ad Positioning for Responsive Layouts

### Question
How to dynamically inject ads into content grids without breaking responsive layouts?

### Decision
**CSS Grid with Frontend Ad-Aware Layout Algorithm**

### Rationale

**Layout Strategy**:
- Frontend calculates ad insertion points based on video count
- Inline ads use modulo math: `if ((index + 1) % everyNVideos === 0) insertAd()`
- Ads occupy full grid row (span all columns) to prevent layout shift
- Grid recalculates on viewport resize (debounced)

**Responsive Breakpoints**:
```css
/* Mobile: 320-767px */
.video-grid {
  grid-template-columns: 1fr;  /* 1 column */
}
/* Insert ad every 3 videos */

/* Tablet: 768-1023px */
.video-grid {
  grid-template-columns: repeat(2, 1fr);  /* 2 columns */
}
/* Insert ad every 6 videos */

/* Desktop: 1024px+ */
.video-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
/* Insert ad every 9-12 videos (depends on screen width) */
```

**Ad Rendering**:
```typescript
// Pseudo-code for ad insertion
function renderVideoGridWithAds(videos: Video[], adPlacements: AdPlacement[]) {
  const inlineAds = adPlacements.filter(ad => ad.position === 'inline')
  const items = []
  
  videos.forEach((video, index) => {
    items.push({ type: 'video', data: video })
    
    // Check if ad should be inserted after this video
    inlineAds.forEach(ad => {
      if ((index + 1) % ad.inlinePosition.everyNVideos === 0) {
        items.push({ type: 'ad', data: ad })
      }
    })
  })
  
  return items.map((item, index) => 
    item.type === 'video' 
      ? <VideoCard key={`video-${index}`} {...item.data} />
      : <AdCard key={`ad-${index}`} {...item.data} />
  )
}
```

**Layout Shift Prevention (CLS)**:
- Ads have min-height declared in CSS before content loads
- Skeleton placeholder shown while ad loads
- Intersection Observer triggers impression only when visible
- No async content loading after initial render

**Static Position Ads**:
- Header/Footer: Positioned outside content grid (no layout impact)
- Sidebar: Fixed width column (doesn't affect main content)
- Floating: Absolute positioning (overlay, no layout shift)

### Alternatives Considered

**1. Server-side ad injection into HTML**
- ❌ Requires server-side rendering (Sanity is headless)
- ❌ Can't adapt to client viewport dynamically
- ✅ Better SEO (ads in initial HTML)
- **Rejected**: Sanity Studio is editing UI, not frontend

**2. Ad slots with lazy loading**
- ❌ Complex slot reservation system
- ❌ Still requires knowing ad positions upfront
- ✅ Better for dynamic ad networks (Google AdSense)
- **Rejected**: Over-engineered for static ad placements

**3. Absolute positioning overlays**
- ❌ Breaks content flow
- ❌ Accessibility issues (content behind ads)
- ✅ Simplest implementation
- **Rejected**: Fails responsive layout integrity requirement

### Impression Tracking

**Intersection Observer API**:
```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.impressed) {
      // Log impression to activity log
      logAdImpression(entry.target.dataset.adId)
      entry.target.dataset.impressed = 'true'
    }
  })
}, { threshold: 0.5 })  // 50% visible = impression

document.querySelectorAll('.ad-placement').forEach(ad => observer.observe(ad))
```

### Complexity Assessment
✅ **Complexity ≤ 5**
- Ad insertion logic: Single modulo check (complexity = 1)
- Grid rendering: Single map operation (complexity = 1)
- Intersection Observer callback: Single if-check (complexity = 1)

---

## 4. Activity Logging Schema for Analytics

### Question
What log structure and indexing strategy supports efficient analytics queries?

### Decision
**Dedicated Sanity Document Type with Indexed Fields**

### Rationale

**Schema Design**:
```typescript
{
  _type: 'activityLog',
  _createdAt: string,        // Auto-indexed by Sanity
  actionType: string,        // Manual index: 'video.view', 'ad.click', etc.
  userId: reference | null,  // Manual index for user activity
  sessionId: string,         // Client session identifier
  resourceType: string,      // 'video', 'ad', 'category', 'user'
  resourceId: string,        // Document _id
  metadata: object           // Flexible JSON for context
}
```

**Index Strategy**:
- Sanity auto-indexes: `_createdAt`, `_type`
- Manual indexes (via GROQ filters): `actionType`, `userId`, `resourceType`
- Composite queries: `*[_type=="activityLog" && actionType=="video.view" && userId==$userId]`

**Common Query Patterns**:
```groq
// Recent activity (last 24 hours)
*[_type=="activityLog" && _createdAt > $yesterday] | order(_createdAt desc) [0...100]

// User activity history
*[_type=="activityLog" && userId._ref == $userId] | order(_createdAt desc)

// Video view count
count(*[_type=="activityLog" && actionType=="video.view" && resourceId==$videoId])

// Ad performance
{
  "impressions": count(*[_type=="activityLog" && actionType=="ad.impression" && resourceId==$adId]),
  "clicks": count(*[_type=="activityLog" && actionType=="ad.click" && resourceId==$adId])
}

// Category navigation funnel
*[_type=="activityLog" && actionType=="category.navigate" && metadata.ageRange==$ageRange]
  | order(_createdAt asc)
```

**Metadata Flexibility**:
```json
// Video view log
{
  "actionType": "video.view",
  "metadata": {
    "videoId": "video-123",
    "categoryPath": ["5-7 years", "Education", "Math"],
    "ageRange": "5-7",
    "duration": 45,
    "watchedToEnd": true
  }
}

// Ad click log
{
  "actionType": "ad.click",
  "metadata": {
    "adId": "ad-456",
    "position": "inline",
    "clickDestination": "https://partner.com/track?id=123",
    "ageRange": "5-7"
  }
}
```

**Log Volume Management**:
- Expected: 1M+ entries over 6-12 months
- Sanity scales to 10M+ documents per dataset
- Future: Archive old logs to external DB (BigQuery, S3)
- Query optimization: Always filter by `_createdAt` range

### Alternatives Considered

**1. External logging service (e.g., Mixpanel, Segment)**
- ❌ Additional cost and integration complexity
- ❌ Data siloed outside Sanity
- ✅ Better analytics UI out of box
- **Rejected**: Requirement specifies future custom dashboard

**2. Embedded logs in video/ad documents (array field)**
- ❌ Document size grows unbounded
- ❌ Can't query across all logs efficiently
- ✅ Simpler data model
- **Rejected**: Violates Sanity document size limits (>10MB)

**3. Serverless function + external DB (e.g., Vercel + Postgres)**
- ❌ Requires separate infrastructure
- ❌ More moving parts (higher complexity)
- ✅ Optimized for time-series data
- **Rejected**: Adds infrastructure before proven necessity

### Log Retention Policy

**Phase 1 (MVP)**:
- Store all logs indefinitely in Sanity
- Monitor dataset size monthly
- Alert if approaching 10M documents

**Phase 2 (Future)**:
- Archive logs >6 months to external storage
- Keep aggregated metrics in Sanity
- Implement log rotation pipeline

### Complexity Assessment
✅ **Complexity ≤ 5**
- Log creation: Single document write (complexity = 1)
- Query by action type: Single GROQ filter (complexity = 1)
- Aggregation queries: Single count() operation (complexity = 1)

---

## 5. Role-Based Access Control in Sanity Studio

### Question
How to implement granular role-based permissions in Sanity Studio?

### Decision
**Sanity Built-in Roles + Custom Document-Level Access Rules**

### Rationale

**Role Definitions**:
```typescript
// sanity.config.ts
export default defineConfig({
  // ... other config
  document: {
    actions: (prev, context) => {
      const { schemaType, currentUser } = context
      
      // Editors cannot access certain document types
      if (currentUser.roles.includes('editor')) {
        if (['user', 'adPlacement', 'affiliatePartner', 'activityLog'].includes(schemaType)) {
          return []  // Remove all actions (read-only or hidden)
        }
      }
      
      return prev
    }
  }
})
```

**Permission Matrix**:

| Document Type | Admin (CRUD) | Editor (CRUD) |
|---------------|--------------|---------------|
| Video | ✅ Create, Read, Update, Delete | ✅ Create, Read, Update, Delete |
| Category | ✅ Create, Read, Update, Delete | ✅ Create, Read, Update, Delete |
| AdPlacement | ✅ Create, Read, Update, Delete | ❌ No access |
| AffiliatePartner | ✅ Create, Read, Update, Delete | ❌ No access |
| User | ✅ Create, Read, Update, Delete | ❌ No access |
| ActivityLog | ✅ Read only | ❌ No access |

**Custom Validation (prevent self-deletion)**:
```typescript
// schemaTypes/documents/user.ts
export default defineType({
  name: 'user',
  type: 'document',
  validation: Rule => Rule.custom((doc, context) => {
    const currentUserId = context.currentUser?._id
    const isDeleting = context.document?._id && !doc
    
    if (isDeleting && context.document._id === currentUserId) {
      return 'You cannot delete your own account'
    }
    
    return true
  })
})
```

**Access Control at Document Level**:
- Sanity's native role system handles Studio UI permissions
- API tokens scoped to roles (admin token vs editor token)
- Custom validation prevents unauthorized operations
- Field-level permissions via conditional fields (e.g., hide `addedBy` from editors)

**Authentication Flow**:
```
1. User logs in via Sanity OAuth (Google, GitHub, etc.)
2. Sanity Studio checks user's role (admin or editor)
3. UI shows/hides document types based on role
4. Document actions filtered by role
5. API requests include user token (role enforced server-side)
```

### Alternatives Considered

**1. Custom authentication system**
- ❌ Duplicates Sanity's built-in auth
- ❌ Complex to maintain
- ✅ Full control over permissions
- **Rejected**: Reinventing the wheel

**2. Third-party auth (Auth0, Clerk)**
- ❌ Additional cost
- ❌ Requires integration layer
- ✅ Advanced features (2FA, SSO)
- **Rejected**: Sanity auth sufficient for 5-10 users

**3. Single admin role (no editors)**
- ❌ Doesn't scale with team growth
- ❌ Too permissive for content managers
- ✅ Simplest to implement
- **Rejected**: Spec requires admin/editor separation

### Future Enhancements

**Field-Level Permissions** (if needed):
```typescript
{
  name: 'sensitiveField',
  type: 'string',
  hidden: ({ currentUser }) => !currentUser.roles.includes('admin')
}
```

**Custom Roles** (e.g., "Moderator"):
- Define new role in Sanity project settings
- Update document actions logic
- Add role to user schema as dropdown

### Complexity Assessment
✅ **Complexity ≤ 5**
- Role check: Single array includes() (complexity = 1)
- Document action filtering: Single if-check (complexity = 1)
- Self-deletion validation: Single ID comparison (complexity = 1)

---

## 6. Affiliate Click Tracking and Attribution

### Question
How to accurately track affiliate ad clicks while maintaining privacy?

### Decision
**Server-Side Redirect with Activity Log Entry**

### Rationale

**Click Tracking Flow**:
```
1. Ad rendered with tracking URL: 
   <a href="/api/track/click?adId=ad-123&session=xyz">
   
2. User clicks ad → Request to /api/track/click

3. Server-side handler:
   a. Parse adId and sessionId from query params
   b. Create activity log entry:
      {
        actionType: 'ad.click',
        resourceId: 'ad-123',
        sessionId: 'xyz',
        metadata: {
          clickDestination: 'https://partner.com/track?id=123',
          timestamp: Date.now()
        }
      }
   c. Respond with 302 redirect to affiliate tracking URL

4. User lands on affiliate site (with their tracking params)
```

**Server-Side Handler** (Sanity webhook or Next.js API route):
```typescript
// /api/track/click.ts
export default async function handler(req, res) {
  const { adId, session } = req.query
  
  // Fetch ad details from Sanity
  const ad = await sanityClient.fetch(`*[_id == $adId][0]`, { adId })
  
  // Log click event
  await sanityClient.create({
    _type: 'activityLog',
    actionType: 'ad.click',
    resourceType: 'ad',
    resourceId: adId,
    sessionId: session,
    metadata: {
      adPosition: ad.position,
      adType: ad.type,
      clickDestination: ad.affiliatePartner.trackingUrlTemplate
        .replace('{adId}', adId)
        .replace('{sessionId}', session),
      timestamp: new Date().toISOString()
    }
  })
  
  // Redirect to affiliate tracking URL
  const trackingUrl = buildTrackingUrl(ad, adId, session)
  res.redirect(302, trackingUrl)
}
```

**Session Management**:
```typescript
// Client-side session ID generation (privacy-friendly)
function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = crypto.randomUUID()  // Browser-native UUID
    sessionStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}
```

**Privacy Compliance**:
- No third-party cookies used
- Session ID stored in sessionStorage (not persisted across browsers)
- IP address optionally stored (anonymized: last octet removed)
- Compliant with GDPR (no PII without consent)

**Attribution Accuracy**:
- Server-side logging eliminates client-side failures (ad blockers)
- 302 redirect ensures click always attributed
- Session ID enables multi-touch attribution (future)
- Timestamp allows deduplication (same user, multiple clicks)

### Alternatives Considered

**1. Client-side tracking (JavaScript event listener)**
- ❌ Ad blockers prevent tracking
- ❌ Client-side failures (network errors)
- ✅ Simpler implementation (no server needed)
- **Rejected**: Fails 99.9% accuracy requirement (SC-005)

**2. Direct affiliate links (no tracking)**
- ❌ Zero attribution
- ❌ Can't calculate conversion rates
- ✅ Simplest (no custom logic)
- **Rejected**: Requirement explicitly mentions tracking

**3. Third-party tracking pixel**
- ❌ Requires affiliate partner integration
- ❌ Limited control over data
- ✅ Industry-standard approach
- **Rejected**: Want first-party data ownership

### Impression Tracking (Parallel Implementation)

**Intersection Observer** (client-side):
```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.impressed) {
      // Log impression via API (not redirect)
      fetch('/api/track/impression', {
        method: 'POST',
        body: JSON.stringify({
          adId: entry.target.dataset.adId,
          sessionId: getOrCreateSessionId(),
          visibleDuration: Date.now() - entry.target.dataset.visibleSince
        })
      })
      entry.target.dataset.impressed = 'true'
    }
  })
}, { threshold: 0.5 })
```

**Impression vs Click**:
- Impression: Ad becomes 50%+ visible in viewport
- Click: User interacts with ad (server-side redirect)
- Both logged to activity log for conversion rate calculation

### Complexity Assessment
✅ **Complexity ≤ 5**
- Click handler: Parse params → log → redirect (complexity = 3)
- Session ID generation: Check storage → generate UUID (complexity = 2)
- Impression observer: Single if-check (complexity = 1)

---

## Technology Stack Summary

Based on research findings, the final technology stack:

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| CMS | Sanity Studio | 5.2.0 | Headless CMS with real-time collaboration |
| Language | TypeScript | 5.8+ | Type safety, IDE support |
| Frontend Framework | React | 19.1 | Sanity Studio built on React |
| Styling | Styled Components | 6.1+ | Component-scoped CSS |
| Schema Definition | Sanity Schema | V3 | Declarative schema with validation |
| API | Sanity Client | 6.0+ | Real-time data sync |
| YouTube Integration | oEmbed API | N/A | No API key, simple REST endpoint |
| Click Tracking | Server-side redirect | Custom | 99.9% accuracy, privacy-compliant |
| Activity Logging | Sanity documents | Native | Queryable, scalable to 10M docs |
| Access Control | Sanity roles | Native | Built-in, document-level permissions |

---

## Risk Mitigation Summary

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| YouTube API rate limits | Medium | Medium | Use oEmbed (no key), cache responses |
| Category hierarchy depth > 10 | Low | Medium | Enforce depth limit in validation |
| Activity log query performance | Medium | High | Index on timestamp, actionType, userId |
| Layout shift from dynamic ads | Medium | High | CSS Grid with fixed ad heights |
| Unauthorized access | Low | Critical | Sanity role system + custom validation |
| YouTube metadata extraction failure | Medium | Low | Manual entry fallback |

---

## Open Questions (For Implementation Phase)

1. **Log Rotation**: At what threshold do we archive old activity logs? (Recommend: 6 months)
2. **Category Icons**: Should we provide default icon set or require custom uploads? (Recommend: default set + custom)
3. **Ad Preview**: Should admins see live ad preview in Studio? (Recommend: yes, via custom input component)
4. **Session Duration**: How long should session IDs persist? (Recommend: sessionStorage = single browser session)
5. **Video Status Workflow**: Should there be approval process for draft → published? (Recommend: no, trust editors)

---

**Research Phase Status**: ✅ COMPLETE  
**All NEEDS CLARIFICATION items**: ✅ RESOLVED  
**Ready for**: Phase 1 - Data Model & Contracts  
**Constitution Compliance**: ✅ All complexity limits maintained (≤ 5)
