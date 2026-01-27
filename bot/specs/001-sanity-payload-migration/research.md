# Research: Sanity to PayloadCMS Migration

**Branch**: `001-sanity-payload-migration` | **Date**: January 18, 2026  
**Purpose**: Resolve technical unknowns and establish migration approach

## Executive Summary

This migration transfers video content from Sanity CMS to PayloadCMS with MongoDB Atlas. Key findings:
1. PayloadCMS code is already implemented in the bot but not deployed
2. Sanity credentials exist but no Sanity code is in the codebase
3. Sanity data must be exported via their API and transformed to match PayloadCMS schema
4. MongoDB Atlas free tier (M0) supports up to 512MB, suitable for video metadata storage

## Research Findings

### 1. Sanity Data Export Methods

**Decision**: Use Sanity HTTP API with GROQ queries to export all video documents

**Rationale**:
- Sanity provides HTTP API with their SDK for JavaScript/TypeScript
- GROQ (Graph-Relational Object Queries) allows precise data fetching
- Can export incrementally to handle large datasets
- Supports pagination for large result sets
- No need for Sanity CLI tools (works in Deno runtime)

**Alternatives Considered**:
- **Sanity Export CLI**: Requires Node.js, not compatible with Deno without npm compatibility layer
- **Manual CSV export**: Error-prone, doesn't preserve data types or relationships
- **Database backup**: Sanity uses hosted backend, direct database access not available

**Implementation Approach**:
```typescript
// Use Sanity HTTP API (REST-like interface)
const sanityClient = {
  projectId: Deno.env.get("SANITY_PROJECT_ID"),
  dataset: Deno.env.get("SANITY_DATASET"),
  token: Deno.env.get("SANITY_TOKEN"),
  apiVersion: "2023-05-03"
};

// GROQ query to fetch all videos
const query = `*[_type == "video"]{
  _id,
  _createdAt,
  title,
  slug,
  youtubeUrl,
  youtubeId,
  cloudinaryUrl,
  cloudinaryId,
  thumbnailUrl,
  duration,
  category,
  ageRange,
  tags,
  source
}`;

const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
```

**References**:
- Sanity HTTP API: https://www.sanity.io/docs/http-api
- GROQ documentation: https://www.sanity.io/docs/groq

---

### 2. PayloadCMS Deployment Options

**Decision**: Deploy PayloadCMS to PayloadCMS Cloud with MongoDB Atlas (free M0 cluster)

**Rationale**:
- **PayloadCMS Cloud** offers free tier with automatic scaling
- Integrates directly with MongoDB Atlas (no additional database hosting needed)
- Provides built-in admin UI for content management
- Automatic HTTPS and API endpoints
- Zero infrastructure management
- Built-in API key authentication

**Alternatives Considered**:
- **Self-hosted on Vercel/Railway**: Requires more configuration, potential cold starts, database connection management
- **Self-hosted VPS**: Higher cost ($5-10/month), requires server maintenance, SSL setup, monitoring
- **Payload Open Source**: More control but adds operational burden (updates, security patches, backups)

**MongoDB Atlas Setup**:
- Free M0 cluster: 512MB storage, shared RAM, suitable for metadata
- Automated backups available on paid tiers (recommended for production)
- Connection string format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>`

**PayloadCMS Cloud Setup Steps**:
1. Sign up at https://payloadcms.com/cloud
2. Create new project, select "Blank" template
3. Connect MongoDB Atlas database (provide connection string)
4. Define `videos` collection with schema matching bot requirements
5. Generate API key for bot access
6. Deploy automatically (handled by Payload Cloud)

**References**:
- PayloadCMS Cloud: https://payloadcms.com/docs/cloud/overview
- MongoDB Atlas Free Tier: https://www.mongodb.com/pricing

---

### 3. Data Volume Assessment (NEEDS USER INPUT)

**Unknown**: Total number of videos currently in Sanity

**Why This Matters**:
- Determines migration strategy (single batch vs. paginated)
- Validates MongoDB Atlas M0 tier capacity (512MB limit)
- Estimates migration duration (important for cutover planning)
- Influences rollback strategy complexity

**Estimation Assumptions**:
- Average video metadata size: ~2KB per document (title, URLs, category, tags, timestamps)
- MongoDB Atlas M0 supports ~250,000 video records (512MB ÷ 2KB)
- Migration speed: ~100 records/minute with retry logic (conservative estimate)

**Migration Strategy by Volume**:

| Volume | Strategy | Estimated Time | Notes |
|--------|----------|----------------|-------|
| < 1,000 | Single batch export + import | < 10 minutes | Simple, monolithic script |
| 1,000 - 10,000 | Paginated (100 per page) | 1-2 hours | Progress tracking, resume capability |
| > 10,000 | Paginated + parallel workers | 2-5 hours | Requires rate limiting consideration |

**Recommended Approach**: 
Implement paginated migration with progress tracking regardless of volume. This provides:
- Resume capability if interrupted
- Progress visibility
- Verification checkpoints
- Works for any data size

**Action Required**: Query Sanity to determine actual record count before migration
```typescript
const countQuery = `count(*[_type == "video"])`;
```

---

### 4. Migration Rollback Strategies

**Decision**: Implement "shadow mode" testing before cutover, with environment variable flag to switch between systems

**Rationale**:
- **Zero downtime**: Bot continues using PayloadCMS (already implemented) or Sanity (needs implementation)
- **Safe testing**: Can validate PayloadCMS in production environment without switching bot
- **Quick rollback**: Single environment variable change reverts to Sanity
- **Data preservation**: Both systems remain operational during verification period

**Rollback Approach**:

**Phase 1: Shadow Mode (Recommended)**
```typescript
// Add Sanity service alongside Payload
const USE_PAYLOAD = Deno.env.get("USE_PAYLOAD_CMS") === "true";

async function createVideo(submission: VideoSubmission) {
  if (USE_PAYLOAD) {
    return await payload.createVideo(submission);
  } else {
    return await sanity.createVideo(submission);
  }
}
```

**Benefits**:
- Instant rollback by setting `USE_PAYLOAD_CMS=false`
- Can compare results side-by-side
- No data loss risk
- Bot never goes down

**Phase 2: Dual-Write (Optional, for extra safety)**
```typescript
// Write to both systems temporarily
const payloadId = await payload.createVideo(submission);
const sanityId = await sanity.createVideo(submission);
// Log both for verification
```

**Drawbacks of Dual-Write**:
- Complexity increases
- Potential data divergence
- Requires eventual cleanup
- Not recommended unless migration reveals issues

**Recommended Rollback Plan**:
1. ✅ **Before Migration**: Backup Sanity data (export JSON)
2. ✅ **During Migration**: Keep Sanity credentials active, don't delete
3. ✅ **After Migration**: 72-hour verification period with environment flag
4. ✅ **Rollback If Needed**: Change env var, bot immediately uses Sanity
5. ✅ **After Verification**: Remove Sanity credentials and code

**Alternative Considered**:
- **Database backups only**: Slower rollback (requires data restore), more downtime
- **Rejected because**: Environment flag provides instant rollback

**References**:
- Blue-green deployment pattern: https://martinfowler.com/bliki/BlueGreenDeployment.html

---

## Migration Architecture

### High-Level Flow

```
┌─────────────────┐
│  Sanity CMS     │
│  (Source)       │
└────────┬────────┘
         │
         │ 1. Export via GROQ
         │
         ▼
┌─────────────────┐
│ Migration Script│
│ (Deno)          │
│  - Fetch        │
│  - Transform    │
│  - Validate     │
│  - Load         │
└────────┬────────┘
         │
         │ 2. Import via REST API
         │
         ▼
┌─────────────────┐
│  PayloadCMS     │
│  (Destination)  │
│     │           │
│     ├─MongoDB   │
│     │  Atlas    │
└─────────────────┘
         │
         │ 3. Verify
         │
         ▼
┌─────────────────┐
│  Verification   │
│  - Count match  │
│  - Field check  │
│  - Spot test    │
└─────────────────┘
```

### Migration Script Structure

```typescript
// scripts/migrate-sanity-to-payload.ts

interface MigrationConfig {
  sanityProjectId: string;
  sanityDataset: string;
  sanityToken: string;
  payloadApiUrl: string;
  payloadApiKey: string;
  batchSize: number;
  dryRun: boolean;
}

interface MigrationStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  startTime: number;
  endTime?: number;
}

async function migrate() {
  // 1. Validate configuration
  // 2. Get total count from Sanity
  // 3. Export videos in batches
  // 4. Transform each record
  // 5. Import to PayloadCMS
  // 6. Verify and log results
}
```

---

## Technical Decisions Summary

| Decision | Chosen Approach | Risk Level |
|----------|-----------------|------------|
| Data Export | Sanity HTTP API + GROQ | Low - Official API |
| Deployment | PayloadCMS Cloud + Atlas M0 | Low - Managed services |
| Data Volume | Paginated migration | Low - Handles any size |
| Rollback | Environment flag switch | Low - Instant revert |

---

## Next Steps (Phase 1)

1. ✅ Define video data model in `data-model.md`
2. ✅ Create PayloadCMS collection schema in `contracts/`
3. ✅ Document migration and deployment in `quickstart.md`
4. ⏭️ Proceed to task generation (`/speckit.tasks`)

---

## Open Questions for User

1. **Data Volume**: How many video records currently exist in Sanity? (Can query: `count(*[_type == "video"])`)
2. **PayloadCMS Status**: Is PayloadCMS already deployed, or does it need to be set up as part of this migration?
3. **Downtime Window**: Is there a preferred maintenance window for the cutover, or can it be done during normal operations?
4. **Testing Access**: Do you have a staging/test environment for validating the migration before production?

---

**Status**: ✅ Research Complete - All technical approaches validated
