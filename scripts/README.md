# Scripts Directory

This directory contains utility scripts for seeding and managing data in the Youth Content CMS.

## Available Scripts

### seed-admin.ts

Seeds the first admin user into PayloadCMS.

**Usage:**
```bash
pnpm seed:admin
```

### seed-age-ranges.ts

Seeds the 7 predefined age range root categories into PayloadCMS.

**Prerequisites:**
- PayloadCMS server must be running (`pnpm dev`)
- An admin user must exist (run `pnpm seed:admin` first)

**Usage:**
```bash
npx tsx scripts/seed-age-ranges.ts
```

**What it does:**
Creates 7 immutable age range categories:
- 0-2 years
- 2-4 years
- 5-7 years
- 8-9 years
- 10-15 years
- 16+ years
- 18+ years

These categories serve as the root of the category hierarchy. All content categories must be created under one of these age ranges.

**Important:**
- Run this script **once** after initial project setup
- Age range categories cannot be deleted or modified
- Running multiple times will create duplicates (avoid this)

### extract-youtube-ids.ts

Extracts YouTube video IDs from URLs in the database.

**Usage:**
```bash
npx tsx scripts/extract-youtube-ids.ts
```
