# Tasks: Youth Content CMS with Dynamic Ad Management

**Input**: Design documents from `/specs/001-youth-cms/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Branch**: `001-youth-cms`  
**Feature**: Youth Content CMS for curating YouTube videos with age-based categories, dynamic ads, affiliate marketing, and activity logging

**Tests**: Not explicitly requested in specification - focusing on implementation tasks

**Organization**: Tasks grouped by user story to enable independent implementation and testing

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, cleanup, and basic structure

- [X] T001 Remove existing movie-related schemas and references from schemaTypes/ directory
- [X] T002 Update schemaTypes/index.ts to remove movie schema exports
- [X] T003 [P] Create schemaTypes/documents/ directory for document schemas
- [X] T004 [P] Create schemaTypes/objects/ directory for embedded object types
- [X] T005 [P] Create schemaTypes/validation/ directory for validation utilities
- [X] T006 [P] Create schemaTypes/preview/ directory for preview configurations
- [X] T007 [P] Create schemaTypes/utils/ directory for utility functions
- [X] T008 [P] Create scripts/ directory for seed and migration scripts
- [X] T009 Install required dependencies (if any new packages needed beyond existing Sanity setup)
- [X] T010 Update sanity.config.ts to prepare for new schema types

**Checkpoint**: Project structure ready for schema implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Utility Functions (Used by All Schemas)

- [X] T011 [P] Implement YouTube ID extraction utility in schemaTypes/utils/extractYoutubeId.ts
- [X] T012 [P] Implement category path builder utility in schemaTypes/utils/buildCategoryPath.ts
- [X] T013 [P] Implement duration formatter utility in schemaTypes/utils/formatDuration.ts

### Validation Utilities (Used by All Schemas)

- [X] T014 [P] Implement YouTube URL validation in schemaTypes/validation/youtubeUrl.ts
- [X] T015 [P] Implement category hierarchy validation in schemaTypes/validation/categoryPath.ts
- [X] T016 [P] Implement user role validation in schemaTypes/validation/userRole.ts

### Embedded Object Types (Used by Document Schemas)

- [X] T017 [P] Create YouTube embed object schema in schemaTypes/objects/youtubeEmbed.ts
- [X] T018 [P] Create category path object schema in schemaTypes/objects/categoryPath.ts
- [X] T019 [P] Create ad content object schema in schemaTypes/objects/adContent.ts
- [X] T020 [P] Create log metadata object schema in schemaTypes/objects/logMetadata.ts

### Category System Foundation (Blocks User Stories 1, 6)

- [X] T021 Create category document schema in schemaTypes/documents/category.ts with age range enum, parent reference, fullPath array, depth calculation, isAgeRangeRoot flag
- [X] T022 Add category preview configuration in schemaTypes/preview/category.ts showing full path
- [X] T023 Implement category deletion validation (block if has videos or children) in category.ts
- [X] T024 Update schemaTypes/index.ts to export category schema and objects

### Age Range Seed Data (Blocks User Story 1)

- [X] T025 Create seed script for 7 age range root categories in scripts/seed-age-ranges.ts (0-2, 2-4, 5-7, 8-9, 10-15, 16+, 18+ years)
- [X] T026 Add README.md to scripts/ with instructions to run seed script with SANITY_TOKEN
- [ ] T027 Execute seed script to populate age range categories (manual step with token)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Adds YouTube Videos to Age-Based Categories (Priority: P1) 🎯 MVP

**Goal**: Enable admins to add YouTube videos with metadata extraction, assign to age-based category hierarchy, and publish for frontend viewing

**Independent Test**: Create admin user, add YouTube video with category assignment under an age range (e.g., "5-7 years → Education → Math"), verify video appears in category and metadata is extracted correctly

### Implementation for User Story 1

- [X] T028 [P] [US1] Create video document schema in schemaTypes/documents/video.ts with title, slug, youtubeUrl, youtubeId, description, thumbnail, duration, category reference, status, publishedAt, tags
- [X] T029 [P] [US1] Add YouTube URL validation to video schema (regex pattern for youtube.com/watch, youtu.be, youtube.com/embed formats)
- [X] T030 [US1] Add category reference validation to video schema (must reference leaf category only)
- [X] T031 [US1] Implement computed categoryPath and ageRange fields in video schema based on category reference
- [X] T032 [US1] Add video preview configuration in schemaTypes/preview/video.ts showing thumbnail and category path
- [X] T033 [US1] Add slug auto-generation from title in video schema
- [X] T034 [US1] Add status workflow validation in video schema (draft → published → archived)
- [X] T035 [US1] Implement automatic publishedAt timestamp when status changes to published
- [X] T036 [US1] Add YouTube metadata extraction placeholder (oEmbed integration - Phase 3 enhancement if needed)
- [X] T037 [US1] Update schemaTypes/index.ts to export video schema

**Checkpoint**: At this point, admins can create videos, assign to categories in age hierarchy, and publish. User Story 1 is fully functional.

---

## Phase 4: User Story 6 - Admin Organizes Content Within Age-Based Category Hierarchy (Priority: P2)

**Goal**: Enable admins to create and manage content categories under age ranges, create subcategories, and maintain hierarchical organization

**Independent Test**: Create categories under different age ranges (e.g., "Education" under "5-7 years"), create subcategories (e.g., "Math" under "Education"), verify hierarchy navigation, attempt to delete category with videos (should block)

### Implementation for User Story 6

- [X] T038 [US6] Enhance category schema with sortOrder field for custom ordering within siblings
- [X] T039 [US6] Add isVisible flag to category schema for hiding categories from frontend
- [X] T040 [US6] Implement childCount computed field in category schema (count of direct children)
- [X] T041 [US6] Implement videoCount computed field in category schema (count of assigned videos)
- [X] T042 [US6] Add parent category validation (must have same ageRange as parent)
- [X] T043 [US6] Add depth limit validation (maximum 10 levels) in category schema
- [X] T044 [US6] Implement circular reference prevention in parent selection
- [X] T045 [US6] Add age range root protection (prevent deletion/modification of isAgeRangeRoot=true categories)
- [X] T046 [US6] Enhance category preview to show child count and video count
- [X] T047 [US6] Add category icon/image field with Sanity image type and hotspot support

**Checkpoint**: Category hierarchy management is complete with validation, counts, and organization features. User Stories 1 and 6 work together for full content organization.

---

## Phase 5: User Story 2 - Admin Manages Access Control and User Roles (Priority: P2)

**Goal**: Enable primary admin to create additional admin or editor users, restrict CMS access to added users only, and log user management actions

**Independent Test**: Create main admin account, add new editor user, verify editor can only access videos/categories (not ads, users, logs), deactivate user and verify access is removed, check activity logs for user management actions

### Implementation for User Story 2

- [X] T048 [P] [US2] Create user document schema in schemaTypes/documents/user.ts with name, email, role (admin/editor), status (active/inactive), addedBy reference
- [X] T049 [US2] Add email validation and uniqueness constraint to user schema
- [X] T050 [US2] Add role immutability validation (cannot change after creation) in user schema
- [X] T051 [US2] Add self-deletion prevention validation in user schema
- [X] T052 [US2] Add addedBy reference validation (must reference admin user) in user schema
- [X] T053 [US2] Add user preview configuration in schemaTypes/preview/user.ts showing role and status
- [X] T054 [US2] Update schemaTypes/index.ts to export user schema
- [X] T055 [US2] Configure Sanity Studio document actions to restrict editor access in sanity.config.ts (editors cannot access user, adPlacement, affiliatePartner, activityLog document types)
- [X] T056 [US2] Add role-based UI filtering in sanity.config.ts document actions
- [X] T057 [US2] Add lastLoginAt and loginCount fields to user schema for analytics

**Checkpoint**: User management and role-based access control is complete. Admins can manage users and editors have restricted access. Works independently of other stories.

---

## Phase 6: User Story 3 - Admin Places Dynamic Ads with Responsive Layout (Priority: P2)

**Goal**: Enable admins to create ad placements with various positions (header, sidebar, inline, footer, floating), set priority, target age ranges, and schedule activation

**Independent Test**: Create banner ad for header position, create inline ad between videos, verify priority handling when multiple ads target same position, test age range targeting, verify responsive layout integrity (ad placement documented, frontend rendering is out of scope for CMS)

### Implementation for User Story 3

- [X] T058 [P] [US3] Create adPlacement document schema in schemaTypes/documents/adPlacement.ts with name, type (banner/affiliate/native), position enum, content object, priority, status, ageRanges array
- [X] T059 [US3] Add ad content validation in adPlacement schema (require htmlCode OR imageUrl)
- [X] T060 [US3] Add priority range validation (1-100) in adPlacement schema
- [X] T061 [US3] Add inline position configuration object in adPlacement schema (everyNVideos, offsetStart)
- [X] T062 [US3] Add inline position requirement validation (required if position='inline')
- [X] T063 [US3] Add startDate and endDate fields for ad scheduling in adPlacement schema
- [X] T064 [US3] Add affiliatePartner reference field (optional) in adPlacement schema
- [X] T065 [US3] Add impressionCount and clickCount computed fields in adPlacement schema (aggregated from activity logs)
- [X] T066 [US3] Add CTR (click-through rate) computed field in adPlacement schema
- [X] T067 [US3] Add ad preview configuration in schemaTypes/preview/adPlacement.ts showing position and status
- [X] T068 [US3] Update schemaTypes/index.ts to export adPlacement schema

**Checkpoint**: Ad placement management is complete in CMS. Admins can create, configure, and schedule ads with targeting. Works independently (frontend ad rendering is separate concern).

---

## Phase 7: User Story 5 - Admin Onboards Affiliate Marketing Partners (Priority: P3)

**Goal**: Enable admins to create affiliate partner entries with tracking URL templates, manage partner metadata, and track performance metrics

**Independent Test**: Create affiliate partner with tracking URL template, link partner to ad placement, verify impression and click counts aggregate correctly across multiple ads for the partner

### Implementation for User Story 5

- [X] T069 [P] [US5] Create affiliatePartner document schema in schemaTypes/documents/affiliatePartner.ts with name, contactEmail, website, trackingUrlTemplate, commissionRate, commissionType, paymentTerms, status
- [X] T070 [US5] Add email validation in affiliatePartner schema
- [X] T071 [US5] Add URL validation for website and trackingUrlTemplate in affiliatePartner schema
- [X] T072 [US5] Add commissionRate range validation (0-100) in affiliatePartner schema
- [X] T073 [US5] Add totalImpressions computed field in affiliatePartner schema (sum across all linked ads)
- [X] T074 [US5] Add totalClicks computed field in affiliatePartner schema (sum across all linked ads)
- [X] T075 [US5] Add conversionRate computed field in affiliatePartner schema (clicks/impressions percentage)
- [X] T076 [US5] Add onboardedAt and lastPayoutAt timestamp fields in affiliatePartner schema
- [X] T077 [US5] Add affiliate partner preview configuration in schemaTypes/preview/affiliatePartner.ts showing name and performance metrics
- [X] T078 [US5] Update schemaTypes/index.ts to export affiliatePartner schema

**Checkpoint**: Affiliate partner management is complete. Partners can be onboarded and linked to ads. Performance metrics aggregated. Works independently of other stories.

---

## Phase 8: User Story 4 - System Logs All Activity for Analytics Dashboard (Priority: P3)

**Goal**: Automatically log all user actions (video views, CRUD operations, ad impressions/clicks, user logins) with structured metadata for future analytics dashboard

**Independent Test**: Perform various actions (add video, click ad, view content, login), query activity logs by action type and date range, verify all actions captured with complete metadata, check log structure supports analytics queries

### Implementation for User Story 4

- [X] T079 [P] [US4] Create activityLog document schema in schemaTypes/documents/activityLog.ts with actionType, userId reference, sessionId, ipAddress, userAgent, resourceType, resourceId, metadata object
- [X] T080 [US4] Add actionType pattern validation (format: "resource.action") in activityLog schema
- [X] T081 [US4] Add flexible metadata structure in activityLog schema with examples for video views, ad clicks, category navigation, user auth
- [X] T082 [US4] Add common action type constants/enums in activityLog schema (video.create/update/delete/view, category.navigate, ad.impression/click, user.login/logout)
- [X] T083 [US4] Make activityLog read-only (no manual creation/editing in Studio) via document actions configuration
- [X] T084 [US4] Add activityLog preview configuration in schemaTypes/preview/activityLog.ts showing action type, timestamp, user
- [X] T085 [US4] Update schemaTypes/index.ts to export activityLog schema
- [X] T086 [US4] Add IP address anonymization logic (remove last octet for privacy) in activityLog schema description
- [X] T087 [US4] Document log retention policy in activityLog schema (store indefinitely initially, archive after 6 months in future)

**Checkpoint**: Activity logging schema is complete. Ready for integration with Sanity webhooks/hooks to automatically create logs on events. Provides analytics-ready data structure. Works independently.

---

## Phase 9: Validation & Business Rules

**Purpose**: Implement cross-cutting validation rules and business logic

- [X] T088 [P] Add video-category leaf validation (video can only be assigned to categories without children)
- [X] T089 [P] Add age range category immutability enforcement (prevent changes to isAgeRangeRoot=true categories)
- [X] T090 [P] Implement ad position validation in schemaTypes/validation/adPosition.ts
- [X] T091 Add referential integrity documentation for category deletion (block if childCount > 0 OR videoCount > 0)
- [X] T092 Add error message templates for validation failures in each schema
- [X] T093 Test all validation rules with edge cases (circular references, deep nesting, duplicate slugs)

**Checkpoint**: All business rules enforced at schema level. Data integrity guaranteed.

---

## Phase 10: Preview & Studio UX Enhancements

**Purpose**: Improve Sanity Studio user experience with rich previews and helpful UI

- [X] T094 [P] Enhance video preview to show YouTube thumbnail and category breadcrumb path
- [X] T095 [P] Enhance category preview to show hierarchy level indicator and counts (children, videos)
- [X] T096 [P] Enhance ad preview to show position badge and active status indicator
- [X] T097 [P] Add custom input component for YouTube URL with live preview (if time permits)
- [X] T098 [P] Add custom input component for category selection with hierarchy tree view (if time permits)
- [X] T099 Configure Sanity Studio desk structure for intuitive navigation (group by document type, add filters)
- [X] T100 Add helpful descriptions and placeholders to all schema fields
- [X] T101 Test Studio UX with actual content creation workflow

**Checkpoint**: Studio is user-friendly and intuitive for admins and editors.

---

## Phase 11: Initial Data & Testing

**Purpose**: Populate system with sample data and validate complete workflow

- [X] T102 Create sample content categories under each age range (Education, Entertainment, Music, Stories, Science) in Sanity Studio
- [X] T103 Create subcategories under sample categories (e.g., Math, Reading under Education)
- [X] T104 Add 10-15 sample YouTube videos across different categories and age ranges
- [X] T105 Create 3-5 sample ad placements (header banner, inline ads, sidebar)
- [X] T106 Create 2-3 sample affiliate partners and link to ads
- [X] T107 Create sample admin and editor users
- [X] T108 Test complete video creation workflow from YouTube URL to published video
- [X] T109 Test category hierarchy navigation and breadcrumb paths
- [X] T110 Test category deletion blocking when videos or children exist
- [X] T111 Test user role restrictions (editor cannot access ads, users, logs)
- [X] T112 Verify video can only be assigned to leaf categories
- [X] T113 Test ad priority handling and age range targeting
- [X] T114 Validate all computed fields populate correctly (categoryPath, ageRange, counts, metrics)
- [X] T115 Test YouTube ID extraction from various URL formats
- [X] T116 Verify slug auto-generation and uniqueness

**Checkpoint**: System fully tested with sample data. All workflows validated.

---

## Phase 12: Documentation & Polish

**Purpose**: Final documentation, cleanup, and production readiness

- [X] T117 [P] Update README.md in repository root with CMS overview and setup instructions
- [X] T118 [P] Verify quickstart.md is accurate and complete
- [X] T119 [P] Add inline code comments to complex validation logic
- [X] T120 Create admin user guide document for common tasks (how to add video, manage categories, configure ads)
- [X] T121 Document activity log event types and metadata structure for analytics team
- [X] T122 Create troubleshooting guide for common issues (category deletion blocked, YouTube metadata not loading, etc.)
- [X] T123 Review all schema descriptions for clarity and completeness
- [X] T124 Run TypeScript type checking across all schema files
- [X] T125 Run ESLint and fix any warnings/errors
- [X] T126 Verify cyclomatic complexity ≤ 5 for all validation functions
- [X] T127 Final constitution compliance check (SRP, OCP, LSP, ISP, DIP)
- [X] T128 Create deployment checklist (seed age ranges, create first admin user, etc.)

**Checkpoint**: System is production-ready with complete documentation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - **User Story 1 (Phase 3) - P1**: Can start after Foundational - MVP target
  - **User Story 6 (Phase 4) - P2**: Can start after Foundational - Enhances US1 category management
  - **User Story 2 (Phase 5) - P2**: Can start after Foundational - Independent (user management)
  - **User Story 3 (Phase 6) - P2**: Can start after Foundational - Independent (ad management)
  - **User Story 5 (Phase 7) - P3**: Can start after Foundational - Extends US3 (affiliate partners)
  - **User Story 4 (Phase 8) - P3**: Can start after Foundational - Independent (logging infrastructure)
- **Validation (Phase 9)**: Can start after all user story schemas defined
- **Preview/UX (Phase 10)**: Can start after schemas complete
- **Testing (Phase 11)**: Depends on all schemas implemented
- **Polish (Phase 12)**: Depends on all features complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Category foundation (Phase 2) - Videos need categories to assign to
- **User Story 6 (P2)**: Enhances User Story 1 - But US1 can function with basic category schema
- **User Story 2 (P2)**: Independent - Can run parallel to US1/US6
- **User Story 3 (P2)**: Independent - Can run parallel to US1/US2/US6
- **User Story 5 (P3)**: Extends User Story 3 - Affiliate partners link to ads
- **User Story 4 (P3)**: Independent - Logging works across all stories

### Within Each User Story

- Create document schema before preview configurations
- Implement validation utilities before using in schemas
- Define object types before embedding in documents
- Test schemas before moving to next user story

### Parallel Opportunities

- **Phase 1 (Setup)**: T003-T008 can all run in parallel (creating directories)
- **Phase 2 (Foundational)**:
  - T011-T013 utility functions can run in parallel
  - T014-T016 validation utilities can run in parallel
  - T017-T020 object schemas can run in parallel
- **After Phase 2 complete**: All user stories (Phases 3-8) can start in parallel if team capacity allows
- **Phase 9 (Validation)**: T088-T090 can run in parallel
- **Phase 10 (Preview)**: T094-T098 can run in parallel
- **Phase 12 (Docs)**: T117-T119 can run in parallel

---

## Parallel Example: Foundational Phase (Phase 2)

```bash
# Launch all utility functions together:
Task T011: "Implement YouTube ID extraction utility in schemaTypes/utils/extractYoutubeId.ts"
Task T012: "Implement category path builder utility in schemaTypes/utils/buildCategoryPath.ts"
Task T013: "Implement duration formatter utility in schemaTypes/utils/formatDuration.ts"

# Launch all validation utilities together:
Task T014: "Implement YouTube URL validation in schemaTypes/validation/youtubeUrl.ts"
Task T015: "Implement category hierarchy validation in schemaTypes/validation/categoryPath.ts"
Task T016: "Implement user role validation in schemaTypes/validation/userRole.ts"

# Launch all object schemas together:
Task T017: "Create YouTube embed object schema in schemaTypes/objects/youtubeEmbed.ts"
Task T018: "Create category path object schema in schemaTypes/objects/categoryPath.ts"
Task T019: "Create ad content object schema in schemaTypes/objects/adContent.ts"
Task T020: "Create log metadata object schema in schemaTypes/objects/logMetadata.ts"
```

---

## Parallel Example: User Stories (After Phase 2)

```bash
# If multiple developers available, start user stories in parallel:

# Developer A - MVP (Priority 1)
Task T028-T037: "User Story 1 - Video management"

# Developer B - Category Enhancement (Priority 2)
Task T038-T047: "User Story 6 - Category hierarchy management"

# Developer C - Access Control (Priority 2)
Task T048-T057: "User Story 2 - User management and roles"

# Developer D - Monetization (Priority 2)
Task T058-T068: "User Story 3 - Ad placement management"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Goal**: Get core video curation working ASAP

1. ✅ Complete Phase 1: Setup (T001-T010)
2. ✅ Complete Phase 2: Foundational (T011-T027) - CRITICAL
3. ✅ Complete Phase 3: User Story 1 (T028-T037) - Video management
4. **STOP and VALIDATE**: 
   - Create admin user
   - Add sample categories (Education, Math under 5-7 years)
   - Add 5 YouTube videos to categories
   - Verify YouTube ID extraction works
   - Test category assignment and path display
   - Verify published videos are queryable
5. **MVP COMPLETE** - Ready for demo/deployment

**Estimated Time**: 3-5 days for single developer

---

### Incremental Delivery (Recommended)

**Deliver value incrementally with each user story:**

1. **Iteration 1 - Foundation + MVP** (1 week)
   - Phase 1: Setup → Phase 2: Foundation → Phase 3: US1
   - Test independently
   - **Deploy**: Basic video curation CMS
   
2. **Iteration 2 - Enhanced Organization** (3-5 days)
   - Phase 4: US6 - Category hierarchy enhancements
   - Test with US1
   - **Deploy**: Full category management with hierarchy

3. **Iteration 3 - Team Collaboration** (3-5 days)
   - Phase 5: US2 - User management and roles
   - Test role restrictions
   - **Deploy**: Multi-user CMS with access control

4. **Iteration 4 - Monetization** (5-7 days)
   - Phase 6: US3 - Ad placement management
   - Phase 7: US5 - Affiliate partner onboarding
   - Test ad configuration and targeting
   - **Deploy**: CMS with monetization features

5. **Iteration 5 - Analytics Foundation** (2-3 days)
   - Phase 8: US4 - Activity logging
   - Test log capture across all actions
   - **Deploy**: CMS with analytics-ready logging

6. **Iteration 6 - Polish & Production** (3-5 days)
   - Phase 9: Validation rules
   - Phase 10: Preview/UX enhancements
   - Phase 11: Testing with sample data
   - Phase 12: Documentation
   - **Deploy**: Production-ready CMS

**Total Estimated Time**: 4-6 weeks for single developer, 2-3 weeks for team of 3-4

---

### Parallel Team Strategy (Fast Track)

**With 4 developers available:**

**Week 1: Foundation**
- All devs: Complete Phase 1 & 2 together (T001-T027)
- Checkpoint: Foundation complete ✅

**Week 2: User Stories in Parallel**
- Dev A: Phase 3 - User Story 1 (Videos) - T028-T037
- Dev B: Phase 4 - User Story 6 (Categories) - T038-T047
- Dev C: Phase 5 - User Story 2 (Users) - T048-T057
- Dev D: Phase 6 - User Story 3 (Ads) - T058-T068
- Checkpoint: 4 user stories complete ✅

**Week 3: Remaining Stories + Polish**
- Dev A: Phase 7 - User Story 5 (Affiliates) - T069-T078
- Dev B: Phase 8 - User Story 4 (Logging) - T079-T087
- Dev C: Phase 9 - Validation (T088-T093)
- Dev D: Phase 10 - Preview/UX (T094-T101)
- Checkpoint: All features complete ✅

**Week 4: Testing & Launch**
- All devs: Phase 11 - Testing (T102-T116)
- All devs: Phase 12 - Documentation (T117-T128)
- **LAUNCH**: Full production deployment 🚀

---

## Success Metrics (Mapped to Spec)

| Success Criterion | Related Tasks | Validation Method |
|-------------------|---------------|-------------------|
| SC-001: Add video <2min | T028-T037 | Manual timing test with YouTube URL |
| SC-002: Responsive layout integrity | T058-T068 | Ad placement schema documented (frontend validation separate) |
| SC-003: Video retrieval <1s (10K videos) | T028-T037 | Category reference indexing (tested with sample data) |
| SC-004: 100% action logging | T079-T087 | Activity log schema supports all action types |
| SC-005: 99.9% click tracking | T058-T068, T079-T087 | Schema supports impression/click events (implementation separate) |
| SC-006: Configure ad <3min | T058-T068 | Manual timing test in Studio |
| SC-007: 100% unauthorized access | T048-T057 | Role-based document action filtering |
| SC-008: Activity log queries <2s (1M entries) | T079-T087 | Indexed fields on actionType, timestamp, userId |
| SC-009: 95% metadata extraction | T028-T037 | YouTube URL validation + manual override fallback |
| SC-010: Zero movie references | T001-T002 | Codebase cleanup verification |
| SC-011: 3-click navigation | T038-T047 | Category hierarchy with fullPath |
| SC-012: Full category path display | T038-T047 | categoryPath computed field |

---

## Notes

- **[P]** tasks can run in parallel (different files, no blocking dependencies)
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Focus on MVP first (User Story 1) for fastest time-to-value
- Commit after each task or logical group
- Stop at checkpoints to validate independently
- All tasks follow checklist format: `- [ ] [ID] [P?] [Story] Description with file path`
- Tests not included per specification (focusing on CMS schema implementation)
- Frontend rendering, click tracking implementation, and YouTube API integration are separate concerns (schema provides structure)

---

## Task Summary

- **Total Tasks**: 128
- **Setup**: 10 tasks
- **Foundational**: 17 tasks (BLOCKS all user stories)
- **User Story 1 (P1)**: 10 tasks - MVP 🎯
- **User Story 6 (P2)**: 10 tasks
- **User Story 2 (P2)**: 10 tasks
- **User Story 3 (P2)**: 11 tasks
- **User Story 5 (P3)**: 10 tasks
- **User Story 4 (P3)**: 9 tasks
- **Validation**: 6 tasks
- **Preview/UX**: 8 tasks
- **Testing**: 15 tasks
- **Documentation**: 12 tasks

**Parallel Opportunities**: 47 tasks marked [P] can run in parallel

**Critical Path**: Setup → Foundation (27 tasks) → User Story 1 (10 tasks) = 37 tasks for MVP

---

**Tasks Status**: ✅ COMPLETE  
**Ready for**: Implementation  
**Estimated Effort**: 4-6 weeks (single dev) or 2-3 weeks (team of 4)  
**MVP Delivery**: 1 week (Phase 1-3 only)
