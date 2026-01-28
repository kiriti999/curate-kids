# Tasks: Sanity to PayloadCMS Migration

**Feature Branch**: `001-sanity-payload-migration`  
**Input**: Design documents from `/specs/001-sanity-payload-migration/`  
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md, contracts/, research.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. This migration is unique as it's primarily a data migration operation rather than feature development.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: TypeScript/Deno bot at repository root
- **Scripts**: `scripts/` for temporary migration utilities
- **Tests**: `tests/unit/` and `tests/integration/`
- **Source**: `src/` for bot code (already has PayloadCMS service)

---

## Phase 1: Setup (MongoDB Atlas & PayloadCMS Deployment)

**Purpose**: Deploy infrastructure needed for migration - PayloadCMS instance and MongoDB Atlas database

**Story**: US4 - System Configuration Updated (P4)

- [ ] T001 Create MongoDB Atlas free cluster (M0) named "curatedreels-videos"
- [ ] T002 Configure MongoDB Atlas network access to allow PayloadCMS Cloud connection (0.0.0.0/0)
- [ ] T003 Create MongoDB database user with read/write permissions and save connection string
- [ ] T004 Sign up for PayloadCMS Cloud and create new project named "CuratedReels Videos"
- [ ] T005 Connect PayloadCMS Cloud to MongoDB Atlas using connection string
- [ ] T006 Define "videos" collection in PayloadCMS using schema from contracts/payloadcms-videos-schema.json
- [ ] T007 Configure MongoDB indexes per data-model.md recommendations (slug unique, category, ageRange, compound, text search, createdAt)
- [ ] T008 Generate PayloadCMS API key with create/read/update permissions for Telegram bot
- [ ] T009 Test PayloadCMS connection by manually creating a test video record through admin panel
- [ ] T010 Verify test video is stored in MongoDB Atlas and accessible via PayloadCMS API

**Checkpoint**: PayloadCMS and MongoDB Atlas are deployed and functional - ready for migration scripts

---

## Phase 2: Foundational (Migration Scripts Development)

**Purpose**: Create migration utilities to export from Sanity, transform data, import to PayloadCMS, and verify integrity

**⚠️ CRITICAL**: These scripts must be complete and tested before executing the actual migration

- [X] T011 [P] Create scripts/count-sanity-videos.ts to query total video count from Sanity using GROQ
- [X] T012 [P] Create scripts/export-sanity-backup.ts to export all Sanity data to JSON file for safety backup
- [X] T013 Create scripts/migrate-sanity-to-payload.ts with paginated migration logic (100 records per batch)
- [X] T014 Implement Sanity export function in migration script using HTTP API + GROQ query per research.md
- [X] T015 Implement data transformation function to map Sanity schema to PayloadCMS schema per data-model.md
- [X] T016 Implement PayloadCMS import function with retry logic and exponential backoff
- [X] T017 Add progress tracking, logging, and checkpoint/resume capability to migration script
- [X] T018 Implement dry-run mode (MIGRATION_DRY_RUN=true) for testing without actual import
- [X] T019 Create scripts/verify-migration.ts to compare Sanity vs PayloadCMS data integrity
- [X] T020 Implement record count verification in verify script (Sanity count === PayloadCMS count)
- [X] T021 Implement random sampling verification (100 records field-by-field comparison)
- [X] T022 Implement slug uniqueness validation and enum value validation checks
- [X] T023 Add discrepancy reporting to verification script (output to verification-report.json)

**Checkpoint**: All migration scripts complete - ready for testing

---

## Phase 3: User Story 4 - System Configuration Updated (Priority: P4)

**Goal**: Update bot configuration to use PayloadCMS instead of Sanity without requiring code changes

**Independent Test**: Update environment variables, restart bot, verify connection to PayloadCMS succeeds and new video submissions work

### Implementation for User Story 4

- [X] T024 [US4] Add PAYLOAD_API_URL environment variable to .env.example with placeholder
- [X] T025 [US4] Add PAYLOAD_API_KEY environment variable to .env.example with placeholder
- [X] T026 [US4] Document migration environment variables in .env.example (MIGRATION_BATCH_SIZE, MIGRATION_DRY_RUN)
- [X] T027 [US4] Update src/services/payload.ts to read API credentials from environment variables
- [X] T028 [US4] Add connection validation on bot startup to verify PayloadCMS API is accessible
- [X] T029 [US4] Add logging for successful PayloadCMS authentication and connection establishment

**Checkpoint**: Configuration management ready - bot can connect to PayloadCMS when credentials are provided

---

## Phase 4: User Story 2 - Historical Content Preserved (Priority: P2)

**Goal**: Migrate all existing video content from Sanity to PayloadCMS with 100% data integrity

**Independent Test**: Run migration script, verify record count matches, query PayloadCMS for known videos and confirm all fields match Sanity data

### Unit Tests for User Story 2

- [ ] T030 [P] [US2] Create tests/unit/migration_transform_test.ts to test Sanity-to-PayloadCMS data transformation
- [ ] T031 [P] [US2] Test case: Transform URL-based video (YouTube) with all required fields from Sanity to PayloadCMS format
- [ ] T032 [P] [US2] Test case: Transform Telegram-uploaded video with Cloudinary fields from Sanity to PayloadCMS format
- [ ] T033 [P] [US2] Test case: Handle slug object extraction (Sanity slug.current → PayloadCMS slug)
- [ ] T034 [P] [US2] Test case: Validate enum values transformation (category, ageRange, source)
- [ ] T035 [P] [US2] Test case: Handle missing optional fields (thumbnailUrl, duration, tags)
- [ ] T036 [P] [US2] Test case: Preserve original createdAt timestamp from Sanity

### Integration Tests for User Story 2

- [ ] T037 [P] [US2] Create tests/integration/migration_verification_test.ts for end-to-end migration verification
- [ ] T038 [P] [US2] Test case: Export small dataset from Sanity and verify GROQ query returns expected structure
- [ ] T039 [P] [US2] Test case: Import transformed records to PayloadCMS and verify API accepts all fields
- [ ] T040 [P] [US2] Test case: Verify PayloadCMS enforces conditional required fields (youtubeUrl/Id for url source)
- [ ] T041 [P] [US2] Test case: Verify slug uniqueness constraint in PayloadCMS (duplicate slugs rejected)

### Implementation for User Story 2

- [ ] T042 [US2] Run scripts/count-sanity-videos.ts to determine total video count and estimate migration time
- [ ] T043 [US2] Run scripts/export-sanity-backup.ts to create full Sanity data backup before migration
- [ ] T044 [US2] Test migration script in dry-run mode: MIGRATION_DRY_RUN=true deno run scripts/migrate-sanity-to-payload.ts
- [ ] T045 [US2] Review dry-run logs and verify data transformation correctness before actual migration
- [ ] T046 [US2] Execute production migration: deno run --allow-net --allow-env scripts/migrate-sanity-to-payload.ts
- [ ] T047 [US2] Monitor migration progress logs and handle any batch failures with resume capability
- [ ] T048 [US2] Run scripts/verify-migration.ts to validate 100% data integrity (record count + field comparison)
- [ ] T049 [US2] Review verification-report.json for any discrepancies and resolve if needed
- [ ] T050 [US2] Perform manual spot checks in PayloadCMS admin panel for known videos

**Checkpoint**: All historical content migrated to PayloadCMS with verified data integrity

---

## Phase 5: User Story 3 - Data Integrity Verified (Priority: P3)

**Goal**: Automated verification confirms 100% data match between Sanity and PayloadCMS before decommissioning old system

**Independent Test**: Run verification scripts, generate report showing field-by-field equivalence with zero discrepancies

### Implementation for User Story 3

- [ ] T051 [US3] Execute full verification suite: deno run scripts/verify-migration.ts > verification-full-report.txt
- [ ] T052 [US3] Verify record count matches: Sanity total === PayloadCMS total (zero missing records)
- [ ] T053 [US3] Verify random sample: 100 records checked field-by-field with 100% match rate
- [ ] T054 [US3] Verify all required fields populated: No null values in title, slug, category, ageRange, source
- [ ] T055 [US3] Verify slug uniqueness: No duplicate slugs exist in PayloadCMS
- [ ] T056 [US3] Verify enum validity: All category, ageRange, source values match allowed enums
- [ ] T057 [US3] Verify conditional fields: URL source has youtubeUrl/Id, Telegram source has cloudinaryUrl/Id
- [ ] T058 [US3] Generate audit report documenting migration success (include verification metrics)
- [ ] T059 [US3] Archive verification report and migration logs for compliance/audit trail

**Checkpoint**: Data integrity verified at 100% - safe to proceed with bot configuration update

---

## Phase 6: User Story 1 - Content System Continues Operating (Priority: P1)

**Goal**: Bot continues accepting and storing video submissions through PayloadCMS without interruption or data loss

**Independent Test**: Submit new video via Telegram bot, verify it's stored in PayloadCMS and distributed to correct groups

### Integration Tests for User Story 1

- [ ] T060 [P] [US1] Create tests/integration/payload_submission_test.ts for bot video submission workflow
- [ ] T061 [P] [US1] Test case: Submit YouTube URL via bot, verify video saved to PayloadCMS with correct category/age range
- [ ] T062 [P] [US1] Test case: Upload video file via Telegram, verify video saved to PayloadCMS with Cloudinary fields
- [ ] T063 [P] [US1] Test case: Verify bot distributes video to correct Telegram groups based on ageRange
- [ ] T064 [P] [US1] Test case: Verify bot response time remains under 5 seconds for video submission
- [ ] T065 [P] [US1] Test case: Verify bot handles PayloadCMS API errors gracefully with retry logic

### Implementation for User Story 1

- [ ] T066 [US1] Update PAYLOAD_API_URL environment variable on Deno Deploy with actual PayloadCMS Cloud URL
- [ ] T067 [US1] Update PAYLOAD_API_KEY environment variable on Deno Deploy with generated API key
- [ ] T068 [US1] Keep Sanity credentials in environment (DO NOT DELETE) for rollback safety during verification period
- [ ] T069 [US1] Deploy bot configuration update to production and monitor deployment logs
- [ ] T070 [US1] Test YouTube URL submission through Telegram bot and verify video appears in PayloadCMS
- [ ] T071 [US1] Test direct video file upload through Telegram bot and verify video appears in PayloadCMS with Cloudinary
- [ ] T072 [US1] Test category selection flow and verify correct category stored in PayloadCMS
- [ ] T073 [US1] Test age range selection and verify video distributed to correct Telegram groups
- [ ] T074 [US1] Monitor bot error logs for 30 minutes post-deployment to catch any PayloadCMS API issues
- [ ] T075 [US1] Verify bot response times remain under 5 seconds (measure and compare to pre-migration baseline)
- [ ] T076 [US1] Test all 8 video categories (education, entertainment, music, science, arts-crafts, sports, nature, stories)
- [ ] T077 [US1] Test all 5 age ranges (0-2, 3-5, 6-8, 9-12, 13+) to verify group distribution logic

**Checkpoint**: Bot fully operational with PayloadCMS - begin 72-hour verification period

---

## Phase 7: Polish & Decommissioning

**Purpose**: Remove Sanity dependencies after successful 72-hour verification period

### 72-Hour Verification Period

- [ ] T078 Monitor bot operations for 72 consecutive hours (3 days) with zero PayloadCMS-related failures
- [ ] T079 Track daily video submission counts and verify they match pre-migration averages
- [ ] T080 Monitor bot error rates and response times to ensure no performance degradation
- [ ] T081 Review any user reports or complaints during verification period
- [ ] T082 Verify historical data queries work correctly (search, filter by category/age range)
- [ ] T083 Confirm MongoDB Atlas cluster performance is acceptable (query response times < 2s)

### Sanity Cleanup

- [X] T084 Create final Sanity backup export (backup already exists from earlier: sanity-backup-2026-01-17T22-53-04.json)
- [X] T085 Remove SANITY_PROJECT_ID environment variable from .env
- [X] T086 Remove SANITY_DATASET environment variable from .env
- [X] T087 Remove SANITY_TOKEN environment variable from .env
- [X] T088 Remove Sanity credential placeholders from .env.example file
- [X] T089 Update README.md to replace Sanity setup instructions with MongoDB setup instructions
- [X] T090 Document MongoDB configuration in README.md (MongoDB Atlas setup guide added)

### Documentation & Archival

- [ ] T091 [P] Archive migration scripts to archive/migration-2026-01/ directory for historical reference
- [ ] T092 [P] Update project documentation to reference PayloadCMS as primary CMS (remove Sanity mentions)
- [ ] T093 [P] Document MongoDB backup strategy in docs/ (recommend Atlas paid tier for automated backups)
- [ ] T094 [P] Create docs/payloadcms-setup.md with developer onboarding instructions for PayloadCMS
- [ ] T095 [P] Update CONTRIBUTING.md (if exists) with PayloadCMS local development setup
- [ ] T096 Document migration completion in CHANGELOG.md with date, record count, and success metrics
- [ ] T097 Commit all documentation changes: "docs: Complete Sanity to PayloadCMS migration, update setup instructions"

**Checkpoint**: Migration fully complete, Sanity decommissioned, documentation updated ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - Deploy infrastructure first
- **Foundational (Phase 2)**: Depends on Phase 1 (need PayloadCMS API for testing scripts)
- **User Story 4 (Phase 3)**: Depends on Phase 2 (configuration code needs migration scripts for testing)
- **User Story 2 (Phase 4)**: Depends on Phase 1 & 2 (infrastructure + scripts) - Execute migration
- **User Story 3 (Phase 5)**: Depends on Phase 4 (must complete migration before verification)
- **User Story 1 (Phase 6)**: Depends on Phase 3 & 5 (config ready + data verified) - Update production
- **Polish (Phase 7)**: Depends on Phase 6 (72-hour verification) - Final cleanup

### User Story Dependencies

**Migration-Specific Ordering** (differs from typical feature development):

1. **US4 (P4) - System Configuration**: First - Need config management for deployment
2. **US2 (P2) - Historical Content**: Second - Migrate data before switching bot
3. **US3 (P3) - Data Integrity**: Third - Verify migration before production cutover
4. **US1 (P1) - Content System**: Fourth - Deploy to production after verification

**Rationale**: This ordering reflects migration workflow rather than business priority. US1 (P1) is most critical for business but comes last because it requires US2 (data migrated) and US3 (verified) to be complete.

### Within Each Phase

- Tests must be written and pass/fail appropriately before implementation
- Infrastructure tasks (Phase 1) must complete before scripts (Phase 2)
- Migration execution (Phase 4) must complete before verification (Phase 5)
- Verification (Phase 5) must pass before production deployment (Phase 6)
- 72-hour monitoring must complete before Sanity cleanup

### Parallel Opportunities

- **Phase 1 Setup**: T001-T003 (MongoDB Atlas) can run parallel with T004-T006 (PayloadCMS)
- **Phase 2 Scripts**: T011, T012 can run parallel; T030-T036 (unit tests) can run parallel; T037-T041 (integration tests) can run parallel
- **Phase 3 Config**: T024-T026 (env variables) can run parallel
- **Phase 6 Testing**: T060-T065 (integration tests) can run parallel; T076-T077 (category/age range tests) can run parallel after T070
- **Phase 7 Docs**: T091-T095 (documentation updates) can run parallel

---

## Parallel Example: User Story 2 Testing

```bash
# Launch all unit tests for data transformation together:
Task T030: "Test Sanity YouTube video transformation"
Task T031: "Test Sanity Telegram video transformation"
Task T032: "Test slug extraction from Sanity format"
Task T033: "Test enum values transformation"
Task T034: "Test optional fields handling"
Task T035: "Test timestamp preservation"

# Launch all integration tests together:
Task T037: "Test Sanity export API"
Task T038: "Test PayloadCMS import API"
Task T039: "Test conditional validation"
Task T040: "Test slug uniqueness constraint"
```

---

## Implementation Strategy

### Recommended Execution Order

**Week 1: Infrastructure & Scripts**
1. Complete Phase 1: Setup (Deploy MongoDB Atlas + PayloadCMS)
2. Complete Phase 2: Foundational (Build migration scripts)
3. Complete Phase 3: US4 Configuration (Environment variables)
4. **STOP and VALIDATE**: Test scripts in dry-run mode

**Week 2: Migration Execution**
5. Complete Phase 4: US2 Historical Content (Execute migration)
6. Complete Phase 5: US3 Data Integrity (Verify migration)
7. **STOP and VALIDATE**: Review verification report, ensure 100% success

**Week 3: Production Cutover**
8. Complete Phase 6: US1 Content System (Deploy to production)
9. Begin Phase 7: 72-hour monitoring (Verify bot operations)
10. **STOP and VALIDATE**: Monitor for issues, keep rollback option ready

**Week 4: Cleanup**
11. Complete Phase 7: Decommission Sanity (Remove credentials)
12. Complete Phase 7: Documentation updates
13. **DONE**: Migration complete! 🎉

### Rollback Strategy

**If issues arise during Phase 6 (Production Cutover)**:

1. **Quick Rollback** (< 5 minutes):
   - Restore Sanity credentials on Deno Deploy
   - Add environment flag: `USE_SANITY_CMS=true` (requires code change if not implemented)
   - Redeploy bot configuration
   - Verify bot switches back to Sanity

2. **Full Rollback** (If data corruption detected):
   - Restore from Sanity backup: `deno run scripts/import-sanity-backup.ts < sanity-backup-final.json`
   - Pause bot temporarily
   - Investigate and fix issues
   - Re-run migration with fixes

**Safety Net**: Keep Sanity credentials active until T084 (after 72-hour verification passes)

### MVP Approach

**Minimum Viable Migration**:
1. Phase 1: Setup infrastructure
2. Phase 2: Build migration scripts
3. Phase 4: US2 Migrate data
4. Phase 6: US1 Deploy to production (skip comprehensive testing if time-critical)

**Recommended Full Migration** (includes verification):
- All phases in order
- Includes US3 verification for confidence
- 72-hour monitoring before cleanup

---

## Success Metrics

### Migration Completion Criteria

- ✅ **SC-001**: All videos migrated (100% record count match between Sanity and PayloadCMS)
- ✅ **SC-002**: All fields verified (100 random samples match field-by-field)
- ✅ **SC-003**: Bot operational (new submissions work via PayloadCMS)
- ✅ **SC-004**: Performance maintained (response times within 10% of pre-migration baseline)
- ✅ **SC-005**: Zero downtime (bot never stopped serving users during migration)
- ✅ **SC-006**: 72-hour verification passed (zero PayloadCMS-related failures)
- ✅ **SC-007**: Sanity decommissioned (credentials removed, dependencies removed)
- ✅ **SC-008**: Documentation updated (README.md, developer onboarding docs)

### Task Summary

- **Total Tasks**: 97
- **Setup Phase**: 10 tasks (T001-T010)
- **Foundational Phase**: 13 tasks (T011-T023)
- **User Story 4 (Configuration)**: 6 tasks (T024-T029)
- **User Story 2 (Data Migration)**: 19 tasks (T030-T050) - includes 12 tests
- **User Story 3 (Verification)**: 9 tasks (T051-T059)
- **User Story 1 (Production)**: 18 tasks (T060-T077) - includes 6 tests
- **Polish/Cleanup Phase**: 20 tasks (T078-T097)

### Parallel Opportunities

- **Setup Phase**: 2 parallel groups (MongoDB + PayloadCMS simultaneously)
- **Foundational Phase**: 3 parallel groups (count/backup scripts; unit tests; integration tests)
- **User Story 2**: 12 test tasks can run in parallel
- **User Story 1**: 6 test tasks can run in parallel; category/age testing can partially parallel
- **Cleanup Phase**: 5 documentation tasks can run in parallel

**Estimated Timeline**:
- Single developer: 3-4 weeks (includes 72-hour monitoring)
- With parallelization: 2-3 weeks (testing in parallel, monitoring still requires 72 hours)

---

## Notes

- **[P] tasks**: Different files/systems, no sequential dependencies
- **[Story] labels**: Map tasks to user stories for traceability (US1, US2, US3, US4)
- **Unique migration ordering**: Lower priority US4 comes first (infrastructure), higher priority US1 comes last (production cutover)
- **Tests included**: Migration requires testing for data integrity, included in US2
- **Safety emphasis**: Multiple verification checkpoints, 72-hour monitoring, rollback capability
- **Temporary scripts**: Migration scripts will be archived after completion, not permanent codebase additions
- **Zero downtime**: Migration designed to execute without bot downtime, cutover happens via configuration change

**⚠️ Critical Path**: Setup (Phase 1) → Scripts (Phase 2) → Migration (Phase 4) → Verification (Phase 5) → Production (Phase 6) → 72-hour wait → Cleanup (Phase 7)

**📋 Before Starting**: Confirm you have access to Sanity credentials, MongoDB Atlas account, PayloadCMS Cloud account, and Deno Deploy production environment

**🎯 MVP Scope**: For fastest migration, complete T001-T050 (Setup + Scripts + Migration), then T066-T077 (Production Cutover), monitor for 72 hours, then cleanup. Skip tests if time-critical (not recommended but possible).
