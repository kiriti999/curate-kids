# Quick Start Guide - After MongoDB Credentials Fixed

## 1. Verify MongoDB Connection (5 minutes)

```bash
# Test the connection
deno run --allow-net --allow-env --env test-mongo-connection.ts
```

**Expected output:**
```
✅ MongoDB connection validated
✅ MongoDB indexes created/verified
✅ MongoDB connection test PASSED
```

## 2. Test Bot Locally (10 minutes)

```bash
# Start the bot
deno task dev
```

**Test cases:**
1. Send YouTube URL to bot
2. Select category and age range
3. Verify video saved to MongoDB
4. Check MongoDB Atlas dashboard to see the new document

## 3. Deploy to Deno Deploy (5 minutes)

### Update Environment Variables

Go to https://dash.deno.com → Your Project → Settings → Environment Variables

**Remove these:**
- `PAYLOAD_API_URL`
- `PAYLOAD_API_KEY`
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_TOKEN`

**Ensure these exist:**
- `TELEGRAM_BOT_TOKEN`
- `MONGODB_URI`
- `YOUTUBE_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `TELEGRAM_GROUP` (your Telegram group chat ID)

### Deploy

```bash
# Commit changes
git add .
git commit -m "feat: migrate from Sanity to MongoDB direct connection"
git push

# Deno Deploy will auto-deploy from GitHub
```

## 4. Test Production Bot (5 minutes)

1. Open Telegram
2. Send YouTube URL to your bot
3. Select category and age range
4. Verify video appears in age-appropriate group
5. Check MongoDB Atlas dashboard

## 5. Monitor (72 hours)

### Check Daily
- Bot error logs on Deno Deploy
- Video submission counts
- MongoDB query performance
- User feedback

### MongoDB Atlas Dashboard
- Database → Browse Collections → videos
- Check document count grows
- Monitor query performance

## 6. Cleanup (30 minutes)

After 72-hour monitoring passes:

```bash
# Optional: Archive migration scripts
mkdir -p archive/migration-2026-01
mv scripts/migrate-sanity-to-payload.ts archive/migration-2026-01/
mv scripts/verify-migration.ts archive/migration-2026-01/
mv scripts/export-sanity-backup.ts archive/migration-2026-01/
mv scripts/count-sanity-videos.ts archive/migration-2026-01/

# Optional: Remove Sanity backup
rm sanity-backup-2026-01-17T22-53-04.json

# Remove test script
rm test-mongo-connection.ts

# Update changelog
echo "## [2.0.0] - $(date +%Y-%m-%d)" >> CHANGELOG.md
echo "" >> CHANGELOG.md
echo "### Changed" >> CHANGELOG.md
echo "- Migrated from Sanity CMS to MongoDB Atlas direct connection" >> CHANGELOG.md
echo "- Removed PayloadCMS middleware layer" >> CHANGELOG.md
echo "- Simplified architecture (3 layers → 2 layers)" >> CHANGELOG.md
echo "- Reduced environment variables (11 → 6)" >> CHANGELOG.md
echo "" >> CHANGELOG.md
echo "### Benefits" >> CHANGELOG.md
echo "- Lower latency (direct database access)" >> CHANGELOG.md
echo "- Cost savings (\$15-50/month)" >> CHANGELOG.md
echo "- Simpler maintenance and debugging" >> CHANGELOG.md

# Commit
git add .
git commit -m "chore: cleanup migration artifacts and update changelog"
git push
```

## Troubleshooting

### MongoDB connection fails
- See MIGRATION_STATUS.md for detailed credential verification steps
- Check MongoDB Atlas network access rules
- Verify database user exists and has correct permissions

### Bot doesn't respond
- Check Deno Deploy logs for errors
- Verify all environment variables are set
- Test webhook is configured correctly

### Videos not saving correctly
- Verify users are selecting both age range and category
- Check TELEGRAM_GROUP environment variable is the correct chat ID
- Verify bot is admin in the group
- Check bot logs for submission errors

## Files Reference

- `IMPLEMENTATION_SUMMARY.md` - Complete change summary
- `MIGRATION_STATUS.md` - Detailed status and troubleshooting
- `README.md` - MongoDB Atlas setup guide
- `specs/001-sanity-payload-migration/tasks.md` - Task checklist

## Support

If you encounter issues:
1. Check MongoDB Atlas dashboard
2. Review Deno Deploy logs
3. Refer to MIGRATION_STATUS.md
4. Check MongoDB connection string format
5. Verify network access in Atlas

---

**Ready to start?** Fix MongoDB credentials first, then follow steps 1-6 above.
