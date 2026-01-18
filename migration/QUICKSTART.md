# 🚀 Migration Quick Start Guide

## Current Status

✅ **All migration scripts are implemented and ready to execute**

⚠️ **Blocked**: Migration cannot proceed without a valid Sanity API token

## Prerequisites Checklist

Before running the migration, ensure:

- [X] MongoDB is configured (connection string in `.env`)
- [X] PayloadCMS collections are defined and validated
- [X] Migration scripts are implemented
- [ ] **Valid Sanity API token is configured** ⚠️ REQUIRED

## Step 1: Configure Sanity API Token

### Get Your Token

1. Go to: https://www.sanity.io/manage
2. Select your project: `curatekids` (Project ID: `3rcl6ir9`)
3. Navigate to: **API** → **Tokens**
4. Create a new token or use existing one
5. Copy the token value

### Update .env File

Open `/Users/arjun/curatekids/.env` and replace:

```bash
SANITY_TOKEN=your-sanity-api-token
```

With your actual token:

```bash
SANITY_TOKEN=sk...your...actual...token...here
```

**Important**: 
- Token must have **read** permissions
- Token must have access to the `production` dataset
- Keep the token secret (never commit to Git)

## Step 2: Test Export

Once the token is configured, test the export:

```bash
npm run migrate:export
```

**Expected Output:**
```
=== EXPORT SUMMARY ===
Exported at: 2026-01-17T...
Total documents: XXX

Documents by collection:
  video: XX
  category: XX
  user: XX
  activityLog: XX
  adPlacement: XX
  affiliatePartner: XX

Duration: X.XXs
Output directory: /Users/arjun/curatekids/migration/exported-data
======================
```

**If You See Errors:**
- "Unauthorized - Session not found" → Token is invalid or missing
- "Project not found" → Check SANITY_PROJECT_ID in `.env`
- "Dataset not found" → Check SANITY_DATASET in `.env`

## Step 3: Review Exported Data

After successful export, review the data:

```bash
# Check export summary
cat migration/exported-data/export-summary.json

# Review sample video
cat migration/exported-data/videos.json | head -50

# Check all files
ls -lh migration/exported-data/
```

## Step 4: Transform Data

Transform the exported Sanity data to PayloadCMS format:

```bash
npm run migrate:transform
```

**Expected Output:**
```
=== TRANSFORMATION SUMMARY ===
Transformed at: 2026-01-17T...
Total documents: XXX

Documents by collection:
  video: XX
  category: XX
  user: XX
  activityLog: XX
  adPlacement: XX
  affiliatePartner: XX

Total validation errors: 0
Duration: X.XXs
==============================
```

**Check for Validation Errors:**
- Review any warnings in the output
- Check `migration/exported-data/transform-summary.json`
- Fix data issues in Sanity if needed

## Step 5: Dry-Run Import

Test the import without writing to database:

```bash
npm run migrate:import:dry-run
```

**Expected Output:**
```
🔍 Running in DRY RUN mode - no data will be written to database

=== IMPORT SUMMARY (DRY RUN) ===
Started at: 2026-01-17T...
Total attempted: XXX
Total successful: XXX
Total failed: 0

Documents by collection:
  user: XX/XX
  category: XX/XX
  affiliatePartner: XX/XX
  video: XX/XX
  adPlacement: XX/XX
  activityLog: XX/XX

Duration: X.XXs
==============================
```

**If You See Failures:**
- Review the import report: `migration/exported-data/import-report-dry-run-*.json`
- Fix validation issues in transformed data
- Re-run dry-run until all documents pass

## Step 6: Real Import

⚠️ **Point of No Return**: This will write data to MongoDB

```bash
npm run migrate:import
```

**Expected Output:**
```
=== IMPORT SUMMARY ===
Started at: 2026-01-17T...
Completed at: 2026-01-17T...
Total attempted: XXX
Total successful: XXX
Total failed: 0

Documents by collection:
  user: XX/XX
  category: XX/XX
  affiliatePartner: XX/XX
  video: XX/XX
  adPlacement: XX/XX
  activityLog: XX/XX

Duration: X.XXs
==============================
```

**Monitor Progress:**
- Watch the console for progress logs
- Import reports every 10 documents
- ID mappings are saved after each collection (checkpoint)
- If import fails, it can resume from the last checkpoint

## Step 7: Verify Migration

Validate data integrity after import:

```bash
npm run migrate:verify
```

**Expected Output:**
```
=== VERIFICATION REPORT ===
Verified at: 2026-01-17T...

Record Counts:
  ✓ video: Sanity=XX, Payload=XX
  ✓ category: Sanity=XX, Payload=XX
  ✓ user: Sanity=XX, Payload=XX
  ✓ activityLog: Sanity=XX, Payload=XX
  ✓ adPlacement: Sanity=XX, Payload=XX
  ✓ affiliatePartner: Sanity=XX, Payload=XX

Category Hierarchy: ✓ PASS
Video-Category Refs: ✓ PASS
Activity Log Refs: ✓ PASS
Calculated Fields: ✓ PASS
Slug Uniqueness: ✓ PASS

✅ Migration verification passed! All checks successful.

Report saved to: migration/exported-data/verification-report-*.json
Duration: X.XXs
============================
```

**If Verification Fails:**
- Review the verification report JSON file
- Check specific errors (counts, relationships, etc.)
- Fix issues in PayloadCMS data or re-run import
- See `migration/README.md` for troubleshooting

## Step 8: Spot-Check in Admin UI

1. Start PayloadCMS server:

```bash
npm run dev:payload
```

2. Open admin UI: http://localhost:3000/admin

3. Verify sample data:
   - Create/login as admin user
   - Browse Videos collection
   - Browse Categories collection (check hierarchy)
   - Check a few videos for correct category references
   - Verify ad placements and affiliate partners

## Step 9: Celebrate! 🎉

Migration is complete! You now have:

- ✅ All Sanity data migrated to PayloadCMS
- ✅ Relationships preserved and validated
- ✅ Calculated fields correct
- ✅ Data accessible via PayloadCMS admin UI
- ✅ Ready for frontend integration (Phase 5)

## Alternative: Run Full Pipeline

To run all steps in sequence (after configuring token):

```bash
npm run migrate:all
```

This executes:
1. Export from Sanity
2. Transform data
3. Import to PayloadCMS (real, not dry-run)
4. Verify migration

**Warning**: This skips the dry-run step. Recommended only if you've already tested with dry-run.

## Rollback Strategy

If you need to rollback the migration:

1. **Drop PayloadCMS collections** in MongoDB:
```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Switch to database
use your-database-name

# Drop collections
db.videos.drop()
db.categories.drop()
db.users.drop()
db['activity-logs'].drop()
db['ad-placements'].drop()
db['affiliate-partners'].drop()
```

2. **Re-run migration** from Step 6 (import)

## Troubleshooting

### "Cannot find module 'dotenv'"

```bash
pnpm install
```

### "MONGODB_URI is not defined"

Check `.env` file has:
```
MONGODB_URI=mongodb+srv://...
```

### "PayloadCMS initialization failed"

- Check MongoDB connection string is valid
- Ensure MongoDB Atlas allows your IP
- Verify database user has read/write permissions

### "Import fails partway through"

- Check import report for specific errors
- ID mappings are saved after each collection
- Fix issues and re-run import (will resume from last checkpoint)

## Need Help?

1. Check `migration/README.md` for detailed documentation
2. Review error messages in console output
3. Check generated report files in `migration/exported-data/`
4. Verify environment variables in `.env`

---

**Ready to Start?** → [Step 1: Configure Sanity API Token](#step-1-configure-sanity-api-token)
