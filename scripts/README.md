# Scripts Directory

This directory contains utility scripts for seeding and managing data in the Youth Content CMS.

## Available Scripts

### seed-age-ranges.ts

Seeds the 7 predefined age range root categories into Sanity.

**Prerequisites:**
- Install `tsx` for running TypeScript: `pnpm add -D tsx`
- Generate a Sanity API token with write permissions from [sanity.io/manage](https://sanity.io/manage)

**Usage:**
```bash
SANITY_TOKEN=your_token_here npx tsx scripts/seed-age-ranges.ts
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

## Generating a Sanity Token

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Select your project
3. Navigate to "API" → "Tokens"
4. Click "Add API token"
5. Give it a name (e.g., "Seed Script")
6. Set permissions to "Editor" or "Admin"
7. Copy the token and use it with the scripts

**Security Note:** Never commit tokens to version control!
