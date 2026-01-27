# Deployment Guide

## Lazy Initialization Architecture

The bot uses **lazy initialization** to support deployment to platforms like Deno Deploy where environment variables cannot be set programmatically.

### How It Works

1. **HTTP Server Starts Immediately**
   - Server starts regardless of whether env vars are configured
   - No validation errors during deployment
   
2. **Health Check Endpoint (`GET /`)**
   - Returns bot status
   - Shows which env vars are missing (if any)
   - Works even without full configuration
   
3. **Lazy Bot Initialization**
   - Bot instance only created on first webhook request
   - Validates env vars at that time
   - Subsequent requests reuse the same instance

### Deployment Flow

#### On Deno Deploy:
```
1. Deploy code → HTTP server starts ✅
2. Visit dashboard, set env vars
3. Deno Deploy auto-redeploys
4. First webhook → Bot initializes ✅
5. Subsequent webhooks → Use cached instance
```

#### Local Development:
```bash
# Uses polling mode - initializes immediately
USE_POLLING=true deno run --allow-all src/main.ts
```

### Environment Variables

#### Required (bot won't start without these):
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `MONGODB_URI` - MongoDB connection string

#### Auto-configured by deployment:
- `PAYLOAD_CMS_URL` - PayloadCMS API URL
- `FRONTEND_URL` - Frontend application URL
- `WEBHOOK_URL` - Telegram webhook URL

#### Optional features:
- `TELEGRAM_GROUP` - Default group ID
- `CLOUDINARY_CLOUD_NAME` - Cloud name for video uploads
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `YOUTUBE_API_KEY` - YouTube Data API key

#### Development only:
- `USE_POLLING` - Set to "true" for long polling mode

### Health Check Examples

**Before env vars configured:**
```bash
$ curl https://your-bot.deno.dev/

⚠️ Bot deployed but not configured

Missing environment variables:
TELEGRAM_BOT_TOKEN, MONGODB_URI

Please configure them in the Deno Deploy dashboard.
```

**After env vars configured:**
```bash
$ curl https://your-bot.deno.dev/

CuratedReels Bot is running! 🤖
```

### Code Structure

```typescript
// Lazy initialization pattern
let botInstance: Bot | null = null;

async function getBot(): Promise<Bot> {
  if (!botInstance) {
    botInstance = await initBot(); // Only runs once
  }
  return botInstance;
}

// Webhook handler
if (req.method === "POST" && url.pathname === "/webhook") {
  const bot = await getBot(); // Lazy init on first call
  return await handleUpdate(req);
}
```

### Migration from Eager Initialization

**Old approach (eager - fails on deploy):**
```typescript
const bot = await initBot(); // ❌ Runs during deployment
Deno.serve(handler);
```

**New approach (lazy - succeeds):**
```typescript
let botInstance: Bot | null = null;
Deno.serve(async (req) => {
  const bot = await getBot(); // ✅ Runs on first request
  // ...
});
```

### Benefits

✅ Deployment always succeeds  
✅ Works without programmatic env var API  
✅ Clear error messages  
✅ Health check for monitoring  
✅ Backward compatible with local dev  
✅ No code obfuscation needed  

### Troubleshooting

**Problem:** Bot returns 503 on webhook
**Solution:** Check env vars are set in Deno Deploy dashboard

**Problem:** Bot works locally but not in production
**Solution:** Ensure `USE_POLLING` is not set in production

**Problem:** Health check shows missing vars but they're set
**Solution:** Trigger redeploy in Deno Deploy dashboard
