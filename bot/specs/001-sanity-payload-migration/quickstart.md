# Quickstart: Sanity to PayloadCMS Migration

**Feature**: Sanity to PayloadCMS Migration  
**Branch**: `001-sanity-payload-migration`  
**Date**: January 18, 2026

## Overview

This guide provides step-by-step instructions for migrating video content from Sanity CMS to PayloadCMS with MongoDB Atlas backend. The migration preserves all existing data while transitioning to a self-hosted content management solution.

**Estimated Time**: 2-4 hours (depends on data volume)

---

## Prerequisites

Before starting the migration, ensure you have:

- [x] Access to Sanity CMS credentials (project ID, dataset, token)
- [x] MongoDB Atlas account (free M0 cluster is sufficient)
- [x] PayloadCMS Cloud account or self-hosting infrastructure
- [x] Deno runtime installed (https://deno.land/)
- [x] Access to update environment variables on Deno Deploy
- [x] Backup of current Sanity data (safety measure)

---

## Phase 1: Setup PayloadCMS Instance

### Step 1.1: Create MongoDB Atlas Cluster

1. **Sign up** at https://www.mongodb.com/cloud/atlas/register
2. **Create a free M0 cluster**:
   - Cloud Provider: AWS (or preferred)
   - Region: Choose closest to your users
   - Cluster Tier: M0 Sandbox (Free)
   - Cluster Name: `curatedreels-videos`
3. **Configure network access**:
   - Add IP: `0.0.0.0/0` (allow access from anywhere, required for PayloadCMS Cloud)
   - Or add specific IP ranges if self-hosting
4. **Create database user**:
   - Username: `payloaduser` (or preferred)
   - Password: Generate strong password (save securely)
   - Database User Privileges: `Read and write to any database`
5. **Get connection string**:
   - Click "Connect" → "Connect your application"
   - Copy connection string: `mongodb+srv://payloaduser:<password>@cluster.mongodb.net/curatedreels?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password

**Verification**: Test connection using MongoDB Compass or CLI

---

### Step 1.2: Deploy PayloadCMS

#### Option A: PayloadCMS Cloud (Recommended)

1. **Sign up** at https://payloadcms.com/cloud
2. **Create new project**:
   - Name: `CuratedReels Videos`
   - Template: Select "Blank"
3. **Configure database**:
   - Paste MongoDB Atlas connection string
   - Test connection
4. **Define `videos` collection**:
   - Navigate to Collections → Add Collection
   - Use schema from `/specs/001-sanity-payload-migration/contracts/payloadcms-videos-schema.json`
   - Configure fields as specified in data model
5. **Generate API key**:
   - Settings → API Keys → Generate New Key
   - Name: `telegram-bot`
   - Permissions: Create, Read, Update
   - Copy and save the API key securely
6. **Note the API URL**: `https://your-project.payloadcms.app`

**Verification**: Access admin panel and create a test video manually

---

#### Option B: Self-Hosted PayloadCMS

```bash
# 1. Clone PayloadCMS starter
git clone https://github.com/payloadcms/payload.git payload-cms
cd payload-cms

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env:
# DATABASE_URI=mongodb+srv://payloaduser:<password>@cluster.mongodb.net/curatedreels
# PAYLOAD_SECRET=your-secret-key-here

# 4. Create videos collection
# Edit src/collections/Videos.ts with schema from contracts/

# 5. Build and start
npm run build
npm run serve

# 6. Access admin panel at http://localhost:3000
```

**Verification**: Create API key in admin panel, test API with curl

---

## Phase 2: Run Migration Script

### Step 2.1: Verify Data Volume

First, determine how many videos exist in Sanity:

```bash
# Run count query
deno run --allow-net --allow-env --env \
  scripts/count-sanity-videos.ts
```

**Expected Output**: `Total videos in Sanity: XXX`

This helps estimate migration time (~100 records/minute).

---

### Step 2.2: Create Migration Script

The migration script (`scripts/migrate-sanity-to-payload.ts`) performs:
1. **Export** from Sanity via HTTP API
2. **Transform** data to match PayloadCMS schema
3. **Validate** all fields before import
4. **Import** to PayloadCMS REST API
5. **Verify** record counts and data integrity

**Script Features**:
- ✅ Paginated processing (handles any data volume)
- ✅ Retry logic with exponential backoff
- ✅ Progress tracking and logging
- ✅ Dry-run mode for testing
- ✅ Resume capability if interrupted
- ✅ Detailed error reporting

---

### Step 2.3: Configure Environment

```bash
# Add PayloadCMS credentials to .env
PAYLOAD_API_URL=https://your-project.payloadcms.app
PAYLOAD_API_KEY=your-api-key-here

# Sanity credentials (already present)
SANITY_PROJECT_ID=3rcl6ir9
SANITY_DATASET=production
SANITY_TOKEN=skUKMd8y0R9lmRq...

# Optional: Migration settings
MIGRATION_BATCH_SIZE=100  # Records per batch
MIGRATION_DRY_RUN=false   # Set to true for testing
```

---

### Step 2.4: Execute Migration

```bash
# 1. Test with dry-run mode first
MIGRATION_DRY_RUN=true deno run --allow-net --allow-env --env \
  scripts/migrate-sanity-to-payload.ts

# Review dry-run output, ensure no errors

# 2. Run actual migration
deno run --allow-net --allow-env --env \
  scripts/migrate-sanity-to-payload.ts

# Monitor progress:
# [2026-01-18 14:30:00] Starting migration...
# [2026-01-18 14:30:05] Exporting batch 1/10 (100 records)...
# [2026-01-18 14:31:20] Importing batch 1/10...
# [2026-01-18 14:32:15] Batch 1/10 complete: 100 success, 0 failed
# ...
# [2026-01-18 14:45:00] Migration complete!
# Total: 1000 records, Success: 1000, Failed: 0
```

**Expected Duration**:
- < 1,000 records: 10-15 minutes
- 1,000-10,000 records: 1-2 hours
- > 10,000 records: 2-5 hours

**If Migration Fails**:
- Script saves progress checkpoint
- Resume by re-running (automatically skips completed batches)
- Check logs in `migration-logs/` directory
- Common issues: API rate limits (add delays), network timeouts (retry logic handles this)

---

## Phase 3: Verification

### Step 3.1: Automated Verification

Run verification script to compare data:

```bash
deno run --allow-net --allow-env --env \
  scripts/verify-migration.ts
```

**Checks Performed**:
1. ✅ Record count matches (Sanity vs PayloadCMS)
2. ✅ Random sampling of 100 records for field-by-field comparison
3. ✅ All required fields populated
4. ✅ No duplicate slugs
5. ✅ Enum values valid (category, ageRange, source)

**Expected Output**:
```
✅ Record count: 1000 (Sanity) = 1000 (PayloadCMS)
✅ Sample verification: 100/100 records match
✅ Required fields: All populated
✅ Unique slugs: Verified
✅ Enum validation: All valid

Migration verification: PASSED
```

**If Verification Fails**:
- Review discrepancy report in `verification-report.json`
- Common issues: Slug collisions (script handles with counter), invalid enum values (needs data cleanup)

---

### Step 3.2: Manual Spot Checks

1. **Access PayloadCMS admin panel**: https://your-project.payloadcms.app/admin
2. **Browse videos**: Check categories, age ranges
3. **Search functionality**: Test title/tag search
4. **Test specific records**:
   - Find a video you know from Sanity
   - Verify all fields match
   - Check URLs are valid

---

## Phase 4: Update Bot Configuration

### Step 4.1: Update Environment Variables

**On Deno Deploy**:
1. Navigate to project settings
2. Update environment variables:
   ```
   PAYLOAD_API_URL=https://your-project.payloadcms.app
   PAYLOAD_API_KEY=your-api-key-here
   ```
3. Keep Sanity credentials for now (rollback safety)

**Testing**:
```bash
# Test bot locally with new configuration
deno task dev

# Submit a test video
# Verify it appears in PayloadCMS
```

---

### Step 4.2: Deploy and Monitor

1. **Deploy updated configuration** to production
2. **Monitor bot logs** for 30 minutes:
   - Check for PayloadCMS API errors
   - Verify video submissions succeed
   - Monitor response times
3. **Test all bot features**:
   - YouTube URL submission
   - Direct video upload
   - Category selection
   - Video distribution to Telegram groups

**Success Criteria**:
- ✅ No errors in logs
- ✅ Videos saved to PayloadCMS
- ✅ Response times < 5 seconds
- ✅ Telegram group distribution works

---

## Phase 5: Decommission Sanity

### Step 5.1: Verification Period (72 Hours)

**Wait 72 hours** after successful deployment to ensure:
- No hidden issues emerge
- All bot features work correctly
- Historical data is accessible
- No data corruption occurred

**During verification period**:
- Monitor error rates
- Check daily video submission counts
- Review user reports (if any)
- Keep Sanity credentials active (rollback option)

---

### Step 5.2: Remove Sanity Credentials

After 72-hour verification:

1. **Backup Sanity export** (final safety measure):
   ```bash
   deno run --allow-net --allow-env --env \
     scripts/export-sanity-backup.ts > sanity-backup-final.json
   ```

2. **Remove Sanity environment variables**:
   ```bash
   # On Deno Deploy, delete:
   SANITY_PROJECT_ID
   SANITY_DATASET
   SANITY_TOKEN
   ```

3. **Remove Sanity from .env.example**:
   ```bash
   # Delete Sanity section from .env.example
   git commit -m "Remove Sanity configuration"
   ```

4. **Document migration completion**:
   - Update README.md (remove Sanity references)
   - Archive migration scripts to `archive/` directory
   - Update documentation with PayloadCMS setup

---

## Rollback Procedure

**If critical issues arise**, rollback immediately:

### Quick Rollback (< 5 minutes)

1. **Restore Sanity credentials** on Deno Deploy
2. **Add environment flag**:
   ```
   USE_SANITY_CMS=true
   ```
3. **Deploy** updated configuration
4. **Verify** bot uses Sanity again
5. **Investigate** PayloadCMS issue offline

### Full Rollback (If data loss detected)

1. **Restore from Sanity backup**:
   ```bash
   deno run --allow-net --allow-env --env \
     scripts/import-sanity-backup.ts < sanity-backup-final.json
   ```
2. **Pause bot** temporarily
3. **Investigate** and fix issues
4. **Re-run migration** with fixes

---

## Troubleshooting

### Migration Script Errors

**Issue**: `Sanity API rate limit exceeded`
**Solution**: Add delay between batches, reduce batch size to 50

**Issue**: `PayloadCMS API 401 Unauthorized`
**Solution**: Verify API key is correct, check Authorization header format

**Issue**: `MongoDB connection timeout`
**Solution**: Check network access whitelist in Atlas, verify connection string

---

### Verification Failures

**Issue**: Record count mismatch
**Solution**: Check for duplicate slugs, review migration logs for skipped records

**Issue**: Field values differ
**Solution**: Review data transformation logic, check for enum case mismatches

---

### Bot Runtime Errors

**Issue**: `PAYLOAD_API_URL not defined`
**Solution**: Ensure environment variables deployed to Deno Deploy

**Issue**: PayloadCMS API slow (> 5s responses)
**Solution**: Check MongoDB Atlas cluster performance, consider upgrading tier

---

## Success Metrics

After migration completion, verify:

- ✅ **Data Integrity**: 100% of records migrated successfully
- ✅ **Zero Downtime**: Bot never stopped serving users
- ✅ **Performance**: Response times within 10% of pre-migration
- ✅ **Functionality**: All bot features work correctly
- ✅ **Verification**: 72-hour monitoring period passed
- ✅ **Cleanup**: Sanity credentials removed
- ✅ **Documentation**: Migration documented for future reference

---

## Post-Migration Tasks

1. **MongoDB Backups**: Configure automated backups in Atlas (consider paid tier for automated backups)
2. **Monitoring**: Set up alerts for PayloadCMS API errors
3. **Documentation**: Update developer onboarding docs
4. **Archive**: Move migration scripts to `archive/migration-2026-01/`
5. **Celebrate**: Migration complete! 🎉

---

## Related Documents

- **Data Model**: [data-model.md](./data-model.md)
- **API Schema**: [contracts/payloadcms-videos-schema.json](./contracts/payloadcms-videos-schema.json)
- **Research**: [research.md](./research.md)
- **Implementation Plan**: [plan.md](./plan.md)

---

## Support

**Questions or issues during migration?**
- Review logs in `migration-logs/`
- Check [PayloadCMS documentation](https://payloadcms.com/docs)
- Verify MongoDB Atlas connectivity
- Test API endpoints with curl/Postman

---

**Version**: 1.0  
**Last Updated**: January 18, 2026  
**Estimated Total Time**: 2-4 hours + 72-hour verification
