# Feature Specification: Sanity CMS to PayloadCMS Migration

**Feature Branch**: `001-sanity-payload-migration`  
**Created**: 2025-01-19  
**Status**: Draft  
**Input**: User description: "Migrate from Sanity CMS to PayloadCMS (latest version)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Content Management with PayloadCMS (Priority: P1)

Administrators can create, read, update, and delete all content types (videos, categories, users, activity logs, ad placements, affiliate partners) through the PayloadCMS admin interface with the same structure and relationships as the current Sanity CMS setup.

**Why this priority**: This is the core functionality of the CMS. Without this, no content management is possible. It's the foundation for all other features and must work before proceeding with any data migration.

**Independent Test**: Can be fully tested by setting up PayloadCMS with all schema definitions, creating sample documents for each content type through the admin UI, and verifying all fields, validations, and relationships function correctly. Delivers immediate value by proving the CMS can handle the required data model.

**Acceptance Scenarios**:

1. **Given** PayloadCMS is installed and configured, **When** an admin accesses the admin panel, **Then** they see all six collections (video, category, user, activityLog, adPlacement, affiliatePartner) with proper labels and icons
2. **Given** an admin is creating a video, **When** they enter a YouTube URL, **Then** the YouTube ID is auto-extracted and validation ensures URL format is correct
3. **Given** an admin is creating a category, **When** they select a parent category, **Then** the system validates depth limits (max 10 levels), age range consistency, and prevents circular references
4. **Given** an admin is creating a user, **When** they enter an email, **Then** the system validates uniqueness and prevents duplicate emails
5. **Given** an admin is viewing a category, **When** they check auto-calculated fields, **Then** they see correct values for fullPath, depth, childCount, and videoCount
6. **Given** an admin is managing ad placements, **When** they set an inline ad configuration, **Then** the system requires everyNVideos and validates start/end date relationships

---

### User Story 2 - Data Migration from Sanity to PayloadCMS (Priority: P2)

All existing content in Sanity CMS (videos, categories, users, activity logs, ad placements, affiliate partners) is exported, transformed to PayloadCMS format, and imported into MongoDB Atlas with complete data integrity and relationship preservation.

**Why this priority**: After proving the CMS can handle the data model (P1), this enables transition from the old system to the new. Without migrated data, the new system would start empty, losing all historical content.

**Independent Test**: Can be fully tested by running the migration script against production Sanity data, importing into a staging PayloadCMS instance, and verifying: (1) record counts match, (2) all relationships are preserved (parent categories, user references, etc.), (3) calculated fields are correct, (4) no data loss in any field. Delivers value by proving the migration path is viable and safe.

**Acceptance Scenarios**:

1. **Given** Sanity CMS contains production data, **When** the export script runs, **Then** all documents from all six collections are exported to JSON files with correct data types
2. **Given** exported Sanity data exists, **When** the transformation script runs, **Then** all Sanity-specific fields (_id, _type, _rev) are mapped to PayloadCMS equivalents (id, collection metadata)
3. **Given** transformed data exists, **When** the import script runs, **Then** all documents are created in MongoDB Atlas with relationships intact (category parent references, user references in activityLog, etc.)
4. **Given** migration is complete, **When** comparing record counts, **Then** Sanity and PayloadCMS have identical counts for each collection
5. **Given** categories are migrated, **When** checking hierarchical data, **Then** fullPath arrays, depth values, and parent-child relationships match Sanity exactly
6. **Given** videos are migrated, **When** verifying foreign key relationships, **Then** all video category references point to valid migrated categories
7. **Given** activity logs are migrated, **When** checking weak references, **Then** all userId and resourceId references are preserved correctly
8. **Given** migration fails mid-process, **When** reviewing logs, **Then** the system identifies exactly which documents failed and why, allowing partial retry

---

### User Story 3 - Frontend Integration with PayloadCMS API (Priority: P3)

The frontend application fetches and displays all content (videos, categories) from PayloadCMS REST API instead of Sanity, maintaining identical user experience and functionality while using the new data source.

**Why this priority**: After proving the CMS works (P1) and data is migrated (P2), this ensures users can access the content through the application. This is essential for production readiness but can be developed/tested independently of the CMS setup.

**Independent Test**: Can be fully tested by updating frontend API calls to use PayloadCMS endpoints, running the application against migrated data, and verifying all pages load correctly, video playback works, category navigation functions, and filtering/search behaves identically to the Sanity-based version. Delivers value by proving the frontend can seamlessly work with the new backend.

**Acceptance Scenarios**:

1. **Given** PayloadCMS is running with migrated data, **When** a user visits the homepage, **Then** they see the same video list as before the migration
2. **Given** a user is browsing categories, **When** they navigate the category hierarchy, **Then** all parent-child relationships display correctly with proper depth indicators
3. **Given** a user views a video detail page, **When** the page loads, **Then** all video metadata (title, YouTube URL, category, age range, tags, duration) displays correctly
4. **Given** a user filters videos by category, **When** they select a category, **Then** only videos assigned to that category or its descendants appear
5. **Given** a user filters videos by age range, **When** they select an age range, **Then** only videos tagged for that age range appear
6. **Given** a user searches for videos, **When** they enter a search term, **Then** results match against video titles and tags
7. **Given** a video is played, **When** logging a view activity, **Then** the activity log is created in PayloadCMS with proper metadata (sessionId, videoId, categoryPath, ageRange)
8. **Given** an ad is displayed, **When** tracking impressions, **Then** the ad placement's impressionCount increments correctly in PayloadCMS

---

### User Story 4 - Admin Scripts Update for PayloadCMS (Priority: P4)

All administrative scripts (data imports, batch updates, analytics generation) are updated to work with PayloadCMS API instead of Sanity client, maintaining the same functionality for administrative workflows.

**Why this priority**: After frontend integration (P3), this ensures administrative tooling works with the new CMS. Lower priority because admins can use the PayloadCMS UI for most tasks until scripts are updated.

**Independent Test**: Can be fully tested by identifying all scripts that use Sanity client, updating them to use PayloadCMS API or local API, and running each script against test data to verify output matches expected behavior. Delivers value by restoring full administrative automation capabilities.

**Acceptance Scenarios**:

1. **Given** a bulk video import script exists, **When** running it against PayloadCMS, **Then** all videos are created with proper validation and relationships
2. **Given** a category bulk update script exists, **When** running it against PayloadCMS, **Then** all categories update their auto-calculated fields (childCount, videoCount)
3. **Given** an analytics reporting script exists, **When** running it against PayloadCMS, **Then** it generates reports from activity logs with correct metrics
4. **Given** an ad performance script exists, **When** running it against PayloadCMS, **Then** it calculates CTR and updates ad placements correctly

---

### User Story 5 - Sanity Dependency Removal (Priority: P5)

After successful migration and thorough testing with both systems running in parallel, all Sanity CMS dependencies, configuration files, and related code are removed from the codebase, leaving only PayloadCMS as the single CMS.

**Why this priority**: This is the final cleanup step after everything else works. Lowest priority because the system can function with both CMSs installed temporarily. Only proceed after extensive validation.

**Independent Test**: Can be fully tested by removing all Sanity packages from package.json, deleting Sanity config files, removing Sanity client code, running all tests, and verifying the application builds and runs without errors. Delivers value by eliminating maintenance burden and potential confusion from having two CMSs.

**Acceptance Scenarios**:

1. **Given** PayloadCMS is fully operational, **When** removing @sanity/* packages from package.json, **Then** the application still builds successfully
2. **Given** Sanity config files are deleted, **When** running the application, **Then** no errors or warnings reference Sanity
3. **Given** Sanity client code is removed, **When** running all tests, **Then** 100% of tests pass
4. **Given** all Sanity code is removed, **When** checking for references, **Then** no imports, configuration, or code references Sanity CMS
5. **Given** cleanup is complete, **When** reviewing dependencies, **Then** only PayloadCMS and MongoDB-related packages remain for CMS functionality

---

### Edge Cases

- **What happens when a category is deleted that has child categories?** System should prevent deletion or cascade delete children based on configuration
- **What happens when a category is deleted that is referenced by videos?** System should prevent deletion or reassign videos to a default category
- **What happens when migration fails mid-process?** System should log the failure point, preserve both systems intact, and provide clear error messages for troubleshooting
- **What happens when a user is deleted who is referenced in activity logs?** Activity logs use weak references, so logs should remain but user reference becomes null
- **What happens when concurrent updates occur during migration?** Migration should run during a maintenance window with no active writes, or implement locking mechanisms
- **What happens when MongoDB Atlas connection fails?** Application should retry with exponential backoff and fall back to cached data if available
- **What happens when PayloadCMS admin UI is accessed during migration?** System should show a maintenance mode message preventing writes
- **What happens when a video's YouTube URL becomes invalid after migration?** Frontend should gracefully handle invalid URLs with user-friendly error messages
- **What happens when hierarchical category depth exceeds 10 levels during migration?** Migration script should flag and fail on these records, requiring manual review and restructuring
- **What happens when duplicate slugs exist across collections?** Migration script should detect and either auto-increment duplicates or fail with clear error messages

## Requirements *(mandatory)*

### Functional Requirements

#### PayloadCMS Setup and Configuration

- **FR-001**: System MUST install PayloadCMS latest version (3.x or higher) with TypeScript support
- **FR-002**: System MUST configure PayloadCMS to use MongoDB Atlas as the database with connection string from environment variables
- **FR-003**: System MUST configure PayloadCMS admin panel with authentication and authorization matching current user roles (admin, editor)
- **FR-004**: System MUST create PayloadCMS collections matching all six Sanity document types (video, category, user, activityLog, adPlacement, affiliatePartner)
- **FR-005**: System MUST implement all field validations from Sanity schemas in PayloadCMS collections (required fields, string length limits, regex patterns, email validation, URL validation, date comparisons)

#### Schema Migration

- **FR-006**: Video collection MUST include fields: title (required, max 200), slug (required, auto-generated from title), youtubeUrl (required, validated YouTube URL format), youtubeId (auto-extracted 11-char string), duration (number in seconds), category (required dropdown from constants), ageRange (required dropdown from constants), tags (array max 20), notes (text), viewCount (read-only number), lastViewedAt (read-only datetime)
- **FR-007**: Category collection MUST include fields: name (required, max 100), slug (required, auto-generated), description (text max 500), icon (image with hotspot), ageRange (required dropdown), parent (reference to category with validation), fullPath (read-only array of strings), depth (read-only number 0-9 with validation), isAgeRangeRoot (read-only boolean), sortOrder (number), isVisible (boolean default true), childCount (read-only number), videoCount (read-only number), notes (text)
- **FR-008**: Category collection MUST enforce hierarchical validation: root categories (isAgeRangeRoot=true) cannot have parent, non-root categories must have parent, parent must be in same age range, maximum depth is 10 levels, prevent circular references (category cannot be its own ancestor)
- **FR-009**: User collection MUST include fields: name (required, max 100), email (required, validated format, globally unique), role (required radio: admin or editor, immutable after creation), status (required radio: active or inactive, default active), addedBy (required reference to user with admin role, read-only), lastLoginAt (read-only datetime), loginCount (read-only number default 0), notes (text), deactivatedAt (read-only datetime)
- **FR-010**: ActivityLog collection MUST include fields: actionType (required string matching pattern resource.action like video.view or ad.click), userId (weak reference to user, nullable for anonymous), sessionId (string UUID), ipAddress (string, anonymized last octet removed), userAgent (string), resourceType (dropdown: video, category, ad, user, system), resourceId (string, document ID), metadata (flexible object with fields for video views, ad interactions, CRUD operations, category navigation, user authentication)
- **FR-011**: ActivityLog collection MUST be read-only (no manual creation or editing through admin UI)
- **FR-012**: AdPlacement collection MUST include fields: name (required, max 100), type (required radio: banner, affiliate, native), position (required dropdown: header, footer, sidebar, inline, floating), content (required object with contentType, htmlCode or imageUrl based on type, linkUrl, altText), ageRanges (array of age range strings, empty means all), priority (required number 1-100 default 50), status (required radio: active, inactive, scheduled default inactive), startDate (optional datetime), endDate (optional datetime, must be after startDate), inlinePosition (object with everyNVideos and offsetStart, required if position is inline), affiliatePartner (weak reference), impressionCount (read-only number default 0), clickCount (read-only number default 0), ctr (read-only number default 0), notes (text)
- **FR-013**: AffiliatePartner collection MUST include fields: name (required, max 100), contactEmail (validated email format), website (validated URL), trackingUrlTemplate (required URL with placeholders {adId} and {sessionId}), commissionRate (number 0-100), commissionType (radio: cpc, cpa, cpm), paymentTerms (text), status (required radio: active, inactive, pending default pending), totalImpressions (read-only number default 0), totalClicks (read-only number default 0), conversionRate (read-only number default 0), onboardedAt (datetime), lastPayoutAt (datetime), notes (text)

#### Data Export from Sanity

- **FR-014**: Export script MUST retrieve all documents from all six Sanity collections using Sanity client
- **FR-015**: Export script MUST preserve all field values including nested objects, arrays, and references
- **FR-016**: Export script MUST handle Sanity-specific fields (_id, _type, _rev, _createdAt, _updatedAt) for transformation
- **FR-017**: Export script MUST save exported data to JSON files organized by collection type
- **FR-018**: Export script MUST log export progress, record counts, and any errors encountered

#### Data Transformation

- **FR-019**: Transformation script MUST map Sanity _id field to PayloadCMS id field while preserving original ID for reference tracking
- **FR-020**: Transformation script MUST map Sanity _type field to PayloadCMS collection metadata
- **FR-021**: Transformation script MUST convert Sanity reference fields (e.g., parent._ref in category) to PayloadCMS relationship format
- **FR-022**: Transformation script MUST handle weak references in activityLog and adPlacement correctly
- **FR-023**: Transformation script MUST preserve all date/datetime fields in ISO 8601 format compatible with MongoDB
- **FR-024**: Transformation script MUST validate transformed data against PayloadCMS schema rules before import
- **FR-025**: Transformation script MUST generate slugs for documents missing slugs using the same algorithm as auto-generation
- **FR-026**: Transformation script MUST handle Sanity image assets by extracting URLs and converting to PayloadCMS media format

#### Data Import to PayloadCMS

- **FR-027**: Import script MUST create documents in dependency order: first users, then categories (root to leaf), then videos, activityLogs, affiliatePartners, adPlacements
- **FR-028**: Import script MUST validate all relationships exist before creating documents with foreign keys
- **FR-029**: Import script MUST preserve timestamps (_createdAt, _updatedAt) from Sanity where applicable
- **FR-030**: Import script MUST handle import failures gracefully by logging failed documents and continuing with remaining data
- **FR-031**: Import script MUST provide a dry-run mode that validates without writing to database
- **FR-032**: Import script MUST generate a detailed import report showing: total records attempted, successful imports, failures with reasons, relationship validation results, data integrity checks

#### Data Integrity Verification

- **FR-033**: Verification script MUST compare record counts between Sanity and PayloadCMS for each collection
- **FR-034**: Verification script MUST validate that all category parent-child relationships match between systems
- **FR-035**: Verification script MUST validate that all video-to-category references are preserved
- **FR-036**: Verification script MUST validate that calculated fields (fullPath, depth, childCount, videoCount) match expected values
- **FR-037**: Verification script MUST check that all user references in activityLog and other collections point to valid migrated users
- **FR-038**: Verification script MUST validate that all slug values are unique within their collections
- **FR-039**: Verification script MUST produce a detailed verification report highlighting any discrepancies

#### Frontend Integration

- **FR-040**: Frontend MUST replace all @sanity/client imports with PayloadCMS REST API client or local API
- **FR-041**: Frontend MUST update all query syntax from GROQ (Sanity's query language) to PayloadCMS query format
- **FR-042**: Frontend MUST fetch video lists with same filtering options (category, age range, search) as before
- **FR-043**: Frontend MUST fetch category hierarchy with all ancestor and descendant relationships
- **FR-044**: Frontend MUST handle pagination for large result sets using PayloadCMS pagination parameters
- **FR-045**: Frontend MUST maintain same caching strategy for frequently accessed data (category tree, popular videos)
- **FR-046**: Frontend MUST update image URLs to use PayloadCMS media endpoints instead of Sanity image CDN
- **FR-047**: Frontend MUST preserve all existing UI components and user experience without visual changes

#### Activity Logging Integration

- **FR-048**: Frontend MUST create activity logs in PayloadCMS when users view videos, navigate categories, or interact with ads
- **FR-049**: Frontend MUST include all required activity log metadata (sessionId, ipAddress anonymized, userAgent, actionType in resource.action format)
- **FR-050**: Frontend MUST handle activity logging failures gracefully without disrupting user experience

#### Admin Scripts Update

- **FR-051**: All admin scripts MUST be identified and documented with their Sanity dependencies
- **FR-052**: Each admin script MUST be updated to use PayloadCMS API instead of Sanity client
- **FR-053**: Updated scripts MUST maintain same input/output formats for compatibility with existing workflows
- **FR-054**: Scripts MUST include error handling with proper logging using the logger utility (per constitution)

#### Parallel Testing Phase

- **FR-055**: System MUST support running both Sanity and PayloadCMS in parallel during testing phase
- **FR-056**: System MUST provide configuration toggle (environment variable) to switch between Sanity and PayloadCMS data sources
- **FR-057**: System MUST log all CMS operations during parallel testing for comparison analysis
- **FR-058**: Testing phase MUST include side-by-side comparison of responses from both CMSs for identical queries

#### Sanity Removal

- **FR-059**: After successful testing, system MUST remove all @sanity/* packages from package.json
- **FR-060**: System MUST delete all Sanity configuration files (sanity.config.ts, sanity.cli.ts, etc.)
- **FR-061**: System MUST remove all Sanity client initialization code
- **FR-062**: System MUST remove all Sanity schema files from schemaTypes directory
- **FR-063**: System MUST update all documentation and README files to reference PayloadCMS instead of Sanity
- **FR-064**: System MUST remove Sanity-related environment variables from .env.example and deployment configuration

#### Constitution Compliance

- **FR-065**: All code MUST use the logger utility instead of console.log (per constitution Principle III and Prohibited Practices)
- **FR-066**: All configuration values MUST be defined as constants, not magic strings (per constitution Principle II)
- **FR-067**: All functions MUST have cyclomatic complexity ≤ 5 (per constitution Principle I)
- **FR-068**: All errors MUST be handled with proper logging and user-friendly feedback (per constitution Principle III)
- **FR-069**: All API integrations MUST use real APIs and real data - no mock data or stubs (per constitution Principle V)
- **FR-070**: All code MUST use Deno runtime (latest LTS) as specified in project constitution
- **FR-071**: MongoDB Atlas connection MUST be real production cloud instance, not local or mock database (per constitution Principle V)

### Key Entities

- **Video**: Represents video content with YouTube URLs, metadata (title, duration, tags), categorization (category, age range), and engagement metrics (viewCount, lastViewedAt). Core content entity.

- **Category**: Hierarchical taxonomy for organizing videos with parent-child relationships, depth tracking, age range roots, visibility controls, and auto-calculated metrics (childCount, videoCount). Supports up to 10 levels of nesting.

- **User**: Administrative users with role-based access (admin, editor), account status tracking, audit trail (addedBy, lastLoginAt, loginCount), and immutable role assignment after creation.

- **ActivityLog**: Immutable event tracking for all user interactions (video views, category navigation, ad interactions, CRUD operations) with flexible metadata for context-specific information, anonymized IP addresses, and session tracking.

- **AdPlacement**: Advertising configuration with type/position settings, content (HTML or image), targeting (age ranges), scheduling (start/end dates), inline positioning rules, affiliate partner linking, and performance metrics (impressions, clicks, CTR).

- **AffiliatePartner**: Affiliate program partners with contact information, tracking URL templates, commission models (CPC/CPA/CPM), payment terms, status management, and aggregated performance metrics across linked ads.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six content collections (video, category, user, activityLog, adPlacement, affiliatePartner) are accessible in PayloadCMS admin panel with full CRUD functionality within 30 seconds of admin login
- **SC-002**: Record counts in PayloadCMS match Sanity exactly after migration: 100% accuracy for each collection with zero data loss
- **SC-003**: All hierarchical category relationships (parent-child, depth, fullPath) are preserved with 100% accuracy after migration, verifiable through automated comparison script
- **SC-004**: All video-to-category references resolve correctly after migration with zero broken relationships
- **SC-005**: Frontend page load times remain within 10% of current performance after switching to PayloadCMS API (baseline: current average page load time)
- **SC-006**: All frontend features (video browsing, category navigation, filtering, search) function identically before and after migration with zero user-facing differences
- **SC-007**: Migration scripts complete full data migration (export, transform, import) in under 2 hours for the current dataset size
- **SC-008**: Zero critical bugs reported during 7-day parallel testing period running both CMSs simultaneously
- **SC-009**: All admin scripts execute successfully against PayloadCMS with same output as Sanity version (verified through output comparison)
- **SC-010**: System builds and passes all tests after removing Sanity dependencies with zero import errors or missing module failures
- **SC-011**: Activity logs are created successfully for 100% of user interactions (video views, category navigation, ad clicks) with all required metadata fields populated
- **SC-012**: Ad placement impressions and clicks track correctly with CTR calculations matching expected values (±0.01% accuracy)
- **SC-013**: Category depth validation prevents creation of categories deeper than 10 levels with clear error messages
- **SC-014**: User role immutability is enforced - attempts to change user roles after creation fail with appropriate error messages
- **SC-015**: MongoDB Atlas connection remains stable with 99.9% uptime during first 30 days post-migration
- **SC-016**: All PayloadCMS API responses return within 200ms for 95th percentile requests under normal load
- **SC-017**: Parallel testing reveals zero functional discrepancies between Sanity and PayloadCMS responses for identical queries
- **SC-018**: Documentation is complete with setup instructions, migration runbook, and API reference for PayloadCMS integration
- **SC-019**: Zero hardcoded credentials or environment variables committed to version control (verified through pre-commit hooks)
- **SC-020**: All code passes cyclomatic complexity check (max 5) and uses logger utility instead of console.log (constitution compliance)

### Assumptions

- **Assumption 1**: MongoDB Atlas cluster is provisioned and accessible before migration begins with adequate storage and compute capacity for the migrated dataset
- **Assumption 2**: PayloadCMS 3.x supports all required field types and validation patterns currently used in Sanity schemas
- **Assumption 3**: Current Sanity dataset size is within MongoDB Atlas free tier limits or a paid tier is approved and configured
- **Assumption 4**: Migration will occur during a planned maintenance window with no concurrent writes to Sanity CMS
- **Assumption 5**: All existing video YouTube URLs are valid and accessible (migration will not re-validate external URLs)
- **Assumption 6**: Cloudinary media storage URLs remain unchanged and do not require re-upload after CMS migration
- **Assumption 7**: Frontend application framework (likely Next.js or similar) supports PayloadCMS client libraries
- **Assumption 8**: Current Sanity API rate limits are not a blocker for bulk export operations
- **Assumption 9**: PayloadCMS admin authentication can integrate with existing user authentication system or uses separate admin credentials
- **Assumption 10**: Deno runtime is already configured in the project environment as specified in the constitution
- **Assumption 11**: Activity log anonymization requirements (IP address last octet removal) are satisfied by migration script processing
- **Assumption 12**: Affiliate partner tracking URL templates can be migrated as-is without requiring URL rewriting
- **Assumption 13**: Ad placement inline positioning logic (everyNVideos) is implemented in frontend, not CMS, so schema migration is sufficient
- **Assumption 14**: Category auto-calculated fields (childCount, videoCount) can be computed during migration or via PayloadCMS hooks
- **Assumption 15**: Development, staging, and production environments all have access to MongoDB Atlas with appropriate network configuration

### Dependencies

- **Dependency 1**: PayloadCMS version 3.x must be released and stable (check PayloadCMS documentation for latest stable version)
- **Dependency 2**: MongoDB Atlas account must be created with appropriate cluster tier provisioned
- **Dependency 3**: Sanity API access credentials (project ID, dataset, read token) must be available for data export
- **Dependency 4**: PayloadCMS documentation for MongoDB adapter configuration must be reviewed and followed
- **Dependency 5**: Frontend codebase must be accessible for API client updates
- **Dependency 6**: Admin script inventory must be compiled before migration to identify all Sanity dependencies
- **Dependency 7**: Staging environment must be available for parallel testing phase before production migration
- **Dependency 8**: Database backup strategy must be in place for both Sanity (export backup) and MongoDB Atlas (snapshot) before migration
- **Dependency 9**: Monitoring and logging infrastructure must be configured to track PayloadCMS API performance and errors
- **Dependency 10**: Project constitution (.specify/memory/constitution.md) principles must be reviewed to ensure migration code compliance

### Out of Scope

- **Out of Scope 1**: Performance optimization beyond baseline parity with Sanity (future enhancement after successful migration)
- **Out of Scope 2**: PayloadCMS custom field type development (use only built-in field types in initial migration)
- **Out of Scope 3**: Re-design of admin UI beyond PayloadCMS default interface (accept PayloadCMS standard admin panel)
- **Out of Scope 4**: Migration of Sanity Studio customizations (custom input components like YoutubeIdInput) - use standard PayloadCMS fields
- **Out of Scope 5**: Optimization of category hierarchy depth limits beyond current 10-level maximum
- **Out of Scope 6**: Internationalization or multi-language support (not part of current Sanity setup)
- **Out of Scope 7**: Advanced search features beyond basic filtering by category, age range, and text search
- **Out of Scope 8**: Real-time sync between Sanity and PayloadCMS (migration is one-time, not continuous)
- **Out of Scope 9**: Custom webhook integrations or third-party CMS extensions during initial migration
- **Out of Scope 10**: Refactoring of data model or schema improvements (migrate as-is, optimize later)
- **Out of Scope 11**: Migration of Sanity Studio deployment configuration (PayloadCMS admin is self-hosted with main application)
- **Out of Scope 12**: User authentication system changes (admin users migrate, but auth mechanism remains unchanged)
- **Out of Scope 13**: Analytics or reporting dashboard enhancements beyond current activity log functionality
- **Out of Scope 14**: Ad placement serving logic optimization (migrate configuration only, serving logic stays in frontend)
- **Out of Scope 15**: Automated rollback mechanism (manual rollback via restoration of Sanity configuration if needed)
