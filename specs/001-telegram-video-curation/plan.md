# Implementation Plan: Telegram Video Curation Bot

**Branch**: `001-telegram-video-curation` | **Date**: 2025-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-telegram-video-curation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements a Telegram bot that monitors age-range specific groups for YouTube video links. When a curator shares a video link, the bot presents category selection buttons, then submits the video metadata to Sanity CMS with appropriate age range and category tags. The bot handles concurrent submissions from multiple curators, validates YouTube URLs, and provides retry logic for failed CMS submissions.

## Technical Context

**Language/Version**: TypeScript 5.8+ / Node.js 18+  

**Primary Dependencies**: 
- **grammY** (latest) - Telegram Bot API framework (chosen for best TypeScript support)
- **@googleapis/youtube** (latest) - YouTube Data API v3 client (official Google client)
- **@sanity/client** 7.14.0 (already in project)
- **dotenv** - Environment configuration
- **Jest** - Testing framework

**Storage**: 
- **Sanity CMS** (production dataset) - existing video schema, no modifications needed
- **In-memory Map with TTL** - Message-callback correlation (Phase 1 MVP)
  - Redis-ready architecture for future scaling (Phase 2)
  - State cleanup: hourly purge of expired entries (24h TTL)

**Testing**: 
- **Jest** with TypeScript support
- Mock external APIs: Telegram (grammY context), YouTube (@googleapis), Sanity client
- Integration tests with test Sanity dataset
- Manual testing with test Telegram groups

**Target Platform**: 
- **Railway** (recommended for MVP deployment)
  - Always-on free tier (~$5/month credit)
  - GitHub auto-deploy
  - Easy environment variable management
- **VPS migration path** documented for future scaling

**Project Type**: Backend service (bot server) + existing web frontend

**Performance Goals**: 
- Bot response time: <2s from message to category buttons (SC-004)
- CMS submission: <5s from category selection to confirmation (SC-008)
- Handle 10 concurrent submissions without mixing data (SC-006)
- YouTube API: ~3 units per video (well within 10,000 units/day quota)

**Constraints**: 
- Must maintain message-callback state correlation
- Telegram inline keyboard callback data limited to 64 bytes
  - Callback format: `cat:{messageId}:{chatId}:{category}` (~40 chars)
- YouTube API quota limits (10,000 units/day default, ~300 units/day expected)
- Must operate continuously (long-polling mode for Railway deployment)

**Scale/Scope**: 
- 5 age-range groups to monitor
- 8 category options per video
- Estimated load: <100 video submissions/day initially
- Multiple curators per group (2-5 concurrent users expected)
- Single bot instance sufficient for MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Cyclomatic Complexity Limit: 5

**Assessment**: ✅ PASS (with monitoring)

**Anticipated Complex Functions**:
- YouTube URL parsing and ID extraction (complexity: 3-4)
  - Multiple URL format checks (youtube.com, youtu.be, embed)
  - Guard clauses keep complexity manageable
- Message-callback correlation logic (complexity: 3-4)
  - State lookup, validation, cleanup
  - Will decompose into: `findPendingSubmission()`, `validateCallback()`, `cleanupExpired()`
- Retry logic with exponential backoff (complexity: 3)
  - Single loop with delay calculation
  - Error handling separated

**Mitigation Strategy**:
- URL parsing: Use regex patterns + guard clauses, extract to `extractYoutubeId(url)`
- State management: Separate functions for get/set/cleanup operations
- Retry: Use library (e.g., `p-retry`) or simple recursive function
- ESLint complexity rule will be enforced at ≤5

### SOLID Principles

**Single Responsibility Principle (SRP)**: ✅ COMPLIANT
- Bot message handler: Only receives and routes messages
- YouTube metadata extractor: Only fetches video data
- Sanity client wrapper: Only CMS operations
- State manager: Only tracks message-callback pairs
- Each module has one reason to change

**Open/Closed Principle (OCP)**: ✅ COMPLIANT
- Category options configurable via environment/config file
- Age range group mappings externalized to config
- CMS client abstracted behind interface for future swaps
- YouTube API client can be swapped without bot logic changes

**Liskov Substitution Principle (LSP)**: ✅ COMPLIANT
- YouTube metadata extractor implements standard interface
- Mock implementations for testing follow same contract
- Error types standardized across async operations

**Interface Segregation Principle (ISP)**: ✅ COMPLIANT
- Bot handler doesn't depend on full YouTube API surface
- Sanity client wrapper exposes only `createVideo()` operation
- State manager interface limited to `store()`, `retrieve()`, `cleanup()`

**Dependency Inversion Principle (DIP)**: ✅ COMPLIANT
- Bot depends on abstractions (IYouTubeClient, ISanityClient, IStateStore)
- High-level bot logic doesn't depend on Telegram API details
- Configuration injected, not hard-coded

### Code Quality Gates

**Pre-Commit Checks**:
- TypeScript strict mode compilation
- ESLint with complexity ≤ 5 rule
- Prettier formatting
- No console.log in production code

**Pre-Merge Requirements**:
- All unit tests passing
- Integration tests with mocked Telegram/YouTube/Sanity
- Code coverage ≥ 80%
- No ESLint warnings
- TypeScript strict checks passing

### Architecture Compliance

**Structure**: ✅ COMPLIANT
- New `bot/` directory at repository root (separate concern from Sanity Studio)
- Follows repository structure: `bot/src/`, `bot/tests/`
- Does not violate "one type per file" - each handler/client in separate module
- TypeScript with proper type definitions

**Naming**: ✅ COMPLIANT
- camelCase for functions: `handleMessage()`, `extractYoutubeId()`
- PascalCase for types: `VideoSubmission`, `MessageState`
- Config constants: UPPER_SNAKE_CASE

### Project Complexity Assessment

**Current Projects in Repository**:
1. Sanity Studio (CMS backend)
2. Next.js Frontend
3. **NEW**: Telegram Bot Service

**Justification for 3rd Project**: ✅ JUSTIFIED
- Bot is a separate runtime with different lifecycle (long-running daemon vs. web server)
- Different deployment target (Node process vs. Vercel/static hosting)
- Independent scaling requirements
- Clear boundary: Bot writes to Sanity, doesn't read (unidirectional dependency)
- Could NOT be merged into frontend (different execution model) or Studio (different purpose)

**Violations Requiring Justification**: NONE

### Re-evaluation After Phase 1

✅ **COMPLETE** - All design artifacts reviewed and compliant

**Data Model Complexity**: ✅ PASS
- MessageState: 9 fields, single responsibility (state tracking)
- CategorySelection: 4 fields, ephemeral (not persisted)
- VideoSubmission: 7 fields (matches existing Sanity schema exactly)
- No new Sanity schema types added
- No schema modifications required

**API Contracts Compliance**: ✅ PASS
- Sanity API contract: Single endpoint, clear interface, includes retry logic
- YouTube API contract: Minimal quota usage (snippet only), graceful degradation
- Telegram Bot contract: Separated concerns (message handler, callback handler, URL parser)
- All interfaces follow ISP (Interface Segregation Principle)

**Cyclomatic Complexity Verification**: ✅ PASS
- MessageHandler.handleMessage(): Complexity ~4 (guard clauses, single try-catch)
- CallbackHandler.handleCallback(): Complexity ~4 (guards, validation, single try-catch)
- YouTubeUrlParser.extractVideoId(): Complexity ~2 (regex match, ternary)
- CategoryKeyboard.build(): Complexity ~2 (loop, modulo check)
- CallbackDataParser.parse(): Complexity ~3 (split, validation, return)
- All handlers decomposed into small functions per SOLID SRP

**Architecture Verification**: ✅ PASS
- Clear separation of concerns: handlers, services, utils, config, types
- Dependency injection used throughout (IStateStore, IYouTubeService, ISanityService)
- No circular dependencies
- Each module has single responsibility
- Testing strategy supports mocking all external dependencies

**No Additional Violations Introduced**: ✅ CONFIRMED

## Project Structure

### Documentation (this feature)

```text
specs/001-telegram-video-curation/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - bot state schema
├── quickstart.md        # Phase 1 output - bot setup guide
├── contracts/           # Phase 1 output
│   ├── sanity-api.yaml      # Sanity client interface
│   ├── telegram-bot.yaml    # Bot message handling
│   └── youtube-api.yaml     # YouTube metadata extraction
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Existing Structure (unchanged)
sanity.config.ts         # Sanity Studio configuration
schemaTypes/             # Sanity schema definitions
  └── documents/
      └── video.ts       # Existing video schema (will be used by bot)

frontend/                # Next.js application (unchanged)
  ├── src/
  └── package.json

# New: Telegram Bot Service
bot/                     # NEW: Telegram bot service
├── src/
│   ├── index.ts         # Bot entry point, long-polling setup
│   ├── handlers/
│   │   ├── messageHandler.ts      # Processes incoming messages
│   │   └── callbackHandler.ts     # Processes inline button callbacks
│   ├── services/
│   │   ├── youtubeService.ts      # YouTube metadata extraction
│   │   ├── sanityService.ts       # Sanity CMS client wrapper
│   │   └── stateManager.ts        # Message-callback correlation
│   ├── utils/
│   │   ├── urlParser.ts           # YouTube URL parsing
│   │   ├── retry.ts               # Exponential backoff retry logic
│   │   └── logger.ts              # Structured logging
│   ├── config/
│   │   ├── categories.ts          # Category button definitions
│   │   └── ageRangeGroups.ts      # Group ID to age range mapping
│   └── types/
│       ├── VideoSubmission.ts     # Type definitions
│       └── MessageState.ts
├── tests/
│   ├── unit/
│   │   ├── urlParser.test.ts
│   │   ├── stateManager.test.ts
│   │   └── retry.test.ts
│   ├── integration/
│   │   ├── messageFlow.test.ts    # Full message → category → CMS flow
│   │   └── concurrentSubmissions.test.ts
│   └── fixtures/
│       ├── telegramMessages.ts    # Mock Telegram message objects
│       └── youtubeResponses.ts    # Mock YouTube API responses
├── package.json
├── tsconfig.json
├── .env.example         # Environment variable template
└── README.md            # Bot-specific documentation

# Root Configuration
.env                     # Environment variables (Telegram token, Sanity config, YouTube API key)
package.json             # Root package.json (may add workspace support)
```

**Structure Decision**: 

This feature adds a new `bot/` directory at the repository root, creating a **3-project monorepo**:
1. **Sanity Studio** (root): Content management interface
2. **Frontend** (`frontend/`): Next.js public-facing website
3. **Telegram Bot** (`bot/`): NEW - Video curation automation service

The bot is architecturally separate because:
- **Different runtime**: Long-running daemon vs. request-response web servers
- **Different deployment**: Node process (VPS/container) vs. Vercel/static hosting
- **Unidirectional dependency**: Bot writes to Sanity but doesn't serve content
- **Independent scaling**: Bot scales with curator activity, not public traffic

The bot uses the existing `video` schema from `schemaTypes/documents/video.ts` without modification, creating video documents via Sanity's HTTP API.

## Complexity Tracking

> **No violations requiring justification** - all constitution checks passed.

---

## Phase Completion Status

### Phase 0: Outline & Research ✅ COMPLETE

**Deliverable**: `research.md`

**Completed Research**:
- ✅ Telegram Bot Library: Selected **grammY** (best TypeScript support, modern API)
- ✅ YouTube API Integration: Selected **@googleapis/youtube** (official client, type-safe)
- ✅ State Management: **In-memory Map with TTL** for MVP, Redis-ready architecture
- ✅ Testing Strategy: **Jest** with mocked dependencies, integration tests
- ✅ Deployment Platform: **Railway** for MVP (free tier, easy setup)

**Key Decisions Documented**:
- Technology stack fully specified
- Performance considerations analyzed
- Security requirements defined
- Migration paths identified (Redis, VPS)

**Unknowns Resolved**: All 5 NEEDS CLARIFICATION items from Technical Context resolved

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Deliverables**: 
- ✅ `data-model.md` - Entity schemas, state management, data flows
- ✅ `contracts/sanity-api.yaml` - Sanity CMS API contract with TypeScript interfaces
- ✅ `contracts/youtube-api.yaml` - YouTube Data API contract with error handling
- ✅ `contracts/telegram-bot.yaml` - Bot handlers, keyboard builder, URL parser
- ✅ `quickstart.md` - Setup guide, deployment instructions, troubleshooting

**Design Artifacts**:
- MessageState schema with TTL (24h expiration)
- CategorySelection callback data format
- VideoSubmission payload structure
- AgeRangeGroupMapping configuration
- IStateStore interface for future Redis migration

**API Contracts**:
- Sanity mutations endpoint with retry logic
- YouTube videos.list endpoint with quota management
- Telegram bot handlers with grammY framework
- TypeScript interfaces for all services

**Agent Context**:
- ✅ Updated `.github/agents/copilot-instructions.md`
- Added TypeScript 5.8+ / Node.js 18+
- Added grammY, @googleapis/youtube technologies

---

### Phase 2: Task Breakdown (NOT STARTED)

**Next Step**: Run `/speckit.tasks` command to generate `tasks.md`

**Expected Outputs**:
- Dependency-ordered implementation tasks
- File creation tasks for bot directory structure
- Configuration tasks for environment setup
- Testing tasks for unit and integration tests
- Deployment tasks for Railway setup

**Ready for Implementation**: Yes - all design complete, research resolved

---

## Implementation Readiness Checklist

- [x] Feature specification complete
- [x] Technical context fully specified
- [x] Constitution compliance verified
- [x] Research completed (all NEEDS CLARIFICATION resolved)
- [x] Data model designed
- [x] API contracts defined
- [x] Quickstart guide written
- [x] Agent context updated
- [ ] Tasks breakdown (Phase 2 - run `/speckit.tasks`)
- [ ] Implementation (Phase 3 - run `/speckit.implement`)

---

## Next Actions

### For Planning Team:
1. Review this plan for completeness
2. Approve technology selections (grammY, googleapis, Railway)
3. Verify data model aligns with requirements
4. Confirm API contracts match existing Sanity schema

### For Implementation Team:
1. Run `/speckit.tasks` to generate implementation tasks
2. Set up bot development environment (see `quickstart.md`)
3. Create Telegram bot with BotFather
4. Configure age-range groups and obtain chat IDs
5. Get YouTube Data API key and Sanity API token
6. Begin implementation following generated tasks

### For DevOps Team:
1. Set up Railway project
2. Configure environment variables
3. Set up monitoring and alerting
4. Prepare for deployment

---

## Appendices

### A. Technology Justifications

**grammY vs Telegraf vs node-telegram-bot-api**:
- grammY: Built-in TypeScript, modern API, active development
- Telegraf: Good middleware but complex types
- node-telegram-bot-api: JavaScript-first, lacks abstractions
- **Decision**: grammY for best DX and type safety

**googleapis vs Custom Fetch**:
- googleapis: Official client, handles auth, includes types, retry logic
- Custom fetch: More control but manual error handling, no types
- **Decision**: googleapis for stability and maintenance

**In-Memory Map vs Redis (Phase 1)**:
- Map: Simple, no dependencies, sufficient for <100 submissions/day
- Redis: Overkill for MVP, adds operational complexity
- **Decision**: Map with Redis-ready architecture for future scaling

**Railway vs Render vs VPS**:
- Railway: Free tier, easy GitHub deployment, good DX
- Render: $7/month minimum, more features than needed
- VPS: Full control but requires DevOps work
- **Decision**: Railway for MVP, VPS for production scaling

### B. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| YouTube API quota exceeded | Low | Medium | Implement caching, request quota increase, fallback to URL as title |
| Sanity API failures | Low | High | Retry logic (3 attempts), exponential backoff, user notification |
| Bot restart loses state | Medium | Low | Document limitation, Redis migration path, acceptable for MVP |
| Concurrent curator conflicts | Low | Medium | User ID validation, unique message keys, tested in integration tests |
| Invalid YouTube URLs | Medium | Low | Regex validation, graceful error messages, no CMS pollution |

### C. Performance Benchmarks

Based on research and architecture:

| Metric | Target | Expected | Notes |
|--------|--------|----------|-------|
| Message → Buttons | <2s | ~1s | YouTube API + rendering |
| Category → Confirmation | <5s | ~3s | Sanity API with retry |
| Concurrent Submissions | 10 | 50+ | Map lookups O(1), tested |
| Daily Quota Usage | N/A | 300/10,000 units | 3% of YouTube quota |
| Memory Usage | N/A | <200MB | Map with 1000 entries ~5MB |
| State Cleanup | 1h | 1h | Hourly cron, <1s execution |

### D. Future Enhancements

**Phase 2 Enhancements** (not in MVP):
- Redis state persistence for multi-instance deployment
- Webhook mode instead of long-polling (lower latency)
- Admin notification channel for failed submissions
- Video duration extraction from YouTube API
- Duplicate video detection (by youtubeId)
- Command interface (`/start`, `/help`, `/stats`)

**Phase 3 Enhancements** (post-launch):
- Analytics dashboard (submissions per group, category distribution)
- Automatic tagging using video description NLP
- Curator leaderboard (most submissions)
- Scheduled message reminders for inactive groups
- Multi-language support for category buttons

---

**Plan Status**: ✅ COMPLETE (Phases 0-1)  
**Ready for Task Generation**: ✅ YES  
**Estimated Implementation Time**: 3-5 days (1 developer)  
**Complexity Rating**: Medium (familiar technologies, clear requirements)  

**Generated**: 2025-01-20  
**Last Updated**: 2025-01-20  
**Version**: 1.0.0
