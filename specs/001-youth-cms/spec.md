# Feature Specification: Youth Content CMS with Dynamic Ad Management

**Feature Branch**: `001-youth-cms`  
**Created**: 2026-01-10  
**Status**: Draft  
**Input**: User description: "Create a CMS for creating curated list of youtube videos(embedding) based on age and categories. There should be an option to create ads anywhere on the page dynamically without breaking the responsive layout of view. Only admins or users added by admin can perform CRUD operations. Logs should be created in such a way so that I can create dashboard for it on analytics on it later. I should be able to onboard affilate marketing ads. Remove the existing movie samples and its related files/schema etc"

## Clarifications

### Session 2026-01-10

- Q: Category Structure - Should categories support parent-child relationships or remain flat? → A: HIERARCHICAL - Categories should support parent-child relationships with unlimited nesting depth (e.g., Education → Math → Algebra). Each category can have optional sub-categories. Videos can be assigned to categories at any level. Frontend should display hierarchical navigation/filtering.
- Q: Category Deletion Behavior - Should videos lose the deleted category assignment or should category deletion be blocked if videos are assigned? → A: BLOCK DELETION - System MUST block category deletion if any videos are assigned to it. Display error message with count of affected videos. Admin must manually reassign videos to other categories OR delete videos before category can be deleted.

### Session 2026-01-10 (Architectural Update)

- **CRITICAL ARCHITECTURAL CHANGE - Age Ranges as Root Categories**: Age ranges (0-2, 2-4, 5-7, 8-9, 10-15, 16+, 18+) are NOW the top-level parent categories of the entire content hierarchy. All content categories (Education, Entertainment, Music, etc.) exist UNDER these age range categories. This means:
  - The category hierarchy structure is: **Age Range → Content Category → Sub-Category (if any)**
  - Example: "5-7 years → Education → Math → Basic Addition"
  - Videos are assigned to leaf categories within this age-first hierarchy
  - Filtering by age automatically shows only categories and videos under that age range branch
  - Each age range can have its own independent set of content categories and sub-categories
  - The same content category name (e.g., "Education") can exist under multiple age ranges as separate branches
  - Age ranges are predefined and cannot be deleted or modified by admins
  - There is NO separate "age group" entity - age ranges are integral to the category structure itself

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Adds YouTube Videos to Age-Based Categories (Priority: P1)

An administrator logs into the CMS, navigates to the video management section, and adds a new YouTube video by pasting its URL. They assign it to a specific category within the age range hierarchy (e.g., 5-7 years → Education → Math → Basic Addition). The video becomes available for viewing on the front-end under that specific age-based category path.

**Why this priority**: This is the core functionality of the CMS. Without the ability to curate and categorize YouTube videos within age-based categories, the system has no value. This represents the MVP.

**Independent Test**: Can be fully tested by creating an admin user, adding a YouTube video with category assignment under an age range, and verifying it appears correctly in the front-end filtered views within the age-based hierarchy. Delivers immediate value by enabling content curation.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they paste a YouTube URL and assign it to category path "5-7 years → Education → Math", **Then** the video is saved with extracted metadata (title, thumbnail) and appears under that category path
2. **Given** a video has been added to "5-7 years → Education → Math", **When** a visitor navigates to the "5-7 years" age range, **Then** they see the Education category and can drill down to Math to find the video
3. **Given** an admin adds an invalid YouTube URL, **When** they attempt to save, **Then** they receive a clear error message indicating the URL is invalid
4. **Given** a video exists under "5-7 years → Education → Math", **When** an admin reassigns it to "8-9 years → Science → Biology", **Then** the video moves to the new category path and is removed from the old one

---

### User Story 2 - Admin Manages Access Control and User Roles (Priority: P2)

The primary administrator can create additional admin or editor users by providing their name and email. Only users added by an admin can access the CMS. Each action (login, user creation, user status change) is logged for audit purposes.

**Why this priority**: Access control is critical for security and content quality, but the CMS can function with a single admin initially. This should be implemented before content scales.

**Independent Test**: Can be tested by creating a main admin account, adding a new user through the admin panel, verifying login restrictions for non-added users, and checking that user management actions are logged. Delivers value by enabling team collaboration.

**Acceptance Scenarios**:

1. **Given** a primary admin is logged in, **When** they add a new user with email and role "Editor", **Then** the new user receives access credentials and appears in the user list
2. **Given** a user has not been added by an admin, **When** they attempt to access the CMS, **Then** they are denied access with a clear message
3. **Given** an admin adds a new user, **When** this action is logged, **Then** the activity log captures the admin's identity, timestamp, and new user details
4. **Given** an admin deactivates a user, **When** that user attempts to log in, **Then** they receive an "account disabled" message and cannot access the system

---

### User Story 3 - Admin Places Dynamic Ads with Responsive Layout (Priority: P2)

An administrator creates ad placements by specifying the ad type (affiliate or banner), position (header, sidebar, inline between videos, footer), priority, and ad content or tracking code. The system dynamically renders ads in the specified positions while maintaining responsive layout across all devices.

**Why this priority**: Monetization through ads is important for sustainability but secondary to content curation. The system delivers value without ads initially.

**Independent Test**: Can be tested by creating various ad placements in different positions, verifying they render correctly on desktop, tablet, and mobile viewports, and confirming layout integrity is maintained. Delivers value by enabling revenue generation.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they create a banner ad for the "header" position with priority 1, **Then** the ad appears at the top of all content pages
2. **Given** multiple ads exist for the same position, **When** the page loads, **Then** the ad with highest priority is displayed
3. **Given** an inline ad is placed between videos, **When** viewed on mobile, **Then** the ad and surrounding video grid maintain proper spacing and don't overlap
4. **Given** an affiliate ad with tracking URL is created, **When** a user clicks the ad, **Then** the click is logged with timestamp and ad identifier for analytics

---

### User Story 4 - System Logs All Activity for Analytics Dashboard (Priority: P3)

Every user action (video views, CRUD operations, ad impressions, ad clicks, user logins) is automatically logged with structured metadata including user identity, action type, resource affected, timestamp, and contextual data. These logs are designed to support future analytics dashboard creation without requiring system changes.

**Why this priority**: Comprehensive logging is valuable for insights but not critical for initial launch. The system can operate without detailed analytics initially.

**Independent Test**: Can be tested by performing various actions (adding videos, clicking ads, viewing content), then querying the activity log to verify all actions are captured with complete metadata. Delivers value by enabling data-driven decision making.

**Acceptance Scenarios**:

1. **Given** a user views a video, **When** the view occurs, **Then** a log entry is created with video ID, user identifier (if logged in), timestamp, and duration watched
2. **Given** an admin deletes a category, **When** the deletion is executed, **Then** the log captures the admin's identity, deleted category details, and timestamp
3. **Given** an ad is displayed, **When** it becomes visible on screen, **Then** an impression log is created with ad ID, position, and timestamp
4. **Given** logs are stored, **When** queried by date range and action type, **Then** results return efficiently for analytics processing

---

### User Story 5 - Admin Onboards Affiliate Marketing Partners (Priority: P3)

An administrator creates affiliate ad entries by providing the partner name, tracking URL, ad creative (image or code snippet), placement position, and activation status. The system tracks clicks and impressions separately for each affiliate partner to support performance reporting.

**Why this priority**: Affiliate marketing is a monetization enhancement but requires established traffic first. This can be added after core content and basic ad functionality exists.

**Independent Test**: Can be tested by creating multiple affiliate ad entries, placing them on the site, generating test impressions and clicks, and verifying accurate tracking per affiliate partner. Delivers value by enabling partnership monetization.

**Acceptance Scenarios**:

1. **Given** an admin creates an affiliate ad with tracking URL "https://partner.com/track?id=123", **When** a user clicks the ad, **Then** they are redirected to the tracking URL and a click event is logged
2. **Given** multiple affiliate ads exist, **When** an admin views the affiliate list, **Then** they see impression and click counts for each partner
3. **Given** an affiliate ad is marked inactive, **When** the page loads, **Then** the ad is not displayed but remains in the system for future activation
4. **Given** an affiliate ad is displayed, **When** it loads on the page, **Then** an impression is logged with affiliate partner ID, timestamp, and ad position

---

### User Story 6 - Admin Organizes Content Within Age-Based Category Hierarchy (Priority: P2)

An administrator creates and manages content categories under age ranges as the root level. Age ranges (0-2, 2-4, 5-7, 8-9, 10-15, 16+, 18+) serve as the top-level parent categories, with content categories (e.g., Education, Entertainment, Music, Stories, Science) existing beneath them. Each age range can have its own set of content categories and subcategories. Videos are assigned to leaf categories within this hierarchy.

**Why this priority**: The age-based hierarchical category organization is essential for content discovery and age-appropriate content filtering. It ensures children only access content suitable for their age range while allowing granular categorization within each age group.

**Independent Test**: Can be tested by creating categories under different age ranges, creating subcategories, assigning videos to leaf categories, and verifying navigation works correctly through the age-first hierarchy. Delivers value by ensuring age-appropriate content organization.

**Acceptance Scenarios**:

1. **Given** an admin navigates to category management, **When** they create a new category "Education" under the age range "5-7 years" with description and icon, **Then** the category appears under "5-7 years" in the hierarchy and is available for video assignment or subcategory creation
2. **Given** the category "5-7 years → Education" exists, **When** an admin creates a subcategory "Math" under it, **Then** the full path "5-7 years → Education → Math" is available for video assignment
3. **Given** a video is assigned to "5-7 years → Education → Math", **When** a visitor selects the "5-7 years" age range, **Then** they see the Education category with Math subcategory containing the video
4. **Given** an admin attempts to delete a category with assigned videos or child categories, **When** the deletion is triggered, **Then** the system blocks the deletion and displays an error message showing the count of affected videos and child categories

---

### Edge Cases

- What happens when a YouTube video URL becomes invalid or the video is deleted from YouTube?
- How does the system handle an admin attempting to delete their own account?
- What happens when an ad position has multiple ads with the same priority level?
- What happens when a video is assigned to a category that is later deleted (after reassigning all videos)?
- What happens when activity logs grow to millions of records - how is query performance maintained?
- How does the system handle duplicate YouTube video URLs being added?
- What happens when an admin attempts to create a category with the same name under the same parent (e.g., two "Math" categories under "5-7 years → Education")?
- How does the system respond when an affiliate tracking URL is unreachable?
- What happens when inline ads are placed between videos but there are fewer videos than ad placements?
- How does the system handle concurrent edits to the same video by multiple admins?
- What happens when an admin attempts to move a category with assigned videos to a different age range branch?
- How does the system handle deep category nesting (e.g., 10+ levels deep) in terms of navigation UI and performance?

## Requirements *(mandatory)*

### Functional Requirements

#### Video Management

- **FR-001**: System MUST allow admins to add YouTube videos by providing the video URL
- **FR-002**: System MUST automatically extract and store video metadata (title, description, thumbnail) from YouTube URLs
- **FR-003**: System MUST allow admins to manually override extracted metadata (title, description, custom thumbnail)
- **FR-004**: System MUST allow admins to assign videos to categories within the age-based hierarchy (e.g., "5-7 years → Education → Math")
- **FR-005**: System MUST allow videos to be assigned only to leaf categories (categories without children) in the hierarchy
- **FR-006**: System MUST support video status management (draft, published, archived)
- **FR-007**: System MUST validate YouTube URLs before saving to prevent invalid entries
- **FR-008**: System MUST detect and warn about duplicate YouTube video URLs
- **FR-009**: System MUST allow admins to edit all video properties after creation
- **FR-010**: System MUST allow admins to delete videos with confirmation prompt
- **FR-011**: System MUST support bulk actions on videos (publish, archive, delete)
- **FR-012**: System MUST display the full category path (e.g., "5-7 years → Education → Math → Basic Addition") when showing video assignments

#### Age-Based Category Hierarchy

- **FR-013**: System MUST implement age ranges (0-2, 2-4, 5-7, 8-9, 10-15, 16+, 18+) as the root-level categories of the entire content hierarchy
- **FR-014**: System MUST allow admins to create content categories (e.g., Education, Entertainment, Music) as children under age range categories
- **FR-015**: System MUST support unlimited hierarchical nesting beneath age range categories (e.g., "5-7 years → Education → Math → Basic Addition → Single Digit")
- **FR-016**: System MUST allow each age range to have its own independent set of content categories and subcategories
- **FR-017**: System MUST allow the same content category name (e.g., "Education") to exist under multiple age ranges as separate branches
- **FR-018**: System MUST allow admins to create categories at any level by specifying the parent category
- **FR-019**: System MUST store each category with its age range root, parent category reference, and path information
- **FR-020**: System MUST allow admins to assign icons or images to categories at any level
- **FR-021**: System MUST provide hierarchical navigation starting with age range selection
- **FR-022**: System MUST filter all content by the selected age range, showing only categories and videos under that age range branch
- **FR-023**: System MUST allow admins to edit category properties (name, description, icon) at any level
- **FR-024**: System MUST allow admins to delete categories that have no assigned videos and no child categories
- **FR-025**: System MUST block category deletion if any videos are assigned to that category
- **FR-026**: System MUST block category deletion if the category has any child categories
- **FR-027**: System MUST display error message "Cannot delete category with assigned videos or subcategories. Please reassign/delete videos and remove subcategories first." when deletion is blocked
- **FR-028**: System MUST show count of affected videos and child categories in the deletion error message
- **FR-029**: System MUST prevent deletion or modification of the predefined age range root categories (0-2, 2-4, 5-7, 8-9, 10-15, 16+, 18+)

#### Dynamic Ad Management

- **FR-030**: System MUST allow admins to create ad placements with type (affiliate, banner), position, content, and priority
- **FR-031**: System MUST support ad positions including: header, footer, sidebar, inline (between video rows), floating overlay
- **FR-032**: System MUST render ads dynamically without breaking responsive layout on mobile, tablet, and desktop
- **FR-033**: System MUST allow admins to set ad priority to control display order when multiple ads target the same position
- **FR-034**: System MUST support active/inactive status for ads without deletion
- **FR-035**: System MUST allow admins to specify ad content as HTML/JavaScript embed code or image with link
- **FR-036**: System MUST display only the highest priority active ad when multiple ads target the same position
- **FR-037**: System MUST allow inline ads to be configured to appear after every N videos in the grid
- **FR-038**: System MUST allow ads to be targeted to specific age ranges (e.g., only show ad when user is viewing "5-7 years" content)

#### Affiliate Marketing

- **FR-039**: System MUST allow admins to create affiliate ad entries with partner name, tracking URL, and creative content
- **FR-040**: System MUST redirect clicks to affiliate tracking URLs while logging the click event
- **FR-041**: System MUST track impressions separately from clicks for each affiliate ad
- **FR-042**: System MUST store affiliate partner metadata (partner name, contact, commission rate) for reference
- **FR-043**: System MUST allow admins to view impression and click counts per affiliate partner

#### Access Control and User Management

- **FR-044**: System MUST restrict all CMS access to users explicitly added by an admin
- **FR-045**: System MUST support two user roles: Admin (full access) and Editor (content management only)
- **FR-046**: System MUST allow admins to create new users by providing name, email, and role
- **FR-047**: System MUST allow admins to activate or deactivate user accounts
- **FR-048**: System MUST prevent users from accessing the CMS if their account is deactivated
- **FR-049**: System MUST track which admin added each user for audit purposes
- **FR-050**: System MUST prevent admins from deleting their own account
- **FR-051**: Editors MUST NOT have access to user management, ad management, or activity logs

#### Activity Logging and Analytics Preparation

- **FR-052**: System MUST log all CRUD operations with user identity, action type, resource type, resource ID, and timestamp
- **FR-053**: System MUST log video view events with video ID, viewer identifier (if available), timestamp, and session data
- **FR-054**: System MUST log ad impression events with ad ID, position, timestamp, and viewer session data
- **FR-055**: System MUST log ad click events with ad ID, timestamp, destination URL, and viewer session data
- **FR-056**: System MUST log user authentication events (login, logout, failed attempts) with user ID and timestamp
- **FR-057**: System MUST store logs in structured format optimized for querying and analytics dashboard creation
- **FR-058**: System MUST include contextual metadata in logs (e.g., video category path, age range, ad type) for rich analytics
- **FR-059**: System MUST allow logs to be filtered by date range, user, action type, and resource type
- **FR-060**: System MUST log category navigation events with full category path (e.g., "5-7 years → Education → Math") for understanding user browsing patterns

#### Data Migration and Cleanup

- **FR-061**: System MUST remove all existing movie-related schema definitions from the codebase
- **FR-062**: System MUST remove all movie sample data and related files
- **FR-063**: System MUST ensure no references to movie schemas remain in configuration files

### Key Entities

- **Video**: Represents a YouTube video with embedded URL, metadata (title, description, thumbnail, duration), assigned category within age-based hierarchy (single category reference with full path like "5-7 years → Education → Math → Basic Addition"), publication status, and timestamps
- **Category**: Represents a node in the age-based content hierarchy with name, slug, description, icon/image reference, age range root identifier (0-2, 2-4, 5-7, 8-9, 10-15, 16+, 18+), optional parent category reference, full path from root, depth level, and relationships to child categories. The age ranges themselves are the root categories (depth 0) with content categories as their children (depth 1+). Categories support unlimited nesting beneath age ranges.
- **Ad Placement**: Represents an advertisement with type (affiliate, banner), position (header, sidebar, inline, footer, floating), content (HTML/JavaScript code or image URL with link), priority level, active status, and targeting rules
- **Affiliate Partner**: Represents an affiliate marketing partner with partner name, tracking URL template, commission rate, contact information, and relationship to ad placements
- **User**: Represents a CMS user with name, email, role (Admin, Editor), status (active, inactive), added-by reference to admin user, and timestamps
- **Activity Log**: Represents a logged event with action type, user reference, resource type, resource ID, timestamp, IP address, session identifier, and contextual metadata stored as structured JSON

### Category Hierarchy Examples

To clarify the age-based category structure, here are concrete examples:

#### Example 1: Early Childhood Content (0-2 years)
```
0-2 years (Root Category - Depth 0)
  ├── Education (Depth 1)
  │   ├── Colors & Shapes (Depth 2)
  │   ├── First Words (Depth 2)
  │   └── Numbers (Depth 2)
  ├── Entertainment (Depth 1)
  │   ├── Nursery Rhymes (Depth 2)
  │   └── Peek-a-Boo (Depth 2)
  └── Music (Depth 1)
      ├── Lullabies (Depth 2)
      └── Simple Songs (Depth 2)
```

#### Example 2: Elementary Content (5-7 years)
```
5-7 years (Root Category - Depth 0)
  ├── Education (Depth 1)
  │   ├── Math (Depth 2)
  │   │   ├── Basic Addition (Depth 3)
  │   │   ├── Basic Subtraction (Depth 3)
  │   │   └── Counting (Depth 3)
  │   ├── Science (Depth 2)
  │   │   ├── Animals (Depth 3)
  │   │   ├── Plants (Depth 3)
  │   │   └── Weather (Depth 3)
  │   └── Reading (Depth 2)
  │       ├── Phonics (Depth 3)
  │       └── Sight Words (Depth 3)
  ├── Entertainment (Depth 1)
  │   ├── Stories (Depth 2)
  │   └── Cartoons (Depth 2)
  └── Music (Depth 1)
      ├── Educational Songs (Depth 2)
      └── Dance Songs (Depth 2)
```

#### Example 3: Teen Content (16+ years)
```
16+ years (Root Category - Depth 0)
  ├── Education (Depth 1)
  │   ├── College Prep (Depth 2)
  │   ├── Career Skills (Depth 2)
  │   └── Life Skills (Depth 2)
  ├── Entertainment (Depth 1)
  │   ├── Documentaries (Depth 2)
  │   └── Interviews (Depth 2)
  └── Fitness (Depth 1)
      ├── Workout Routines (Depth 2)
      └── Nutrition (Depth 2)
```

**Key Points Illustrated**:
- Each age range is completely independent with its own category tree
- The same category name (e.g., "Education", "Entertainment", "Music") can exist under multiple age ranges
- Videos are assigned to leaf categories (e.g., "5-7 years → Education → Math → Basic Addition")
- Frontend navigation always starts with age range selection, then drills down through categories
- Filtering by age range "5-7 years" only shows categories and videos under that root branch

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can add a YouTube video with category assignment within the age-based hierarchy in under 2 minutes
- **SC-002**: System maintains responsive layout integrity across mobile (320px width), tablet (768px width), and desktop (1920px width) viewports with dynamic ad placements
- **SC-003**: Video retrieval by age range and category path returns results in under 1 second for collections up to 10,000 videos
- **SC-004**: 100% of user actions (CRUD operations, views, clicks) are captured in activity logs with complete metadata for analytics
- **SC-005**: Affiliate ad clicks are tracked with 99.9% accuracy (logged click count matches actual redirects)
- **SC-006**: Admins can configure and activate a new ad placement in under 3 minutes
- **SC-007**: System prevents unauthorized access with 100% success rate (no CMS access without admin-added user account)
- **SC-008**: Activity log queries for date ranges and action types return results in under 2 seconds for datasets up to 1 million log entries
- **SC-009**: Video metadata extraction from YouTube URLs succeeds for 95% of valid YouTube URLs
- **SC-010**: All movie-related schemas and sample data are removed with zero remaining references in the codebase
- **SC-011**: Visitors can navigate from age range selection to specific content category to video list in 3 clicks or fewer
- **SC-012**: Category hierarchy navigation displays the complete path from age range root to current category at all times
