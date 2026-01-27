# Implementation Plan: Sanity CMS to PayloadCMS Migration

**Branch**: `001-sanity-payload-migration` | **Date**: January 18, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sanity-payload-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate all existing video content and metadata from Sanity CMS to PayloadCMS with MongoDB Atlas backend. The bot codebase already implements PayloadCMS service layer but currently has Sanity credentials configured. This migration involves: (1) Setting up PayloadCMS instance with MongoDB Atlas, (2) Creating a data migration script to transfer all videos from Sanity to PayloadCMS, (3) Verifying 100% data integrity, (4) Testing the application with the new system, and (5) Removing Sanity credentials and dependencies after successful verification.

## Technical Context

**Language/Version**: TypeScript with Deno runtime (latest stable)  
**Primary Dependencies**: grammy@1.30.0 (Telegram bot framework), Deno built-in fetch/crypto  
**Storage**: MongoDB Atlas (cloud-hosted) via PayloadCMS REST API  
**Testing**: Deno built-in test runner (`deno test`)  
**Target Platform**: Deno Deploy (serverless) + PayloadCMS Cloud  
**Project Type**: Single project (Telegram bot service)  
**Performance Goals**: <2s response for category selection, <5s for video submission with retry  
**Constraints**: 
- Zero downtime during migration (bot continues operating)
- 100% data integrity requirement for all migrated records
- Reversible migration if critical issues found
- Must work within Deno Deploy free tier limits
**Scale/Scope**: 
- Unknown number of existing videos in Sanity (NEEDS CLARIFICATION)
- 5 age-based Telegram groups
- 8 video categories
- Supports YouTube URLs + direct Telegram uploads
- PayloadCMS already implemented in code but not deployed (NEEDS CLARIFICATION)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: The project constitution template is not yet filled in. This is a template project without specific architectural principles defined.

**Default Gates Applied**:

✅ **Simplicity**: Migration adds a single-purpose utility script (data migration) which will be removed after use. No permanent architectural complexity added since PayloadCMS integration already exists.

✅ **Data Integrity**: 100% verification requirement ensures no data loss, aligning with production system standards.

✅ **Reversibility**: Plan explicitly requires ability to rollback if issues found, supporting safe production changes.

⚠️ **Testing Strategy**: Migration script needs comprehensive testing. Constitution template shows TDD preference but no specific testing gates defined yet. Will apply standard testing practices: unit tests for data transformation, integration tests for API interactions, end-to-end verification of migrated data.

**No violations requiring justification**. Migration is a temporary operational task with existing architecture.

## Project Structure

### Documentation (this feature)

```text
specs/001-sanity-payload-migration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── payloadcms-videos-schema.json  # PayloadCMS collection schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single project structure (Deno/TypeScript Telegram bot)
src/
├── config/
│   └── ageRangeGroups.ts       # Age range to chat ID mapping
├── handlers/
│   ├── callbackQuery.ts        # Category selection handler
│   ├── constants.ts            # Message constants
│   ├── index.ts                # Handler exports
│   ├── textMessage.ts          # URL submission handler
│   └── videoUpload.ts          # Direct video upload handler
├── services/
│   ├── cloudinary.ts           # Video upload service (existing)
│   ├── payload.ts              # PayloadCMS API client (existing)
│   └── youtube.ts              # YouTube metadata service (existing)
├── types/
│   └── state.ts                # Message state types
├── utils/
│   ├── keyboard.ts             # Inline keyboard builder
│   └── logger.ts               # Logging utilities
└── main.ts                     # Bot entry point (webhook)

# New migration utilities (temporary, removed after migration)
scripts/
└── migrate-sanity-to-payload.ts  # Data migration script (NEW)

# Tests
tests/
├── integration/
│   ├── payload_api_test.ts           # PayloadCMS API integration (existing)
│   └── migration_verification_test.ts # Migration verification (NEW)
└── unit/
    └── migration_transform_test.ts    # Data transformation logic (NEW)
```

**Structure Decision**: Single project structure maintained. Migration script is temporary and will be removed after successful migration. Existing PayloadCMS service (`src/services/payload.ts`) already implements all required functionality for the bot to operate with PayloadCMS. Migration focuses on data transfer and verification, not architectural changes.

## Complexity Tracking

> **No violations identified**. Migration is implemented as a temporary script without permanent architectural changes. The PayloadCMS service layer already exists in the codebase.

## Implementation Notes

### Phase 0: Research Completed ✅

All technical unknowns have been researched and documented in [research.md](./research.md):
- **Sanity Export**: Use HTTP API with GROQ queries for data extraction
- **PayloadCMS Deployment**: Deploy to PayloadCMS Cloud with MongoDB Atlas M0 (free tier)
- **Data Volume**: Requires user input to determine actual record count (affects migration strategy)
- **Rollback Strategy**: Environment flag approach for instant rollback capability

**Key Decision**: Implement paginated migration with progress tracking regardless of data volume, providing resume capability and verification checkpoints.

---

### Phase 1: Design Completed ✅

All design artifacts have been created:

1. **Data Model** ([data-model.md](./data-model.md)):
   - Complete Video entity definition with 18 fields
   - Supporting enumerations: Category (8 values), AgeRange (5 values), Source (2 values)
   - Cross-field validation rules for URL vs Telegram sources
   - Migration mapping from Sanity to PayloadCMS schema
   - MongoDB index recommendations

2. **API Schema** ([contracts/payloadcms-videos-schema.json](./contracts/payloadcms-videos-schema.json)):
   - JSON Schema with full validation rules
   - Conditional requirements based on source type
   - PayloadCMS configuration metadata
   - API endpoint documentation
   - Example documents for both source types

3. **Migration Guide** ([quickstart.md](./quickstart.md)):
   - 5-phase migration process (Setup → Migrate → Verify → Deploy → Cleanup)
   - Step-by-step instructions for MongoDB Atlas and PayloadCMS setup
   - Migration script execution with monitoring
   - Verification procedures (automated + manual)
   - Rollback procedure for emergency situations
   - Troubleshooting guide

4. **Agent Context Updated**:
   - GitHub Copilot context file updated with TypeScript/Deno stack
   - Added grammy framework and MongoDB Atlas database info
   - Context available for future development assistance

---

### Constitution Re-Check: ✅ PASSED

**Post-Design Review**:

✅ **Simplicity Maintained**: 
- Migration implemented as temporary scripts in `scripts/` directory
- No permanent architectural changes to bot codebase
- PayloadCMS service layer already exists, fully functional
- Cleanup phase removes all migration-specific code

✅ **Data Integrity Preserved**:
- Automated verification script checks 100% data match
- Random sampling validates field accuracy
- Migration logs provide audit trail
- Backup procedure documented before migration

✅ **Reversibility Confirmed**:
- Environment flag enables instant rollback
- Sanity credentials preserved during verification period
- 72-hour monitoring window before decommissioning
- Backup export created before final cleanup

✅ **Testing Approach Defined**:
- Dry-run mode for migration script testing
- Unit tests for data transformation logic
- Integration tests for API interactions
- End-to-end verification after migration
- Manual spot-checking procedures documented

**Final Verdict**: No architectural concerns. Migration follows best practices for data migration projects.

---

## Next Steps

**Phase 2: Task Generation** (Use `/speckit.tasks` command)

The implementation plan is complete and ready for task breakdown. Expected tasks:

1. **PayloadCMS Setup** (P1)
   - Create MongoDB Atlas cluster
   - Deploy PayloadCMS instance
   - Configure videos collection
   - Generate API key

2. **Migration Scripts** (P1)
   - Create `scripts/migrate-sanity-to-payload.ts`
   - Create `scripts/verify-migration.ts`
   - Create `scripts/count-sanity-videos.ts`
   - Create `scripts/export-sanity-backup.ts`

3. **Testing** (P1)
   - Unit tests for data transformation
   - Integration tests for API clients
   - Migration dry-run testing

4. **Deployment & Verification** (P1)
   - Execute migration
   - Run verification suite
   - Update bot environment variables
   - Monitor production for 72 hours

5. **Cleanup** (P2)
   - Remove Sanity credentials
   - Archive migration scripts
   - Update documentation

6. **Documentation Updates** (P2)
   - Update README.md
   - Remove Sanity references
   - Document PayloadCMS setup for new developers

---

## Open Questions for User

Before proceeding to task generation, please provide:

1. **Data Volume**: How many video records currently exist in Sanity?
   - This determines migration duration estimate
   - Can be checked with query: `count(*[_type == "video"])`

2. **PayloadCMS Status**: Is PayloadCMS already deployed and configured?
   - If yes: Provide API URL and we can proceed directly to migration
   - If no: Include deployment tasks in implementation

3. **Timeline**: Is there a preferred date/time for the migration cutover?
   - Helps with scheduling and communication

4. **Staging Environment**: Is there a test environment available for migration testing?
   - Recommended for dry-run validation before production

---

**Planning Status**: ✅ COMPLETE  
**Ready for Task Generation**: ✅ YES  
**Next Command**: `/speckit.tasks` or `speckit.tasks` agent

---

**Plan Version**: 1.0  
**Completed**: January 18, 2026  
**Total Planning Time**: ~45 minutes
