# Data Migration Scripts

This directory contains scripts to migrate data from Sanity CMS to PayloadCMS.

## Overview

The migration process consists of four main steps:

1. **Export** - Export all documents from Sanity CMS
2. **Transform** - Transform Sanity format to PayloadCMS format
3. **Import** - Import transformed data into PayloadCMS/MongoDB
4. **Verify** - Verify migration integrity and data accuracy

## Prerequisites

Before running the migration scripts, ensure:

- MongoDB connection string is configured in `.env` (MONGODB_URI)
- Sanity credentials are configured in `.env` (SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN)
- PayloadCMS server is properly configured (`payload.config.ts`)
- All dependencies are installed (`npm install`)

## Usage

### Option 1: Run Full Migration Pipeline

Run all steps in sequence:

```bash
npm run migrate:all
```

This will:
1. Export data from Sanity
2. Transform data to PayloadCMS format
3. Import data to MongoDB (without dry-run)
4. Verify migration integrity

### Option 2: Run Steps Individually

#### Step 1: Export from Sanity

```bash
npm run migrate:export
```

**Output:** JSON files in `migration/exported-data/`
- `videos.json`, `categories.json`, `users.json`, etc.
- `export-summary.json` - Export statistics

#### Step 2: Transform Data

```bash
npm run migrate:transform
```

**Input:** `migration/exported-data/*.json` (from export step)

**Output:** 
- `*-transformed.json` - Transformed documents
- `id-mapping.json` - Empty ID mapping (filled during import)
- `transform-summary.json` - Transformation statistics

#### Step 3: Import to PayloadCMS

**Dry Run (Recommended First):**

```bash
npm run migrate:import:dry-run
```

This validates the import without writing to the database.

**Real Import:**

```bash
npm run migrate:import
```

**Output:**
- Data imported to MongoDB via PayloadCMS
- `id-mapping.json` - Updated with Sanity ID → PayloadCMS ID mappings
- `import-report-*.json` - Detailed import report with success/failure stats

#### Step 4: Verify Migration

```bash
npm run migrate:verify
```

**Output:**
- `verification-report-*.json` - Detailed verification report

The verification checks:
- Record counts match between Sanity and PayloadCMS
- Category hierarchy integrity (parent-child relationships, depth)
- Video-category references are valid
- Activity log references are valid
- Calculated fields are correct (childCount, videoCount)
- Slug uniqueness across collections

## Import Order

The import script processes collections in dependency order:

1. **Users** - No dependencies
2. **Categories** - May reference parent categories (sorted by depth)
3. **Affiliate Partners** - No dependencies
4. **Videos** - References categories
5. **Ad Placements** - References affiliate partners
6. **Activity Logs** - References users and other resources

## Error Handling

### Export Errors

- Check Sanity credentials in `.env`
- Verify network connectivity
- Ensure SANITY_TOKEN has read permissions

### Transform Errors

- Check exported data files exist
- Review validation errors in console output
- See `transform-summary.json` for error details

### Import Errors

- Run dry-run first to catch validation errors
- Check MongoDB connection string
- Review `import-report-*.json` for specific errors
- Import uses retry logic with exponential backoff (3 attempts)
- ID mappings are saved after each collection (checkpoint system)

### Verification Errors

- Review `verification-report-*.json` for specific issues
- Common issues:
  - Missing references (check import logs)
  - Incorrect calculated fields (check hooks)
  - Duplicate slugs (check data quality)

## Directory Structure

```
migration/
├── export-from-sanity.ts       # Export script
├── transform-data.ts            # Transformation script
├── import-to-payloadcms.ts     # Import script
├── verify-migration.ts          # Verification script
├── exported-data/               # Migration data directory
│   ├── *.json                   # Exported Sanity documents
│   ├── *-transformed.json       # Transformed PayloadCMS documents
│   ├── id-mapping.json          # Sanity ID → PayloadCMS ID mappings
│   ├── export-summary.json      # Export statistics
│   ├── transform-summary.json   # Transformation statistics
│   ├── import-report-*.json     # Import reports
│   └── verification-report-*.json # Verification reports
```

## Data Transformations

### Field Mappings

| Sanity | PayloadCMS | Notes |
|--------|-----------|-------|
| `_id` | `sanityId` | Preserved for reference mapping |
| `_type` | Collection name | Used to determine target collection |
| `_createdAt` | `createdAt` | Direct mapping |
| `_updatedAt` | `updatedAt` | Direct mapping |
| `_ref` | `id` | Resolved during import using ID mapping |
| `slug.current` | `slug` | String extraction |

### Reference Resolution

References are resolved in two phases:

1. **Transform Phase**: Store Sanity IDs
2. **Import Phase**: Resolve to PayloadCMS IDs using mapping

Example:
```
Sanity: { category: { _ref: "abc123" } }
→ Transform: { category: "abc123" }
→ Import: { category: "507f1f77bcf86cd799439011" } // MongoDB ObjectId
```

## Troubleshooting

### "Export file not found"

Run `npm run migrate:export` first.

### "Transformed data not found"

Run `npm run migrate:transform` after export.

### "Reference not found in ID mapping"

This is a warning during import. References that don't exist in the mapping will be set to `null`. Check if:
- The referenced document was skipped during export
- The document failed to import
- The reference is to a deleted document

### "Verification failed"

Common causes:
- Import failures (check import report)
- Hooks not running correctly (check hook implementations)
- Data inconsistencies in source (check Sanity data)

## Best Practices

1. **Always run dry-run first** before real import
2. **Backup MongoDB** before running real import
3. **Review export summary** to ensure all expected documents were exported
4. **Review transformation errors** before importing
5. **Monitor import progress** - logs show progress every 10 documents
6. **Run verification** immediately after import to catch issues early
7. **Spot-check data** in PayloadCMS admin UI after migration

## Performance

Typical migration times (approximate):

- Export: ~30 seconds for 1000 documents
- Transform: ~5 seconds for 1000 documents
- Import: ~2-5 minutes for 1000 documents (depends on hooks/validation)
- Verify: ~1-2 minutes for 1000 documents

For large datasets (10,000+ documents):
- Consider pagination/batching in scripts
- Increase MongoDB connection pool size
- Monitor memory usage

## Support

For issues or questions:
1. Check the logs in console output
2. Review generated report files (JSON)
3. Check PayloadCMS and MongoDB logs
4. Verify environment variables are correct
