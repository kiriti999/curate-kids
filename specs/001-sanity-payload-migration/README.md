# Feature Specification: Sanity to PayloadCMS Migration

**Feature ID**: 001  
**Status**: Planning Complete (Phase 1) ✅  
**Branch**: `001-sanity-payload-migration`  
**Created**: 2025-01-19

---

## Quick Links

- **[Feature Specification](./spec.md)** - Full feature requirements and user stories
- **[Implementation Plan](./plan.md)** - Technical context, constitution check, and project structure
- **[Research Document](./research.md)** - Phase 0 research with technical decisions
- **[Data Model](./data-model.md)** - PayloadCMS collection schemas for all 6 document types
- **[API Contracts](./contracts/)** - OpenAPI 3.1.0 specifications (JSON format)
- **[QuickStart Guide](./quickstart.md)** - Developer setup guide (2-3 hour implementation)

---

## Feature Summary

Migrate CurateKids application from Sanity CMS to PayloadCMS (latest 3.x) for content management, data storage, and admin interface. This involves:

1. Setting up PayloadCMS with MongoDB Atlas
2. Migrating six document types (video, category, user, activityLog, adPlacement, affiliatePartner) with all relationships and validations
3. Updating the Next.js frontend to use PayloadCMS REST API instead of Sanity GROQ queries
4. Updating admin scripts
5. Removing all Sanity dependencies

---

## Planning Status

| Phase | Status | Output Files | Notes |
|-------|--------|--------------|-------|
| **Phase 0: Research** | ✅ Complete | `research.md` | 8 research areas resolved, key architectural decisions made |
| **Phase 1: Design** | ✅ Complete | `data-model.md`, `contracts/`, `quickstart.md` | Complete schema, API specs, developer guide |
| **Phase 2: Tasks** | ⏭️ Not Started | `tasks.md` | Use `/speckit.tasks` command (separate workflow) |

---

## Key Decisions

### Architecture
- **CMS**: PayloadCMS 3.x with TypeScript support
- **Database**: MongoDB Atlas (M10+ tier recommended)
- **Runtime**: Node.js 18+ (Express server for PayloadCMS)
- **Frontend**: Next.js 16.1.1 (unchanged, update API client only)

### Migration Strategy
- **Approach**: ETL (Extract → Transform → Load) with three-step migration scripts
- **Data Integrity**: Idempotent migration with checkpoint system, dry-run mode
- **Zero Downtime**: Phased rollout with feature flags (1% → 10% → 50% → 100%)
- **ID Preservation**: Store original Sanity `_id` in `sanityId` field for reference tracking

### Data Model Highlights
- **6 Collections**: Video, Category, User, ActivityLog, AdPlacement, AffiliatePartner
- **Hierarchical Categories**: Up to 10 levels deep with auto-calculated fields (depth, fullPath, childCount, videoCount)
- **Auto-Calculated Fields**: Implemented via PayloadCMS hooks (beforeValidate, afterChange)
- **Read-Only Collection**: ActivityLog (immutable audit trail)

---

## Constitution Compliance

### ✅ Passed Gates
- Code Quality & SOLID Principles ✅
- Code Maintainability Standards ✅
- Error Handling Standards ✅
- Documentation Standards ✅
- Real Data & API Standards ✅

### ⚠️ Critical Issue
**Deno vs Node.js Runtime Discrepancy**

- **Problem**: Constitution mandates "Deno latest LTS version" but PayloadCMS requires Node.js
- **Current Reality**: Entire codebase is Node.js-based (Next.js frontend, npm packages)
- **Recommendation**: Update constitution to reflect Node.js/Next.js stack (documentation fix)
- **Blocking**: Requires stakeholder approval before proceeding to implementation

**Resolution Options**:
1. **Option 1** (RECOMMENDED): Update constitution to Node.js ✅ Minimal impact
2. **Option 2**: Find Deno-compatible CMS ❌ High impact, requires re-scoping
3. **Option 3**: Defer feature ❌ High impact, blocks migration

---

## Implementation Readiness

| Criteria | Status | Details |
|----------|--------|---------|
| Technical Design | ✅ Complete | Data model, API contracts, migration strategy defined |
| Research | ✅ Complete | All unknowns resolved, architectural decisions documented |
| Constitution Check | ⚠️ Conditional | Passes all gates except Deno/Node.js discrepancy |
| Documentation | ✅ Complete | HLD, API specs (JSON), quickstart guide delivered |
| Next Steps | 🚦 Blocked | Awaiting stakeholder decision on Deno/Node.js resolution |

---

## File Structure

```
specs/001-sanity-payload-migration/
├── README.md               # This file (overview)
├── spec.md                 # Feature specification (31.5 KB)
├── plan.md                 # Implementation plan
├── research.md             # Phase 0 research findings
├── data-model.md           # PayloadCMS collection schemas
├── quickstart.md           # Developer setup guide (2-3 hour implementation)
└── contracts/              # API contracts (OpenAPI 3.1.0 JSON)
    ├── video-api.json      # Video CRUD endpoints
    └── category-api.json   # Category hierarchy endpoints
```

---

## Next Steps

1. **Immediate**: Resolve Deno/Node.js discrepancy with project stakeholder
2. **If Approved (Option 1)**: Update constitution, run `/speckit.tasks` to generate `tasks.md`
3. **Implementation**: Follow `quickstart.md` to set up PayloadCMS and run migration
4. **Testing**: Verify data integrity, frontend integration, admin scripts
5. **Deployment**: Phased rollout to production (1% → 100%)
6. **Cleanup**: Remove Sanity dependencies after 30-day validation period

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| PayloadCMS Setup | 2-3 hours | MongoDB Atlas cluster ready |
| Data Migration | 1-2 hours | PayloadCMS setup complete |
| Frontend Integration | 1-2 hours | Migration verified |
| Admin Scripts Update | 2-3 hours | Frontend integration complete |
| Testing & Validation | 1 week | All implementation complete |
| Production Rollout | 1-2 weeks | Gradual (1% → 100%) |
| Sanity Cleanup | 1 hour | 30-day validation period |

**Total Estimated Time**: 2-3 weeks (including validation periods)

---

## Support & Contacts

- **Feature Owner**: [To be assigned]
- **Technical Lead**: [To be assigned]
- **Constitution**: `.specify/memory/constitution.md`
- **PayloadCMS Docs**: https://payloadcms.com/docs
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/

---

**Last Updated**: 2025-01-19  
**Plan Version**: 1.0  
**Next Command**: `/speckit.tasks` (after runtime resolution)
