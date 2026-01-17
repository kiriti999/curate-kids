<!--
SYNC IMPACT REPORT

Version Change: 1.0.0 → 2.0.0 (MAJOR)

Rationale: Complete rewrite to expand scope from Sanity Studio-specific constitution to 
comprehensive CurateKids Bot project covering Telegram bot functionality, Deno runtime,
multiple external service integrations (Cloudinary, Sanity CMS, YouTube API), and 
expanded architectural standards.

Modified Principles:
- Principle I: "Single Responsibility Principle (SRP)" → "Code Quality and SOLID Principles"
  (Expanded to include cyclomatic complexity requirement and code reuse mandate)
- Principle II: "Open/Closed Principle (OCP)" → "Code Maintainability Standards"
  (New focus on constants over literals)
- Principle III: "Liskov Substitution Principle (LSP)" → "Error Handling Standards"
  (Complete redesign for centralized error handling)
- Principle IV: "Interface Segregation Principle (ISP)" → "Documentation Standards"
  (New focus on HLD, JSON API specs, and runtime documentation)
- Principle V: "Dependency Inversion Principle (DIP)" → "Real Data and API Standards"
  (New principle prohibiting mock data and stub implementations)

Added Sections:
- Principle VI: "Superseding Guidance" (new governance principle)
- Technology Stack (Deno, Grammy, Deno Deploy, Deno KV, external services)
- Project Structure (complete directory layout for bot application)
- Detailed Code Quality Standards
- Detailed SOLID Principles (consolidated from removed sections)
- Naming Conventions (comprehensive patterns)
- Detailed Error Handling (retry logic, user feedback, logging)
- Environment Variables (validation and security)
- Telegram Bot Patterns (message handlers, state management, authorization)
- External API Integration (Cloudinary, Sanity, YouTube)
- Detailed Documentation Standards
- Prohibited Practices (consolidated list)
- Git Workflow (branch naming, commit messages, PR requirements)
- Deployment (Deno Deploy specifics)
- Development Workflow & Quality Gates

Removed Sections:
- Schema-specific architecture standards (replaced with general bot architecture)
- Sanity-specific development workflow
- Schema versioning (replaced with general versioning)
- Sanity-specific performance standards
- Sanity-specific security requirements (replaced with general security)

Templates Requiring Updates:
⚠ PENDING: .specify/templates/plan-template.md
  - Constitution Check section may need updates to reflect new principles
⚠ PENDING: .specify/templates/spec-template.md
  - Verify alignment with new documentation standards
⚠ PENDING: .specify/templates/tasks-template.md
  - May need new task categories for error handling, logging, testing

Follow-up TODOs:
- Review and update template files to align with new principles
- Update any agent-specific guidance files if they exist
- Add ESLint complexity rules to project configuration
- Configure pre-commit hooks for complexity validation

Last Generated: 2026-01-17
-->

# CurateKids Bot Constitution

## Project Overview

CurateKids Bot is a Telegram bot that curates kid-friendly video content from various platforms (YouTube, Facebook, Instagram, LinkedIn) and direct uploads. Videos are stored in Sanity CMS with Cloudinary for media hosting.

---

## Core Principles

### I. Code Quality and SOLID Principles

All code MUST adhere to industry best practices for maintainability, readability, and reliability. SOLID principles are mandatory for all contributors and coding agents. Code reviews MUST verify compliance before merge.

**Cyclomatic Complexity**: All functions and methods MUST have a maximum cyclomatic complexity of 5. Functions exceeding this threshold MUST be refactored into smaller, more maintainable units.

**Rationale**: Cyclomatic complexity of 5 or less ensures code remains maintainable and easy to understand. Higher complexity increases the likelihood of bugs and makes code harder to modify safely.

**Code Reuse**: Shared code MUST be extracted to `utils/` or `services/` directories. Code duplication is prohibited.

**Rationale**: Shared code eliminates code duplication, ensures consistent behavior across the application, and simplifies maintenance (fix bugs once). Mandatory functions/code reuse prevents fragmentation and technical debt. Centralized type definitions improve consistency and enable safe refactoring across the codebase.

---

### II. Code Maintainability Standards

**Constants Over Literals**: All string literals used more than once MUST be defined as constants in configuration files or at the top of modules.

**Rationale**: Using constants instead of string literals prevents typos, enables type checking, facilitates refactoring, improves code readability, and ensures consistency across the codebase. Centralized constants eliminate duplication and make global changes safer and easier.

**Example from this codebase:**
```typescript
// ✅ Good - Centralized constants
export const CATEGORIES = [
  { value: "education", label: "📚 Education" },
  { value: "entertainment", label: "🎭 Entertainment" },
] as const;

// ❌ Bad - Magic strings
if (category === "education") { ... }
```

---

### III. Error Handling Standards

All errors MUST be handled consistently with proper logging and user feedback.

**Rationale**: Centralized error handling ensures consistent error semantics, enables better error tracking and monitoring, simplifies debugging across services, and provides better user experience through standardized error messages.

**Required Patterns:**
```typescript
// ✅ Log errors with context
logger.error("Cloudinary upload error", {
  error: error instanceof Error ? error.message : String(error),
  fileId: video.file_id,
});

// ✅ Provide user-friendly feedback
await ctx.reply("❌ Upload failed. Please try again.");
```

---

### IV. Documentation Standards

All features MUST include High-Level Design (HLD) documentation. API specifications MUST be in JSON format (not YAML) for consistency and tooling compatibility.

**Runtime**: Use Deno latest LTS version.

**Rationale**: JSON format for API specifications ensures better tooling support, type generation, and version control diff readability in modern development environments.

**Required Documentation:**
- File header comments describing purpose
- JSDoc for complex functions
- README with setup and deployment instructions
- Environment variable documentation

---

### V. Real Data and API Standards

All applications MUST use real backend APIs and real data sources. Mock APIs, mock data, stub implementations, and hardcoded fake data are strictly PROHIBITED in all environments including development and production.

**Rationale**: Using real data ensures:
- Accurate testing conditions
- Early detection of integration issues
- No discrepancies between development and production behavior
- Reliable performance benchmarks

---

### VI. Superseding Guidance

These principles supersede any other guidance and apply to all contributors and coding agents. No exceptions unless explicitly amended in this constitution.

---

## Technology Stack

### Runtime & Framework
- **Runtime**: Deno (latest LTS version)
- **Bot Framework**: Grammy (Telegram Bot API)
- **Hosting**: Deno Deploy (serverless, webhook-based)
- **State Management**: Deno KV (persistent key-value storage)

### External Services
- **CMS**: Sanity (content management)
- **Media Storage**: Cloudinary (video/image hosting with CDN)
- **Video Metadata**: YouTube Data API v3

### Language & TypeScript
- **Language**: TypeScript (strict mode implied by Deno)
- **Module System**: ES Modules with `.ts` extensions
- **Imports**: Use `npm:` prefix for npm packages, direct URLs for Deno modules

---

## Project Structure

```
curatekids-bot/
├── src/
│   ├── main.ts              # Entry point, bot initialization, webhook handler
│   ├── config/              # Configuration constants and mappings
│   │   └── ageRangeGroups.ts
│   ├── handlers/            # Bot command and event handlers (if extracted)
│   ├── services/            # External service integrations
│   │   ├── cloudinary.ts    # Cloudinary video upload
│   │   ├── sanity.ts        # Sanity CMS operations
│   │   └── youtube.ts       # YouTube metadata fetching
│   ├── types/               # TypeScript interfaces and types
│   │   └── state.ts         # Message state definitions
│   └── utils/               # Utility functions
│       ├── keyboard.ts      # Telegram keyboard builders
│       ├── logger.ts        # Logging utilities
│       └── urlParser.ts     # Video URL detection and parsing
├── deno.json                # Deno configuration and tasks
├── deno.lock                # Dependency lock file
├── .env                     # Environment variables (not committed)
└── README.md                # Project documentation
```

---

## Code Quality Standards (Detailed)

### Cyclomatic Complexity
All functions MUST have a maximum cyclomatic complexity of **5**. Functions exceeding this threshold MUST be refactored into smaller, more maintainable units.

### Function Length
Functions SHOULD NOT exceed **50 lines** of code. Longer functions MUST be split into logical sub-functions.

### Single Responsibility
Each file and function MUST have a single, clear responsibility:
- `services/` - External API integrations only
- `utils/` - Pure utility functions with no side effects
- `config/` - Configuration constants and environment mappings
- `types/` - TypeScript interfaces and type definitions only

### Type Safety
- All functions MUST have explicit return types
- Avoid `any` type; use `unknown` with type guards when necessary
- Use `as const` for literal type inference
- Export types alongside their implementations

---

## SOLID Principles (Detailed)

### Single Responsibility (S)
Each module handles one concern:
- `urlParser.ts` - URL detection only
- `keyboard.ts` - Keyboard building only
- `cloudinary.ts` - Cloudinary operations only

### Open/Closed (O)
Use configuration arrays for extensibility:
```typescript
// ✅ Good - Extend by adding to array
const CATEGORIES = [
  { value: "education", label: "📚 Education" },
  // Add new categories here
] as const;

// ❌ Bad - Requires code changes
if (category === "education") { ... }
else if (category === "music") { ... }
```

### Liskov Substitution (L)
Interfaces MUST be substitutable:
```typescript
// ✅ Good - Both implement same interface
interface VideoSubmission { _type: "video"; title: string; ... }
interface TelegramVideoSubmission extends Omit<VideoSubmission, 'youtubeUrl'> { ... }
```

### Interface Segregation (I)
Keep interfaces focused and minimal. Split large interfaces when consumers only need subsets.

### Dependency Inversion (D)
High-level modules should not depend on low-level modules:
- `main.ts` imports services, not implementation details
- Services abstract external APIs behind clean interfaces

---

## Naming Conventions

### Files
- `camelCase.ts` for all TypeScript files
- Descriptive names: `urlParser.ts` not `parser.ts`

### Variables & Functions
- `camelCase` for variables and functions
- Prefix handlers with action: `handleVideoUpload`, `parseCallbackData`
- Prefix async functions that fetch data with `get`: `getYouTubeMetadata`
- Prefix creation functions with `create`: `createVideo`, `createStateKey`

### Constants
- `SCREAMING_SNAKE_CASE` for true constants: `MAX_RETRIES`, `CATEGORIES`
- Use `as const` for literal arrays

### Types & Interfaces
- `PascalCase` for types and interfaces
- Suffix with purpose: `VideoSubmission`, `MessageState`, `CloudinaryUploadResult`

---

## Error Handling (Detailed)

### Retry Logic
External API calls MUST implement retry logic:
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    // API call
  } catch (error) {
    if (attempt === MAX_RETRIES) return null;
    await sleep(RETRY_DELAY_MS * attempt);
  }
}
```

### User Feedback
All errors MUST provide user-friendly feedback:
```typescript
// ✅ Good
await ctx.reply("❌ Upload failed. Please try again.");

// ❌ Bad
throw new Error("Cloudinary upload failed");
```

### Logging
All errors MUST be logged with context:
```typescript
logger.error("Cloudinary upload error", {
  error: error instanceof Error ? error.message : String(error),
  fileId: video.file_id,
});
```

---

## Environment Variables

### Required Variables
All required environment variables MUST be validated at startup:
```typescript
const required = [
  "TELEGRAM_BOT_TOKEN",
  "SANITY_PROJECT_ID",
  "SANITY_DATASET",
  "SANITY_TOKEN",
];

const missing = required.filter((key) => !Deno.env.get(key));
if (missing.length > 0) throw new Error(`Missing: ${missing.join(", ")}`);
```

### Optional Variables
Optional features MUST gracefully degrade:
```typescript
function hasCloudinaryConfig(): boolean {
  return !!(
    Deno.env.get("CLOUDINARY_CLOUD_NAME") &&
    Deno.env.get("CLOUDINARY_API_KEY") &&
    Deno.env.get("CLOUDINARY_API_SECRET")
  );
}
```

### Security
- **NEVER** commit `.env` files
- **NEVER** log sensitive values (tokens, secrets)
- Use Deno Deploy environment variables for production

---

## Telegram Bot Patterns

### Message Handlers
Use Grammy's filter-based handlers:
```typescript
bot.on("message:text", async (ctx) => { ... });
bot.on("message:video", async (ctx) => { ... });
bot.on("callback_query:data", async (ctx) => { ... });
```

### State Management
Use Deno KV for persistent state with TTL:
```typescript
const STATE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
await kv.set(["video_state", key], state, { expireIn: STATE_TTL_MS });
```

### User Authorization
Validate user permissions before actions:
```typescript
if (state.userId !== ctx.from.id) {
  await ctx.answerCallbackQuery("❌ Only the original sender can select");
  return;
}
```

### Progress Feedback
Show users what's happening during long operations:
```typescript
const processingMsg = await ctx.reply("📤 *Uploading video...*", { parse_mode: "Markdown" });
// ... do work ...
await ctx.api.editMessageText(chatId, processingMsg.message_id, "✅ Done!");
```

---

## External API Integration

### Cloudinary
- Upload via URL for efficiency (Cloudinary fetches directly)
- Generate thumbnails using URL transformations
- Store `publicId` for future deletion/management

### Sanity
- Use mutations API for creates: `POST /data/mutate/{dataset}`
- Always generate slugs for SEO
- Store source tracking (`source: "telegram" | "url"`)

### YouTube
- Use Data API v3 for metadata
- Cache results when possible
- Handle quota limits gracefully

---

## Documentation Standards (Detailed)

### File Headers
Every file MUST have a descriptive header comment:
```typescript
/**
 * Cloudinary service for video uploads
 * Uploads videos from Telegram to Cloudinary for permanent storage
 */
```

### Function Documentation
Complex functions SHOULD have JSDoc comments:
```typescript
/**
 * Upload a video to Cloudinary from a URL
 * @param sourceUrl - The source URL to fetch video from
 * @param options - Upload options (folder, publicId)
 * @returns Upload result or null on failure
 */
```

### README
The README MUST include:
- Project overview
- Setup instructions
- Environment variable documentation
- Deployment steps

---

## Prohibited Practices

- ❌ Mock APIs, mock data, or stub implementations
- ❌ Hardcoded credentials or secrets
- ❌ `console.log` for logging (use `logger` utility)
- ❌ Synchronous file operations
- ❌ `any` type without explicit justification
- ❌ Nested callbacks (use async/await)
- ❌ Magic strings (use constants)
- ❌ Duplicate code (extract to utils/services)

---

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code improvements

### Commit Messages
Use conventional commits:
```
feat: add Telegram video upload to Cloudinary
fix: handle expired Telegram file URLs
refactor: extract URL parsing to utility module
```

### Pull Requests
- MUST pass `deno check` before merge
- MUST include description of changes
- MUST update documentation if public API changes

---

## Deployment

### Deno Deploy
- Automatic deployment from main branch
- Environment variables set in Deno Deploy dashboard
- Webhook URL: `https://<project>.deno.dev/webhook`

### Environment Parity
Development and production MUST use:
- Same Deno version
- Same dependency versions (via deno.lock)
- Real external services (no mocks)

---

## Development Workflow & Quality Gates

### Code Review Requirements
- All code changes MUST pass code review before merge
- Pull requests MUST include evidence of compliance with all principles
- All contributors MUST document rationale for any deviation from principles

### Quality Checks
- All code MUST pass `deno check` (type checking)
- All code MUST pass `deno lint` (linting)
- All code MUST follow the naming conventions defined in this constitution

### Logging Requirements
All applications MUST include proper logger configuration with appropriate log levels:
```typescript
// Use the logger utility - NOT console.log
import * as logger from "./utils/logger.ts";

logger.info("Operation successful", { details });
logger.warn("Potential issue", { context });
logger.error("Operation failed", { error: error.message });
```

### Prohibited Practices
- Mock APIs, mock data, stub implementations, and hardcoded fake data are strictly PROHIBITED
- All testing MUST use real APIs and real data sources
- No exceptions for development or staging environments

---

## Governance

This constitution supersedes all other practices and guidance. Amendments require:
1. Documentation of proposed change with rationale
2. Code review approval from project maintainers
3. Migration plan for existing code

### Enforcement
- All PRs and code reviews MUST verify compliance with this constitution
- Complexity MUST be justified with documented rationale
- Use runtime guidance files for development reference

### Amendment Process
Any changes to this constitution require:
1. Written proposal with clear rationale
2. Review period for stakeholder feedback
3. Approval from project maintainers
4. Updated documentation reflecting changes

**This constitution applies to all contributors and coding agents. No exceptions unless explicitly amended.**

---

**Version**: 2.0.0 | **Ratified**: 2026-01-10 | **Last Amended**: 2026-01-17
