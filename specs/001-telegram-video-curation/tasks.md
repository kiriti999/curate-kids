# Tasks: Telegram Video Curation Bot

**Input**: Design documents from `/specs/001-telegram-video-curation/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are NOT requested in the specification. Focus on implementation only. Manual testing per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This feature uses a monorepo structure with `bot/` directory at repository root:
- Bot source: `bot/src/`
- Bot tests: `bot/tests/`
- Bot config: `bot/.env`, `bot/package.json`, `bot/tsconfig.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and bot directory structure

- [X] T001 Create bot directory structure: `bot/src/{handlers,services,utils,config,types}`, `bot/tests/{unit,integration,fixtures}`
- [X] T002 Initialize bot package with package.json in bot/ (Node.js 18+, TypeScript 5.8+)
- [X] T003 [P] Install grammY, @googleapis/youtube, @sanity/client, dotenv dependencies in bot/
- [X] T004 [P] Install TypeScript dev dependencies in bot/: typescript, @types/node, tsx, jest, @types/jest, ts-jest
- [X] T005 [P] Create bot/tsconfig.json with strict mode and ES2022 target
- [X] T006 [P] Create bot/.env.example with all required environment variables (TELEGRAM_BOT_TOKEN, YOUTUBE_API_KEY, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN, GROUP_0_2, GROUP_3_5, GROUP_6_8, GROUP_9_12, GROUP_13_PLUS)
- [X] T007 [P] Add bot/.gitignore to exclude node_modules, dist, .env
- [X] T008 [P] Add npm scripts to bot/package.json: dev, build, start, test, lint
- [X] T009 [P] Create bot/README.md with setup instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript types and interfaces that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 [P] Create bot/src/types/MessageState.ts with MessageState and AgeRange type definitions
- [X] T011 [P] Create bot/src/types/VideoSubmission.ts with VideoSubmission and VideoCategory type definitions
- [X] T012 [P] Create bot/src/types/CategorySelection.ts with CategorySelection interface
- [X] T013 [P] Create bot/src/config/categories.ts with categoryButtons array (8 categories with emoji and values)
- [X] T014 [P] Create bot/src/config/ageRangeGroups.ts with ageRangeGroups mapping and getAgeRange function
- [X] T015 [P] Create bot/src/utils/logger.ts with structured logging functions (info, warn, error)
- [X] T016 Create bot/src/services/stateManager.ts with IStateStore interface and MemoryStateStore implementation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Share Video Link with Category (Priority: P1) 🎯 MVP

**Goal**: Enable curators to share YouTube links in age-range groups, select categories via inline buttons, and submit videos to Sanity CMS with correct metadata

**Independent Test**: Post YouTube link to test group, select category from inline keyboard, verify video document appears in Sanity CMS with correct title, category, age range, and status=pending

### Implementation for User Story 1

- [X] T017 [P] [US1] Create bot/src/utils/urlParser.ts with YouTubeUrlParser class (hasYouTubeUrl, extractVideoId, extractYouTubeUrl methods)
- [X] T018 [P] [US1] Create bot/src/services/youtubeService.ts with YouTubeService class using @googleapis/youtube (getVideoMetadata method with quota error handling)
- [X] T019 [P] [US1] Create bot/src/services/sanityService.ts with SanityService class using @sanity/client (createVideo method with retry logic)
- [X] T020 [P] [US1] Create bot/src/utils/categoryKeyboard.ts with CategoryKeyboard class (build method returning grammY InlineKeyboard)
- [X] T021 [P] [US1] Create bot/src/utils/callbackDataParser.ts with CallbackDataParser class (parse method for callback data format cat:messageId:chatId:category)
- [X] T022 [US1] Create bot/src/handlers/messageHandler.ts with MessageHandler class implementing message processing flow (depends on T017, T018, T020)
- [X] T023 [US1] Create bot/src/handlers/callbackHandler.ts with CallbackHandler class implementing callback processing flow (depends on T019, T021)
- [X] T024 [US1] Create bot/src/index.ts as entry point initializing bot, registering handlers, and starting long-polling (depends on T022, T023)
- [X] T025 [US1] Add state cleanup scheduler in bot/src/index.ts (hourly setInterval calling stateStore.cleanup())
- [X] T026 [US1] Add error handling middleware in bot/src/index.ts (bot.catch() for global error handling)

**Checkpoint**: At this point, User Story 1 should be fully functional - curator can share video, select category, and video appears in Sanity CMS

---

## Phase 4: User Story 2 - Handle Multiple Curators Simultaneously (Priority: P2)

**Goal**: Enable multiple curators to share different videos simultaneously without mixing up category selections or video data

**Independent Test**: Have two users post different YouTube links within seconds, each select different categories, verify both submissions arrive in Sanity with correct pairings (no cross-contamination)

### Implementation for User Story 2

- [ ] T027 [US2] Add user ID validation in bot/src/handlers/callbackHandler.ts (verify ctx.from.id matches MessageState.userId)
- [ ] T028 [US2] Add unique message key generation in bot/src/handlers/messageHandler.ts (format: `${chatId}:${messageId}`)
- [ ] T029 [US2] Add concurrent state tracking test in bot/tests/integration/concurrentSubmissions.test.ts (create mock concurrent scenarios)
- [ ] T030 [US2] Add error response for unauthorized category selection in bot/src/handlers/callbackHandler.ts (reply "Only original sender can select")
- [ ] T031 [US2] Add logging for concurrent submission tracking in bot/src/handlers/messageHandler.ts and callbackHandler.ts (log userId, messageId, chatId)

**Checkpoint**: Multiple curators can now work simultaneously without data conflicts

---

## Phase 5: User Story 3 - Cross-Age-Range Curation (Priority: P2)

**Goal**: Automatically apply correct age range metadata based on which Telegram group received the video link

**Independent Test**: Post same video link to different age-range groups (0-2, 3-5, 9-12), select categories in each, verify each submission has correct age range in Sanity CMS

### Implementation for User Story 3

- [ ] T032 [US3] Add age range lookup in bot/src/handlers/messageHandler.ts using getAgeRange(ctx.chat.id) from ageRangeGroups config
- [ ] T033 [US3] Add age range to MessageState when storing state in bot/src/handlers/messageHandler.ts
- [ ] T034 [US3] Add age range to VideoSubmission payload in bot/src/handlers/callbackHandler.ts (from MessageState.ageRange)
- [ ] T035 [P] [US3] Add default age range fallback in bot/src/config/ageRangeGroups.ts (return '0-2' if chatId not found)
- [ ] T036 [P] [US3] Add age range validation logging in bot/src/handlers/messageHandler.ts (warn if using default)

**Checkpoint**: Videos submitted from different age-range groups now have correct age range metadata

---

## Phase 6: User Story 4 - Handle Invalid or Missing Video Links (Priority: P3)

**Goal**: Provide helpful feedback for non-YouTube URLs and invalid link formats without creating CMS entries

**Independent Test**: Send text-only messages, invalid URLs, and non-YouTube links; verify bot responds appropriately without creating Sanity entries

### Implementation for User Story 4

- [ ] T037 [P] [US4] Add YouTube URL validation guard in bot/src/handlers/messageHandler.ts (early return if no YouTube URL detected)
- [ ] T038 [P] [US4] Add invalid URL error response in bot/src/handlers/messageHandler.ts (reply "Invalid YouTube link format" if extractVideoId returns null)
- [ ] T039 [P] [US4] Add non-YouTube URL detection in bot/src/utils/urlParser.ts (check for youtube.com or youtu.be domains)
- [ ] T040 [P] [US4] Add error message for non-YouTube URLs in bot/src/handlers/messageHandler.ts (reply "Please share YouTube links only")
- [ ] T041 [US4] Add URL validation logging in bot/src/handlers/messageHandler.ts (log invalid URL attempts for monitoring)

**Checkpoint**: Bot now gracefully handles invalid input without polluting CMS

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, retry logic, edge cases, and deployment preparation

- [ ] T042 [P] Add exponential backoff retry logic in bot/src/services/sanityService.ts (3 attempts: 0s, 2s, 4s delays)
- [ ] T043 [P] Add YouTube API quota exceeded handling in bot/src/services/youtubeService.ts (catch quotaExceeded error, use URL as title fallback)
- [ ] T044 [P] Add Sanity submission failure notifications in bot/src/handlers/callbackHandler.ts (reply "Submission failed, please try again")
- [ ] T045 [P] Add state expiration handling in bot/src/handlers/callbackHandler.ts (reply "Selection expired, please re-share video" if state not found)
- [ ] T046 [P] Add bot restart state loss documentation in bot/README.md (document limitation for MVP)
- [ ] T047 [P] Add environment variable validation in bot/src/index.ts (check all required vars exist on startup)
- [ ] T048 [P] Add performance logging in bot/src/handlers/messageHandler.ts and callbackHandler.ts (track messageToButtonsTime, categoryToConfirmationTime)
- [ ] T049 [P] Create bot/tests/fixtures/telegramMessages.ts with mock Telegram message objects for testing
- [ ] T050 [P] Create bot/tests/fixtures/youtubeResponses.ts with mock YouTube API responses for testing
- [ ] T051 [P] Add unit tests for URL parser in bot/tests/unit/urlParser.test.ts (test all YouTube URL formats)
- [ ] T052 [P] Add unit tests for state manager in bot/tests/unit/stateManager.test.ts (test TTL, cleanup, expiration)
- [ ] T053 [P] Add unit tests for callback parser in bot/tests/unit/callbackDataParser.test.ts (test parse validation)
- [ ] T054 [P] Add integration test for full message flow in bot/tests/integration/messageFlow.test.ts (mock message → YouTube → category → Sanity)
- [ ] T055 Add Railway deployment configuration in bot/ (add engines field to package.json for Node 18+)
- [ ] T056 [P] Update quickstart.md with local development testing instructions
- [ ] T057 [P] Update quickstart.md with Railway deployment steps
- [ ] T058 Run quickstart.md validation (follow setup guide, verify bot works end-to-end)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP SCOPE**
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable

### Within Each User Story

- US1: URL parser, YouTube service, Sanity service, keyboard builder, callback parser → message handler → callback handler → index.ts
- US2: User validation and concurrent tracking can be added in parallel
- US3: Age range lookup and validation can be added in parallel
- US4: URL validation and error responses can be added in parallel

### Parallel Opportunities

#### Phase 1 (Setup) - 6 parallel tasks
```bash
# Can run simultaneously:
T003: Install runtime dependencies
T004: Install dev dependencies  
T005: Create tsconfig.json
T006: Create .env.example
T007: Add .gitignore
T008: Add npm scripts
T009: Create README.md
```

#### Phase 2 (Foundational) - 6 parallel tasks before T016
```bash
# Can run simultaneously:
T010: Create MessageState.ts
T011: Create VideoSubmission.ts
T012: Create CategorySelection.ts
T013: Create categories.ts config
T014: Create ageRangeGroups.ts config
T015: Create logger.ts
# Then:
T016: Create stateManager.ts (uses types from T010-T012)
```

#### Phase 3 (User Story 1) - 5 parallel tasks initially
```bash
# Can run simultaneously (different files, no dependencies):
T017: Create urlParser.ts
T018: Create youtubeService.ts
T019: Create sanityService.ts
T020: Create categoryKeyboard.ts
T021: Create callbackDataParser.ts
# Then sequentially:
T022: messageHandler.ts (needs T017, T018, T020)
T023: callbackHandler.ts (needs T019, T021)
T024: index.ts (needs T022, T023)
T025: Add cleanup scheduler
T026: Add error middleware
```

#### Phase 4 (User Story 2) - All 5 tasks touch different concerns
```bash
# Can be worked in parallel if careful:
T027: User validation (callbackHandler.ts edit)
T028: Message key generation (messageHandler.ts edit)
T029: Integration test (new file)
T030: Error response (callbackHandler.ts edit)
T031: Logging (both handlers - coordinate)
```

#### Phase 5 (User Story 3) - 2 parallel tasks
```bash
# Can run simultaneously:
T035: Default fallback (ageRangeGroups.ts edit)
T036: Validation logging (messageHandler.ts edit)
# Sequential:
T032, T033, T034 (progressive edits to handlers)
```

#### Phase 6 (User Story 4) - 4 parallel tasks
```bash
# Can run simultaneously (different files):
T037: URL validation guard (messageHandler.ts edit)
T038: Invalid URL error (messageHandler.ts edit)
T039: Non-YouTube detection (urlParser.ts edit)
T040: Non-YouTube error (messageHandler.ts edit)
T041: Logging (messageHandler.ts edit)
```

#### Phase 7 (Polish) - 12 parallel tasks
```bash
# Can run simultaneously (different files):
T042: Retry logic (sanityService.ts edit)
T043: Quota handling (youtubeService.ts edit)
T044: Failure notifications (callbackHandler.ts edit)
T045: Expiration handling (callbackHandler.ts edit)
T046: Documentation (README.md edit)
T047: Env validation (index.ts edit)
T048: Performance logging (handlers edits)
T049: Telegram fixtures (new file)
T050: YouTube fixtures (new file)
T051: URL parser tests (new file)
T052: State manager tests (new file)
T053: Callback parser tests (new file)
T054: Integration tests (new file)
T055: Railway config (package.json edit)
T056: Quickstart dev guide (quickstart.md edit)
T057: Quickstart deploy guide (quickstart.md edit)
# Sequential:
T058: Run validation (after all above)
```

---

## Parallel Example: User Story 1 Implementation

```bash
# After Foundational phase completes, launch all independent utilities together:
Task: "Create bot/src/utils/urlParser.ts with YouTubeUrlParser class"
Task: "Create bot/src/services/youtubeService.ts with YouTubeService class"
Task: "Create bot/src/services/sanityService.ts with SanityService class"
Task: "Create bot/src/utils/categoryKeyboard.ts with CategoryKeyboard class"
Task: "Create bot/src/utils/callbackDataParser.ts with CallbackDataParser class"

# Once all 5 complete, proceed sequentially:
Task: "Create messageHandler.ts" (needs urlParser, youtubeService, categoryKeyboard)
Task: "Create callbackHandler.ts" (needs sanityService, callbackDataParser)
Task: "Create index.ts" (needs both handlers)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Recommended approach for fastest time-to-value**

1. Complete Phase 1: Setup (T001-T009) → ~30 minutes
2. Complete Phase 2: Foundational (T010-T016) → ~1 hour  
3. Complete Phase 3: User Story 1 (T017-T026) → ~3-4 hours
4. **STOP and VALIDATE**: Follow quickstart.md, test with real Telegram group
5. Deploy to Railway → Demo working MVP
6. **Total MVP time**: ~5-6 hours (single developer)

**MVP Scope**:
- Curators can share YouTube links
- Bot presents category buttons
- Videos submitted to Sanity CMS
- Manual testing only (no automated tests)

### Incremental Delivery

**Recommended if team wants complete feature**

1. **Week 1**: Complete Setup + Foundational + User Story 1
   - Deploy MVP to Railway
   - Validate with real curators
   - Gather feedback

2. **Week 2**: Add User Story 2 (concurrent submissions)
   - Test with multiple curators
   - Deploy update
   - Monitor for data mixing

3. **Week 3**: Add User Story 3 (cross-age-range)
   - Configure all 5 age-range groups
   - Test across all groups
   - Deploy update

4. **Week 4**: Add User Story 4 (error handling) + Polish
   - Complete all edge cases
   - Add retry logic
   - Write automated tests
   - Final deployment

### Parallel Team Strategy

With 2 developers after Foundational phase:

**Developer A** (Lead):
- T017-T024: User Story 1 core implementation
- T027-T031: User Story 2 concurrent handling
- T042-T048: Polish error handling

**Developer B** (Support):
- T032-T036: User Story 3 age range logic
- T037-T041: User Story 4 validation
- T049-T054: Test fixtures and tests
- T055-T058: Deployment and documentation

**Timeline**: ~2-3 days to complete feature with full testing

---

## Task Count Summary

- **Phase 1 (Setup)**: 9 tasks
- **Phase 2 (Foundational)**: 7 tasks
- **Phase 3 (User Story 1 - MVP)**: 10 tasks
- **Phase 4 (User Story 2)**: 5 tasks
- **Phase 5 (User Story 3)**: 5 tasks
- **Phase 6 (User Story 4)**: 5 tasks
- **Phase 7 (Polish)**: 17 tasks

**Total**: 58 tasks

**Parallel opportunities identified**: 35+ tasks can run in parallel across phases

**MVP scope**: 26 tasks (Phases 1-3 only)

---

## Notes

- **[P] tasks**: Different files, no dependencies - safe for parallel execution
- **[Story] labels**: Map tasks to user stories from spec.md for traceability
- **File paths**: All absolute paths relative to repository root (`bot/src/...`)
- **No tests in MVP**: Tests added in Polish phase only (T051-T054) - manual testing via quickstart.md
- **State loss limitation**: In-memory Map loses state on bot restart (documented as acceptable for MVP, Redis migration path in data-model.md Section 9)
- **Commit strategy**: Commit after each completed task or at phase checkpoints
- **Validation points**: Test independently at each user story checkpoint
- **Dependencies**: Follow phase order strictly - Foundational blocks all user stories

---

## Format Validation: ✅ PASSED

All tasks follow required format:
- ✅ Checkbox prefix: `- [ ]`
- ✅ Task ID: Sequential (T001-T058)
- ✅ [P] marker: Present for parallelizable tasks
- ✅ [Story] label: Present for all user story tasks (US1, US2, US3, US4)
- ✅ Exact file paths: All tasks include specific file locations
- ✅ Clear actions: Each task has implementable description

**Ready for execution**: Yes - tasks can be immediately implemented by `/speckit.implement`
