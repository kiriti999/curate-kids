# Remove Video Status Field Migration

This script removes the deprecated `status` and `publishedAt` fields from all video documents in your Sanity dataset.

## Prerequisites

You need a Sanity API token with write permissions:

1. Go to https://www.sanity.io/manage/personal/tokens
2. Click "Add API token"
3. Give it a name like "Migration Token"
4. Select permissions: **Editor** (or higher)
5. Copy the token

## Running the Migration

### Option 1: Using environment variable

```bash
# Set the token (replace with your actual token)
export SANITY_API_TOKEN="your-token-here"

# Run the migration
npx tsx scripts/remove-video-status-field.ts
```

### Option 2: Using a .env file

1. Create a `.env` file in the root directory (if you don't have one):
   ```
   SANITY_API_TOKEN=your-token-here
   ```

2. Run with dotenv:
   ```bash
   npx tsx --env-file=.env scripts/remove-video-status-field.ts
   ```

## What it does

1. Fetches all video documents (drafts and published)
2. Identifies documents with `status` or `publishedAt` fields
3. Shows you what will be updated
4. Waits 5 seconds for you to cancel if needed
5. Removes the fields from all affected documents

## Safety

- The script shows you exactly what will be changed before proceeding
- You have 5 seconds to press Ctrl+C to cancel
- Uses a transaction to ensure atomic updates
- Only affects video documents

## After Migration

After running this script:
- All video documents will no longer have `status` or `publishedAt` fields
- Draft/published state will be managed by Sanity's built-in system
- Your frontend queries will work as expected
