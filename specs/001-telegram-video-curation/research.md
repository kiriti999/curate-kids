# Research: Telegram Video Curation Bot

**Feature**: 001-telegram-video-curation  
**Date**: 2025-01-20  
**Purpose**: Technology selection and architectural decisions for Telegram bot implementation

## Research Questions & Decisions

### 1. Telegram Bot Library Selection

**Question**: Which Node.js/TypeScript library should we use: node-telegram-bot-api, grammy, or telegraf?

**Decision**: **grammY**

**Rationale**:
- **Best TypeScript support**: Built with TypeScript from the ground up, offering clear, correct, and editor-friendly types
- **Active maintenance**: Very active development, always updating with new Telegram API features
- **Inline keyboards**: Excellent built-in support for inline keyboards and callback queries (core requirement for category selection)
- **Modern architecture**: Clean API design with focus on ease of use and approachability
- **Performance**: Lightweight and efficient, scales well for concurrent operations
- **Plugin ecosystem**: Thriving ecosystem with straightforward integrations
- **Documentation**: Rich, up-to-date documentation

**Alternatives Considered**:
- **telegraf**: Good middleware architecture but TypeScript types can be overly complex; slower to update with new Telegram features
- **node-telegram-bot-api**: Most popular by downloads but JavaScript-first (TypeScript types are afterthought); lacks middleware abstractions for complex flows

**References**: 
- [grammY Official Comparison](https://grammy.dev/resources/comparison)
- [grammY GitHub](https://github.com/grammyjs/grammY)

---

### 2. YouTube Data API Integration

**Question**: Should we use the official `@googleapis/youtube` library or custom fetch requests?

**Decision**: **@googleapis/youtube (Official Client)**

**Rationale**:
- **Type safety**: Good TypeScript compatibility with official types
- **Authentication handled**: Manages API keys, quotas, and error handling automatically
- **Maintained by Google**: Ensures compatibility with latest API changes
- **Built-in retry logic**: Handles rate limits and quota errors gracefully
- **Simplified request building**: Abstracts away endpoint URLs and payload formatting
- **Error handling**: Standardized error responses for quota limits (10,000 units/day default)

**Implementation Approach**:
- Use API key for read-only public video metadata (not OAuth since we're not accessing private data)
- Extract minimal metadata: video title for the `title` field
- Wrap API calls in service module for easy mocking during tests
- Implement quota monitoring to track daily usage
- Store API key in environment variables

**Alternatives Considered**:
- **Custom fetch**: Would give full control but requires manual auth handling, no built-in types, error-prone parameter handling, and manual retry logic

**References**:
- [YouTube Data API Node.js Quickstart](https://developers.google.com/youtube/v3/quickstart/nodejs)
- [googleapis TypeScript Guide](https://www.xjavascript.com/blog/googleapis-typescript/)

---

### 3. Message-Callback State Management

**Question**: Should we use Redis or in-memory Map with TTL for correlating messages with callback selections?

**Decision**: **In-memory Map with TTL (Phase 1), Redis-ready architecture (Phase 2)**

**Rationale for Phase 1 (MVP)**:
- **Simplicity**: No external dependencies, minimal operational complexity
- **Sufficient for initial scale**: Expected <100 submissions/day, single bot instance
- **Fast access**: No network latency, sub-microsecond lookups
- **Easy testing**: No Redis setup required for local development
- **Low cost**: No additional infrastructure costs

**Implementation Details**:
- Use JavaScript Map to store `messageId -> { youtubeUrl, youtubeId, title, chatId, userId, timestamp }`
- TTL: 24 hours (as specified in edge cases)
- Cleanup: setInterval every hour to purge expired entries
- Key structure: `${chatId}:${messageId}` to ensure uniqueness across groups

**Migration Path to Redis** (when needed):
- Trigger: Multiple bot instances needed OR need for session persistence across restarts
- Architecture prepared: State manager abstracted behind `IStateStore` interface
- Simple swap: Replace Map implementation with Redis client
- Zero bot logic changes required

**Alternatives Considered**:
- **Redis immediately**: Adds operational complexity (setup, monitoring, costs) not justified for MVP scale
- **node-cache library**: Adds dependency for features we can implement simply

**References**:
- [Node.js Caching Comparison](https://leapcell.io/blog/why-simple-node-js-caching-falls-short-compared-to-redis)
- [Redis vs In-Memory](https://fenilsonani.com/articles/optimizing-node-js-performance-with-caching-strategies-in-memory-redis-and-node-cache)

---

### 4. Testing Strategy

**Question**: How should we test Telegram bot functionality without spamming real groups?

**Decision**: **Jest with Mocked Dependencies**

**Rationale**:
- Jest already widely used in Node.js ecosystem
- Good TypeScript support
- Easy mocking of external APIs (Telegram, YouTube, Sanity)

**Testing Layers**:

1. **Unit Tests** (80%+ coverage target):
   - YouTube URL parsing: Test all URL formats (youtube.com/watch, youtu.be, embed, etc.)
   - State manager: Store, retrieve, cleanup with TTL validation
   - Retry logic: Exponential backoff calculations
   - URL validation: Valid/invalid YouTube URLs

2. **Integration Tests**:
   - Full message flow: Incoming message → YouTube fetch → category buttons → CMS submission
   - Concurrent submissions: Multiple users posting simultaneously without data mixing
   - Error scenarios: YouTube API failures, Sanity API failures, invalid URLs

3. **Mocking Strategy**:
   - **grammY**: Use mock context objects for messages and callbacks
   - **YouTube API**: Mock responses with fixtures (`tests/fixtures/youtubeResponses.ts`)
   - **Sanity Client**: Mock `createVideo()` method
   - **Telegram Messages**: Create fixture library (`tests/fixtures/telegramMessages.ts`)

4. **Manual Testing** (Pre-Production):
   - Set up test Telegram group
   - Use test Sanity dataset
   - Verify end-to-end flow with real API integrations

**Test Data**:
- Create fixtures for various video types (different durations, titles with special characters)
- Invalid URL patterns
- API error responses (quota exceeded, rate limits, network failures)

**References**:
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [grammY Testing Guide](https://grammy.dev/guide/testing)

---

### 5. Deployment Platform

**Question**: Where should we deploy the bot: VPS, Railway, Render, or Fly.io?

**Decision**: **Railway (recommended for MVP), with VPS migration path**

**Rationale for Railway**:
- **Always-on**: Perpetual free tier (~$5/month credit) with no cold starts
- **Developer-friendly**: GitHub-based deployment, automatic restarts
- **Environment variables**: Easy configuration for Telegram token, Sanity credentials, YouTube API key
- **Logs and monitoring**: Built-in logging for debugging
- **Cost-effective**: Start free, scale as needed
- **Quick deployment**: Minimal setup time, focus on development

**Configuration Requirements**:
- Environment variables: `TELEGRAM_BOT_TOKEN`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_TOKEN`, `YOUTUBE_API_KEY`
- Age range group mapping: `GROUP_0_2`, `GROUP_3_5`, `GROUP_6_8`, `GROUP_9_12`, `GROUP_13_PLUS` (Telegram chat IDs)
- Node.js version: 18+ (specified in package.json engines field)
- Build command: `npm run build` (TypeScript compilation)
- Start command: `npm start` (runs compiled bot)

**Migration to VPS** (when needed):
- Trigger: Need for custom networking, multiple instances with Redis, or cost optimization
- Options: Hetzner (~$5/month), DigitalOcean, AWS Lightsail
- Requires: Docker setup, reverse proxy for webhooks (optional), monitoring

**Alternatives Considered**:
- **Render**: Good production features but $7/month minimum for always-on; overkill for MVP
- **Fly.io**: Global edge deployment unnecessary for bot; more complex setup
- **VPS**: Full control but requires more DevOps work; better for later scaling

**Deployment Checklist**:
- [ ] Set up Railway project
- [ ] Configure environment variables
- [ ] Connect GitHub repository
- [ ] Set up auto-deploy on main branch
- [ ] Configure health checks (bot ping endpoint)
- [ ] Set up error alerting (Railway logs + email notifications)

**References**:
- [Railway Documentation](https://railway.app/docs)
- [Telegram Bot Hosting Comparison](https://vpssos.com:2096/6-top-telegram-bot-hosting-providers/)

---

## Technology Stack Summary

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Bot Framework** | grammY | Latest | Best TypeScript support, modern API |
| **YouTube API** | @googleapis/youtube | Latest | Official Google client, type-safe |
| **State Storage** | Map + TTL | N/A | Simple MVP solution, Redis-ready architecture |
| **CMS Client** | @sanity/client | 7.14.0 | Already in project |
| **Testing** | Jest | Latest | Standard Node.js testing, good TS support |
| **Deployment** | Railway | N/A | Free tier, always-on, easy setup |
| **Runtime** | Node.js | 18+ | LTS version, modern features |
| **Language** | TypeScript | 5.8+ | Type safety, matches project standard |

---

## Architecture Patterns

### Dependency Injection
- All external services (Telegram, YouTube, Sanity, StateStore) abstracted behind interfaces
- Enables easy mocking for tests
- Allows runtime swapping (e.g., Map → Redis)

### Error Handling
- Exponential backoff retry for Sanity API (3 attempts as per FR-013)
- Graceful degradation for YouTube API failures (submit with limited metadata)
- User-friendly error messages (no stack traces to curators)
- Structured logging for debugging

### Configuration Management
- All secrets in environment variables
- Category options and age range mappings in config files
- Separation of concerns: bot logic independent of configuration

### Monitoring
- Structured logs: JSON format with timestamps, user IDs, message IDs
- Error tracking: Failed submissions, API errors, rate limits
- Metrics: Messages processed, categories selected, CMS success rate

---

## Performance Considerations

### YouTube API Quota Management
- Default quota: 10,000 units/day
- Video details API call: ~3 units per request
- Expected usage: <100 videos/day = <300 units/day (3% of quota)
- Mitigation: Cache video metadata in state (avoid duplicate fetches)

### Response Time Optimization
- Target: <2s from message to category buttons (SC-004)
- Strategy: Parallel YouTube fetch + button rendering
- Caching: Store extracted video ID to avoid re-parsing

### Concurrent Submission Handling
- Target: 10 concurrent submissions without data mixing (SC-006)
- Strategy: Unique message keys `${chatId}:${messageId}`
- Validation: Callback must match original user ID

### Memory Management
- State cleanup: Hourly purge of expired entries (24h+ old)
- Memory limit: Map size monitoring, alert if >10,000 entries
- Restart strategy: Graceful shutdown on memory pressure

---

## Security Considerations

### API Token Security
- All tokens in environment variables, never committed to Git
- `.env.example` template without real values
- Railway secrets encrypted at rest

### Input Validation
- YouTube URL regex validation before API calls
- Callback data validation (ensure messageId exists in state)
- User ID verification (callback user matches original message sender)

### Rate Limiting
- Telegram API: grammY handles built-in rate limits
- YouTube API: Quota monitoring, graceful degradation
- Sanity API: Retry with exponential backoff

### Data Privacy
- No storage of curator personal data beyond Telegram IDs
- Logs sanitized of sensitive information
- Sanity tokens with minimal required permissions (create video documents only)

---

## Open Questions for Implementation Phase

1. **Slug generation**: Should bot auto-generate slug from title, or let Sanity handle it?
   - **Recommendation**: Let Sanity handle via `options.source: 'title'` (existing schema)

2. **Video status field**: Should bot always set `status: "pending"` or make it configurable?
   - **Recommendation**: Hardcode to "pending" as per FR-007

3. **Error notification channel**: Should failed submissions be reported to a separate admin group?
   - **Recommendation**: Reply in same group for MVP, admin channel for Phase 2

4. **Duplicate video detection**: Should bot check if youtubeId already exists before submitting?
   - **Recommendation**: No (edge case states "CMS handles duplicate detection")

5. **Bot command interface**: Should bot support `/start`, `/help` commands for curators?
   - **Recommendation**: Yes, add basic help command explaining usage

---

## Next Steps (Phase 1: Design)

- [ ] Generate data-model.md: Define state schema and entity relationships
- [ ] Generate contracts/: API interfaces for Sanity, YouTube, Telegram
- [ ] Generate quickstart.md: Bot setup and configuration guide
- [ ] Update agent context: Add grammY, googleapis to technology list

---

**Research Status**: ✅ Complete  
**All NEEDS CLARIFICATION items resolved**: Yes  
**Ready for Phase 1**: Yes
