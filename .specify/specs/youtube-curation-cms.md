# Feature Specification: YouTube Video Curation CMS

**Feature Branch**: `001-youtube-curation-cms`  
**Created**: 2026-01-10  
**Status**: Draft  
**Input**: User description: "Create a CMS for creating curated list of youtube videos(embedding) based on age and categories. There should be an option to create ads anywhere on the page dynamically without breaking the responsive layout of view. Only admins or users added by admin can perform CRUD operations. Logs should be created in such a way so that I can create dashboard for it on analytics on it later. I should be able to onboard affilate marketing ads. Remove the existing movie samples and its related files/schema etc"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Creates Video Collection (Priority: P1)

An admin needs to create a curated collection of YouTube videos for a specific age group (e.g., "3-5 years" or "6-8 years") and category (e.g., "Educational", "Entertainment", "Music"). The collection should be easily manageable and support YouTube video embedding.

**Why this priority**: Core functionality - without this, the CMS has no purpose. This is the foundational feature that enables all other functionality.

**Independent Test**: Admin can log in, create a new Video Collection with title, age group, category, add YouTube video URLs, preview embedded videos, and publish the collection. The collection can be viewed on the frontend with properly embedded YouTube videos.

**Acceptance Scenarios**:

1. **Given** admin is logged into Sanity Studio, **When** they create a new Video Collection with title "Learning Colors", age group "3-5", category "Educational", and add 5 YouTube URLs, **Then** the collection is saved and videos are validated as proper YouTube links
2. **Given** admin has created a collection, **When** they preview it, **Then** all YouTube videos render properly with embeds
3. **Given** admin selects an age group, **When** they save the collection, **Then** the age group metadata is stored for filtering
4. **Given** admin adds invalid URL, **When** they try to save, **Then** system shows validation error with helpful message

---

### User Story 2 - Dynamic Ad Placement Management (Priority: P1)

An admin needs to create and place ads (banner ads, affiliate marketing ads) anywhere within a video collection page without breaking the responsive layout. Ads should be insertable between video groups, at the top, bottom, or as floating elements.

**Why this priority**: Revenue generation is critical for sustainability. This is the monetization foundation and must work seamlessly with content.

**Independent Test**: Admin can create an ad document with type (banner/affiliate), positioning rules, and content. When viewing a collection, ads appear in designated positions and maintain responsive layout on mobile, tablet, and desktop.

**Acceptance Scenarios**:

1. **Given** admin creates a banner ad with position "after-video-3", **When** users view the collection, **Then** the ad appears after the 3rd video without breaking layout
2. **Given** admin creates an affiliate ad with flexible positioning, **When** they assign it to a collection, **Then** the ad displays responsively across all device sizes
3. **Given** multiple ads exist, **When** admin sets priority levels, **Then** ads appear in correct order based on priority
4. **Given** admin updates ad content, **When** they publish changes, **Then** changes reflect immediately without republishing collections

---

### User Story 3 - Age-Based Filtering and Categories (Priority: P2)

Parents/users need to filter video collections by age group and category to find age-appropriate content quickly. The system should support multiple age ranges and custom categories.

**Why this priority**: User experience and content discovery. Essential for users to find relevant content, but the CMS can function without filtering initially.

**Independent Test**: User can navigate to the frontend, select age filter "3-5 years" and category "Educational", and see only matching collections. Filters work independently and in combination.

**Acceptance Scenarios**:

1. **Given** collections exist for ages 3-5, 6-8, and 9-12, **When** user selects "6-8 years" filter, **Then** only 6-8 collections display
2. **Given** user selects age "3-5" AND category "Music", **When** filters are applied, **Then** only collections matching both criteria appear
3. **Given** no collections match filters, **When** user applies filters, **Then** friendly "no content found" message displays
4. **Given** categories include "Educational", "Entertainment", "Music", "Arts & Crafts", **When** admin creates collection, **Then** they can select multiple categories

---

### User Story 4 - Role-Based Access Control (Priority: P2)

Only admins and users explicitly added by admins can perform CRUD operations in Sanity Studio. Regular users (parents) can only view published content on the frontend.

**Why this priority**: Security and content quality control. Critical for protecting content integrity, but can be implemented after core content management is working.

**Independent Test**: Attempt to access Sanity Studio without admin credentials fails. Admin can invite a content editor with specific permissions. Editors can create/edit collections but cannot manage users or ads.

**Acceptance Scenarios**:

1. **Given** user without admin role, **When** they try to access Sanity Studio, **Then** access is denied with appropriate message
2. **Given** admin invites new editor with email, **When** editor accepts invite, **Then** editor can access Studio with limited permissions
3. **Given** editor role exists, **When** they try to delete a collection, **Then** system checks if they have delete permission
4. **Given** admin manages roles, **When** they revoke editor access, **Then** editor can no longer access Studio

---

### User Story 5 - Comprehensive Activity Logging (Priority: P2)

All admin and editor actions (create, update, delete, publish) are logged with timestamp, user, action type, and affected resource for future analytics dashboard creation.

**Why this priority**: Enables data-driven decisions and audit trail. Important but not required for initial launch. Analytics can be added post-launch.

**Independent Test**: Admin creates a collection, updates it, publishes it, and then queries the activity log. All three actions appear with correct timestamps, user information, and action details in a format ready for analytics ingestion.

**Acceptance Scenarios**:

1. **Given** admin creates a video collection, **When** action completes, **Then** log entry created with: timestamp, admin ID, action="create", resource_type="video_collection", resource_id, metadata
2. **Given** editor updates ad placement, **When** save completes, **Then** log captures before/after states for change tracking
3. **Given** admin deletes content, **When** deletion occurs, **Then** soft delete logged with restoration capability
4. **Given** 30 days of activity logs exist, **When** querying logs, **Then** data is structured for easy dashboard creation (JSON format with consistent schema)
5. **Given** user views content on frontend, **When** video is played, **Then** view event logged with video_id, collection_id, user_agent, timestamp

---

### User Story 6 - Affiliate Marketing Ad Management (Priority: P3)

Admin needs to onboard affiliate partners by creating affiliate ad templates with tracking parameters, conversion tracking, and performance metrics preparation.

**Why this priority**: Advanced monetization feature. Can be launched after basic ad functionality is working and generating traffic.

**Independent Test**: Admin creates an affiliate ad with partner name, tracking URL with parameters, conversion pixel, and commission rate. When user clicks ad, tracking URL fires correctly and click is logged for future analytics.

**Acceptance Scenarios**:

1. **Given** admin creates affiliate ad for Partner X, **When** they set tracking parameters (utm_source, affiliate_id), **Then** final URL includes all tracking parameters
2. **Given** affiliate ad is clicked, **When** user interacts, **Then** click logged with: timestamp, collection_id, ad_id, partner_id, user_session
3. **Given** multiple affiliate partners exist, **When** admin assigns ads to collections, **Then** they can set rotation rules (equal rotation, weighted, A/B testing)
4. **Given** affiliate requires conversion tracking, **When** admin adds conversion pixel, **Then** pixel fires on designated user actions
5. **Given** admin reviews affiliate performance, **When** they access analytics data structure, **Then** logs contain: clicks, impressions, estimated conversions per partner

---

### User Story 7 - Video Collection Organization (Priority: P3)

Admin can organize videos within a collection into sections/groups with headings (e.g., "Introduction Videos", "Advanced Topics") for better content structure.

**Why this priority**: Enhanced UX for complex collections. Nice-to-have that improves content presentation but not required for MVP.

**Independent Test**: Admin creates a collection, adds section heading "Basics", adds 3 videos, adds another section "Advanced", adds 2 videos. Frontend displays videos grouped under headings with proper visual separation.

**Acceptance Scenarios**:

1. **Given** admin creates collection, **When** they add section "Introduction", **Then** section appears as organizational unit for videos
2. **Given** sections exist, **When** admin drags videos between sections, **Then** video order updates within correct section
3. **Given** section has description field, **When** admin adds description, **Then** description displays above section videos on frontend

---

### Edge Cases

- **Invalid YouTube URLs**: What happens when admin enters a non-YouTube URL or invalid YouTube video ID?
  - System validates URL format and extracts video ID
  - Shows error message with example of valid format
  - Prevents saving until valid URL provided

- **Deleted YouTube Videos**: What happens when an embedded YouTube video is deleted by owner?
  - System logs broken embed on frontend
  - Admin receives notification of broken videos
  - Collection remains accessible with placeholder or skip broken video

- **Ad Blocker Impact**: How does system handle users with ad blockers?
  - Ads fail gracefully without breaking layout
  - Affiliate tracking attempts but doesn't block content
  - Log ad blocker detection for analytics

- **Concurrent Admin Edits**: What happens when two admins edit same collection simultaneously?
  - Sanity's real-time sync handles conflicts
  - Last save wins with notification to both admins
  - Version history allows recovery

- **Age Range Overlaps**: How to handle content suitable for multiple age groups?
  - Collections support multiple age ranges (e.g., "6-8" and "9-12")
  - Filtering shows collection if ANY selected age matches

- **Excessive Ads**: What prevents admin from placing too many ads and ruining UX?
  - Recommended maximum: 1 ad per 5 videos
  - Warning shown when exceeding recommendation
  - Preview mode shows ad density impact

- **Mobile Responsive Ads**: How do large banner ads work on mobile?
  - Ad component supports responsive sizes
  - Different creative sizes for mobile/tablet/desktop
  - Fallback to smaller size if large ad unavailable

- **Logging Volume**: What happens when activity logs grow large?
  - Log rotation policy: archive logs older than 90 days
  - Indexed by date for efficient querying
  - Summary metrics pre-computed for dashboard

- **YouTube API Rate Limits**: What if validation requires YouTube API calls?
  - Cache video metadata locally
  - Queue validation checks to respect rate limits
  - Graceful degradation: accept valid URL format without full validation

## Requirements *(mandatory)*

### Functional Requirements

#### Content Management

- **FR-001**: System MUST allow admins to create, read, update, and delete Video Collections
- **FR-002**: System MUST validate YouTube URLs and extract video IDs (formats: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID)
- **FR-003**: System MUST support multiple age range selections per collection: "0-2", "3-5", "6-8", "9-12", "13-15", "16-18"
- **FR-004**: System MUST support predefined categories: "Educational", "Entertainment", "Music", "Arts & Crafts", "Science", "Storytelling", "Exercise", "Other"
- **FR-005**: System MUST allow admins to add custom categories beyond predefined ones
- **FR-006**: System MUST store video metadata: title, description, YouTube video ID, order position, duration (optional), thumbnail URL
- **FR-007**: System MUST support video ordering within collections via drag-and-drop or numeric ordering
- **FR-008**: System MUST provide rich text editor for collection descriptions using Sanity's Portable Text

#### Ad Management

- **FR-009**: System MUST support ad types: banner ads, affiliate marketing ads, video ads (future)
- **FR-010**: System MUST allow ad positioning: top-of-page, bottom-of-page, after-video-N, between-sections, floating/sticky
- **FR-011**: System MUST support responsive ad sizes: mobile (320x50, 300x250), tablet (728x90), desktop (970x250, 300x600)
- **FR-012**: System MUST allow admins to set ad priority/weight for rotation
- **FR-013**: System MUST support affiliate tracking parameters: utm_source, utm_medium, utm_campaign, affiliate_id, custom params
- **FR-014**: System MUST allow enabling/disabling ads without deletion
- **FR-015**: System MUST support ad scheduling: start date, end date, always active
- **FR-016**: System MUST validate ad content doesn't contain malicious scripts
- **FR-017**: System MUST provide ad preview before publishing

#### Access Control

- **FR-018**: System MUST restrict Sanity Studio access to authenticated users only
- **FR-019**: System MUST support roles: Admin (full access), Editor (content CRUD, no user management, no ad creation), Viewer (read-only)
- **FR-020**: System MUST allow admins to invite new users via email
- **FR-021**: System MUST allow admins to revoke user access
- **FR-022**: System MUST enforce role-based permissions at document level (collections, ads, users)
- **FR-023**: System MUST log all authentication attempts (success and failure)

#### Activity Logging

- **FR-024**: System MUST log all CRUD operations with schema:
  ```json
  {
    "timestamp": "ISO-8601",
    "user_id": "string",
    "user_email": "string",
    "action": "create|update|delete|publish|unpublish",
    "resource_type": "video_collection|ad|user|category",
    "resource_id": "string",
    "resource_title": "string",
    "changes": {
      "before": "object (for updates)",
      "after": "object"
    },
    "ip_address": "string",
    "user_agent": "string"
  }
  ```

- **FR-025**: System MUST log frontend user interactions:
  ```json
  {
    "timestamp": "ISO-8601",
    "event_type": "video_view|ad_click|ad_impression|collection_view",
    "video_id": "string (if applicable)",
    "collection_id": "string",
    "ad_id": "string (if applicable)",
    "affiliate_partner": "string (if applicable)",
    "session_id": "string",
    "user_agent": "string",
    "device_type": "mobile|tablet|desktop",
    "country": "string (from IP)",
    "referrer": "string"
  }
  ```

- **FR-026**: System MUST support log export in JSON format for analytics ingestion
- **FR-027**: System MUST provide log querying by date range, user, action type, resource type
- **FR-028**: System MUST implement log retention policy: 90 days active, archive after that

#### Frontend Rendering

- **FR-029**: System MUST render YouTube videos using iframe embed with privacy-enhanced mode (youtube-nocookie.com)
- **FR-030**: System MUST implement responsive grid layout: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- **FR-031**: System MUST lazy-load YouTube embeds for performance (load on scroll)
- **FR-032**: System MUST insert ads at designated positions without breaking grid layout
- **FR-033**: System MUST support filtering by age range(s) and category(ies)
- **FR-034**: System MUST show video count, total duration per collection (if available)
- **FR-035**: System MUST implement SEO-friendly URLs: /collections/[slug]

#### Migration from Existing Schema

- **FR-036**: System MUST remove all movie-related schema: movie.ts, person.ts, screening.ts, castMember.ts, crewMember.ts, plotSummary.ts, plotSummaries.ts
- **FR-037**: System MUST remove movie-related data from Sanity dataset (after backup confirmation)
- **FR-038**: System MUST update Sanity configuration to reflect new schema
- **FR-039**: System MUST maintain blockContent.ts if compatible with new schema, otherwise replace

### Key Entities

#### VideoCollection
**Purpose**: Main content type representing a curated list of YouTube videos  
**Attributes**: 
- title (string, required)
- slug (auto-generated from title)
- description (portable text, optional)
- ageRanges (array of strings: ["3-5", "6-8"])
- categories (array of strings)
- videos (array of VideoItem objects)
- featuredImage (image, optional)
- published (boolean, default: false)
- publishedAt (datetime)
- adPlacements (array of references to Ad documents)
- createdBy (reference to User)
- updatedBy (reference to User)
- createdAt (datetime)
- updatedAt (datetime)

**Relationships**: 
- Has many VideoItem (embedded objects)
- References many Ad documents
- Belongs to User (creator)

#### VideoItem
**Purpose**: Individual YouTube video within a collection (embedded object, not standalone document)  
**Attributes**:
- youtubeUrl (string, required)
- youtubeId (string, extracted from URL)
- title (string, optional override)
- description (text, optional)
- order (number)
- thumbnailUrl (string, auto-fetched)
- duration (number in seconds, optional)
- section (string, for grouping, optional)

**Relationships**: Embedded within VideoCollection

#### Ad
**Purpose**: Advertisement content with placement and targeting rules  
**Attributes**:
- name (string, internal reference)
- type (string: "banner" | "affiliate" | "video")
- status (string: "active" | "paused" | "expired")
- content (object with HTML/image/video depending on type)
- positioning (object):
  - type (string: "top" | "bottom" | "after-video" | "floating")
  - afterVideoIndex (number, if type is "after-video")
  - priority (number)
- responsiveSizes (object):
  - mobile (image or dimensions)
  - tablet (image or dimensions)
  - desktop (image or dimensions)
- schedule (object):
  - startDate (datetime, optional)
  - endDate (datetime, optional)
  - alwaysActive (boolean)
- affiliateData (object, if type is "affiliate"):
  - partnerName (string)
  - trackingUrl (string)
  - commissionRate (number, for reference)
  - customParams (object of key-value pairs)
- targetingRules (object, optional):
  - ageRanges (array)
  - categories (array)
  - collections (array of references)
- impressions (number, updated via webhook)
- clicks (number, updated via webhook)
- createdBy (reference to User)
- createdAt (datetime)
- updatedAt (datetime)

**Relationships**: Referenced by VideoCollection, belongs to User (creator)

#### AgeRange
**Purpose**: Enumeration/taxonomy for age groups (can be managed as simple array or dedicated document)  
**Attributes**:
- value (string: "0-2", "3-5", etc.)
- label (string: "Toddlers (0-2)", "Preschool (3-5)", etc.)
- description (text, optional)
- order (number)

**Relationships**: Referenced by VideoCollection

#### Category
**Purpose**: Content categorization taxonomy  
**Attributes**:
- title (string)
- slug (slug)
- description (text, optional)
- icon (string or image, optional)
- order (number)
- parentCategory (reference to Category, for hierarchical categories, optional)

**Relationships**: Referenced by VideoCollection, self-referential for subcategories

#### ActivityLog
**Purpose**: Audit trail for all system actions  
**Attributes**:
- timestamp (datetime)
- userId (string)
- userEmail (string)
- action (string)
- resourceType (string)
- resourceId (string)
- resourceTitle (string)
- changesBefore (object, JSON)
- changesAfter (object, JSON)
- ipAddress (string)
- userAgent (string)
- metadata (object, flexible additional data)

**Relationships**: References User, references various resource types polymorphically

#### UserInteractionLog
**Purpose**: Frontend user interaction tracking for analytics  
**Attributes**:
- timestamp (datetime)
- eventType (string: "video_view", "ad_click", "ad_impression", "collection_view")
- videoId (string, optional)
- collectionId (string, required)
- adId (string, optional)
- affiliatePartner (string, optional)
- sessionId (string)
- userAgent (string)
- deviceType (string)
- country (string)
- referrer (string)
- duration (number, for video views)

**Relationships**: References VideoCollection, Video, Ad

#### User (Managed by Sanity)
**Purpose**: Admin/Editor accounts  
**Attributes**:
- email (string)
- name (string)
- role (string: "admin" | "editor" | "viewer")
- avatar (image, optional)
- invitedBy (reference to User)
- lastLoginAt (datetime)
- createdAt (datetime)

**Relationships**: Creates VideoCollections, Ads, invites other Users

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can create a new video collection with 10 YouTube videos in under 5 minutes
- **SC-002**: All YouTube video embeds load and play correctly on mobile, tablet, and desktop devices
- **SC-003**: Ads maintain responsive layout with zero layout shift (CLS score) on all device sizes
- **SC-004**: Age range and category filters return results in under 500ms for collections up to 1000 items
- **SC-005**: Activity logs capture 100% of CRUD operations with complete metadata
- **SC-006**: Log data exports in format ready for analytics dashboard ingestion (JSON with consistent schema)
- **SC-007**: Affiliate ad tracking parameters correctly append to destination URLs 100% of the time
- **SC-008**: Non-admin users cannot access Sanity Studio (100% access denial rate)
- **SC-009**: Admins can invite new editors and editors receive access within 5 minutes
- **SC-010**: System handles 1000 concurrent video views without performance degradation
- **SC-011**: Page load time remains under 3 seconds on 3G connection with lazy-loaded videos
- **SC-012**: Ad blocker detection logs correctly identify 95%+ of users with ad blockers
- **SC-013**: All existing movie schema and data successfully removed with zero impact on new functionality
- **SC-014**: Video collections render correctly with 0-10 ads per page without layout breaks
- **SC-015**: Frontend allows filtering by multiple age ranges and categories simultaneously with instant updates
- **SC-016**: 90% of first-time admins can create and publish a collection without documentation
- **SC-017**: Affiliate click-through tracking achieves 98%+ accuracy compared to partner dashboards
- **SC-018**: System maintains audit trail for 100% of sensitive operations (delete, user management, ad creation)

## Technical Constraints

### Platform
- Built on Sanity CMS v5.2.0+
- TypeScript strict mode enabled
- React 19+ for custom components
- Adheres to Constitution: cyclomatic complexity ≤ 5, SOLID principles

### Performance
- Lighthouse score ≥ 90 for performance, accessibility, SEO
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Bundle size < 200KB (gzipped) for frontend

### Security
- Content Security Policy headers configured
- XSS protection for ad content
- HTTPS only
- Rate limiting on API endpoints
- Sanity CORS configuration

### Browser Support
- Last 2 versions of Chrome, Firefox, Safari, Edge
- iOS Safari 13+
- Android Chrome 90+

### Compliance
- COPPA compliance for children's content
- GDPR considerations for EU users (logging consent)
- YouTube Terms of Service compliance

## Out of Scope (Future Iterations)

- Video analytics (watch time, completion rate) - requires custom player
- User accounts for parents (no login on frontend initially)
- Playlist creation by end-users
- Social sharing features
- Comments/ratings on collections
- Multi-language support
- Video search within collections
- YouTube API integration for auto-metadata fetching
- Real-time collaboration in Studio (Sanity native feature, not custom)
- Email notifications for new collections
- Mobile app (web-only initially)

## Open Questions

1. **YouTube API Integration**: Should we integrate YouTube Data API for automatic video metadata (title, duration, thumbnail) or rely on manual entry? API has quota limits but improves UX.

2. **Log Storage**: Where should activity logs be stored? Options:
   - Sanity documents (simple but may get expensive)
   - External service (Segment, Mixpanel) - better for analytics
   - Self-hosted (PostgreSQL, MongoDB) - more control

3. **Ad Serving**: Should ads be served directly from Sanity or integrated with ad network (Google Ad Manager)?

4. **Affiliate Tracking**: Do we need server-side tracking or is client-side sufficient? Server-side prevents ad blockers but adds complexity.

5. **Video Validation**: Should system validate that YouTube videos are still available? This requires YouTube API calls and adds complexity.

6. **Age Verification**: Should frontend have age gate/verification before showing content? COPPA implications.

7. **Collections Per Page**: What's the maximum number of collections to display? Need pagination strategy.

8. **Ad Refresh**: Should ads rotate/refresh on same page or stay static per session?

9. **Backup Strategy**: How should old movie data be backed up before deletion? Export to JSON? Keep in separate dataset?

10. **Custom Domain**: Will this be hosted on custom domain or Sanity's provided domain?

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-10 | System | Initial specification created |

---

**Next Steps**:
1. Review and approve specification
2. Clarify open questions
3. Create detailed implementation plan
4. Design schema architecture
5. Set up development environment
6. Begin P1 user story implementation
