# Quickstart Guide: Telegram Video Curation Bot

**Feature**: 001-telegram-video-curation  
**Last Updated**: 2025-01-20  
**Prerequisites**: Node.js 18+, Telegram account, YouTube Data API key, Sanity CMS project

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites Setup](#prerequisites-setup)
3. [Local Development](#local-development)
4. [Deployment (Railway)](#deployment-railway)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring](#monitoring)

---

## Overview

The Telegram Video Curation Bot monitors age-range specific Telegram groups for YouTube video links. When a curator shares a video, the bot presents category selection buttons, then submits the video metadata to Sanity CMS for review and publication.

**Architecture**:
```
Telegram Group → Bot (grammY) → YouTube API → Category Selection → Sanity CMS
```

**Key Features**:
- Automatic YouTube metadata extraction
- Inline keyboard category selection
- Age range auto-detection from group
- Retry logic for failed submissions
- In-memory state management with TTL

---

## Prerequisites Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow prompts to set bot name and username
4. **Save the bot token** (looks like: `110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`)
5. Disable privacy mode (allows bot to see all group messages):
   ```
   /setprivacy
   Select your bot
   Disable
   ```

### 2. Create Age-Range Groups

Create 5 Telegram groups for each age range:

1. **Group Creation**:
   - Open Telegram
   - New Group → Add bot as member
   - Name groups: "Videos 0-2", "Videos 3-5", "Videos 6-8", "Videos 9-12", "Videos 13+"

2. **Get Group Chat IDs**:
   ```bash
   # Method 1: Send a message in each group, then check bot logs
   # Method 2: Use getUpdates API
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
   
   Chat IDs are negative numbers (e.g., `-1001234567890`)
   
3. **Save Chat IDs** for configuration

### 3. Get YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable YouTube Data API v3:
   - APIs & Services → Library
   - Search "YouTube Data API v3"
   - Click Enable
4. Create credentials:
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - **Save the API key**
5. (Optional) Restrict API key:
   - API restrictions → YouTube Data API v3
   - Application restrictions → None (or HTTP referrers if using from web)

### 4. Get Sanity API Token

1. Go to [Sanity Manage](https://www.sanity.io/manage)
2. Select your project (`3rcl6ir9`)
3. API → Tokens → Add Token
4. Settings:
   - Name: "Telegram Bot"
   - Permissions: **Editor** (needs write access)
   - Dataset: `production`
5. **Save the token** (shown only once)

---

## Local Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd curatedreels
```

### 2. Create Bot Directory

```bash
mkdir -p bot/src/{handlers,services,utils,config,types}
mkdir -p bot/tests/{unit,integration,fixtures}
```

### 3. Initialize Bot Package

```bash
cd bot
npm init -y
npm install grammy @googleapis/youtube @sanity/client dotenv
npm install -D typescript @types/node tsx jest @types/jest ts-jest
```

### 4. Configure TypeScript

Create `bot/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 5. Environment Configuration

Create `bot/.env`:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw

# YouTube Data API
YOUTUBE_API_KEY=AIzaSyDdVgKwhZl-xxxxxxxxxxxxxxxxxx

# Sanity CMS
SANITY_PROJECT_ID=3rcl6ir9
SANITY_DATASET=production
SANITY_TOKEN=skxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Age Range Group Mappings
GROUP_0_2=-1001234567890
GROUP_3_5=-1001234567891
GROUP_6_8=-1001234567892
TELEGRAM_GROUP=-1001234567893
GROUP_13_PLUS=-1001234567894

# Optional: Logging
LOG_LEVEL=info
NODE_ENV=development
```

Create `bot/.env.example` (commit this, not `.env`):

```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
YOUTUBE_API_KEY=your_youtube_api_key_here
SANITY_PROJECT_ID=3rcl6ir9
SANITY_DATASET=production
SANITY_TOKEN=your_sanity_token_here
GROUP_0_2=your_group_chat_id_here
GROUP_3_5=your_group_chat_id_here
GROUP_6_8=your_group_chat_id_here
TELEGRAM_GROUP=your_group_chat_id_here
GROUP_13_PLUS=your_group_chat_id_here
LOG_LEVEL=info
NODE_ENV=development
```

### 6. Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts"
  }
}
```

### 7. Run Development Server

```bash
npm run dev
```

**Expected Output**:
```
[INFO] Bot started successfully
[INFO] Listening for messages in 5 groups
[INFO] State cleanup scheduled every 1 hour
```

### 8. Test the Bot

1. Open one of your age-range groups
2. Send a YouTube link: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Bot should respond with category buttons
4. Click a category (e.g., "Music")
5. Bot should confirm: "✅ Video saved! Category: music, Age Range: 3-5"
6. Check Sanity Studio → Videos to verify the document was created

---

## Deployment (Railway)

### 1. Prepare for Deployment

Add to `bot/package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Add `bot/.npmrc`:

```
engine-strict=true
```

### 2. Create Railway Project

1. Go to [Railway.app](https://railway.app/)
2. Sign up / Log in with GitHub
3. New Project → Deploy from GitHub repo
4. Select your repository
5. Root directory: `/bot` (if monorepo) or `/` (if bot is at root)

### 3. Configure Environment Variables

In Railway dashboard:

1. Go to Variables tab
2. Add all variables from `.env`:
   ```
   TELEGRAM_BOT_TOKEN=...
   YOUTUBE_API_KEY=...
   SANITY_PROJECT_ID=3rcl6ir9
   SANITY_DATASET=production
   SANITY_TOKEN=...
   GROUP_0_2=...
   GROUP_3_5=...
   GROUP_6_8=...
   TELEGRAM_GROUP=...
   GROUP_13_PLUS=...
   NODE_ENV=production
   LOG_LEVEL=info
   ```

### 4. Configure Build Settings

In Railway dashboard → Settings:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Watch Paths**: `bot/**` (if monorepo)

### 5. Deploy

1. Railway auto-deploys on git push to main branch
2. Monitor deployment logs in Railway dashboard
3. Verify bot is running:
   ```
   [INFO] Bot started successfully
   [INFO] Listening for messages in 5 groups
   ```

### 6. Set Up Monitoring

1. Railway → Settings → Observability
2. Enable logging
3. Set up alerts:
   - Memory usage > 80%
   - Crash detection
   - Deployment failures

---

## Configuration

### Age Range Group Mapping

Edit `bot/src/config/ageRangeGroups.ts`:

```typescript
import { AgeRange } from '../types/MessageState';

export const ageRangeGroups: Record<number, AgeRange> = {
  [parseInt(process.env.GROUP_0_2 || '')]: '0-2',
  [parseInt(process.env.GROUP_3_5 || '')]: '3-5',
  [parseInt(process.env.GROUP_6_8 || '')]: '6-8',
  [parseInt(process.env.TELEGRAM_GROUP || '')]: '9-12',
  [parseInt(process.env.GROUP_13_PLUS || '')]: '13+',
};

export function getAgeRange(chatId: number): AgeRange {
  return ageRangeGroups[chatId] || '0-2'; // Default fallback
}
```

### Category Buttons

Edit `bot/src/config/categories.ts`:

```typescript
export const categoryButtons = [
  { text: '📚 Education', value: 'education' },
  { text: '🎭 Entertainment', value: 'entertainment' },
  { text: '🎵 Music', value: 'music' },
  { text: '🔬 Science', value: 'science' },
  { text: '🎨 Arts & Crafts', value: 'arts-crafts' },
  { text: '⚽ Sports', value: 'sports' },
  { text: '🌳 Nature', value: 'nature' },
  { text: '📖 Stories', value: 'stories' },
] as const;
```

To change button text or add new categories:
1. Edit the array above
2. Update Sanity schema: `schemaTypes/documents/video.ts` category field
3. Redeploy bot

### State TTL

Edit `bot/src/services/stateManager.ts`:

```typescript
const TTL_HOURS = 24; // Change this value
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;
```

---

## Testing

### Unit Tests

Run specific test suites:

```bash
# URL parser tests
npm test -- urlParser.test.ts

# State manager tests
npm test -- stateManager.test.ts

# Retry logic tests
npm test -- retry.test.ts
```

### Integration Tests

```bash
# Full message flow
npm test -- integration/messageFlow.test.ts

# Concurrent submissions
npm test -- integration/concurrentSubmissions.test.ts
```

### Manual Testing Checklist

- [ ] Post YouTube link in test group
- [ ] Verify category buttons appear <2s
- [ ] Select category
- [ ] Verify confirmation message <5s
- [ ] Check Sanity Studio for new video document
- [ ] Verify all metadata fields populated correctly
- [ ] Test concurrent submissions (2 curators at once)
- [ ] Test invalid YouTube URL
- [ ] Test expired selection (wait 24h or manually delete state)

---

## Troubleshooting

### Bot Not Responding to Messages

**Symptoms**: No category buttons appear after posting YouTube link

**Checks**:
1. Verify bot is running: Check Railway logs or local terminal
2. Check bot privacy mode: Should be disabled in BotFather
3. Verify bot is member of group: Check Telegram group members
4. Check logs for errors: Look for YouTube API or network errors

**Solutions**:
```bash
# Check bot status
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check group members
curl https://api.telegram.org/bot<TOKEN>/getChatAdministrators?chat_id=<CHAT_ID>
```

### YouTube API Quota Exceeded

**Symptoms**: "⚠️ Video metadata unavailable" message

**Checks**:
1. Check quota usage: [Google Cloud Console → APIs → YouTube Data API v3 → Quotas](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)
2. Default limit: 10,000 units/day
3. Video metadata call: ~3 units

**Solutions**:
- Request quota increase: Google Cloud Console → Quotas → Request Increase
- Implement caching: Store fetched video titles to avoid re-fetching
- Reduce calls: Only fetch metadata once per unique video ID

### Sanity Submission Fails

**Symptoms**: "❌ Submission failed" message

**Checks**:
1. Verify Sanity token has write permissions
2. Check Sanity API status: [status.sanity.io](https://status.sanity.io/)
3. Check bot logs for error details

**Common Errors**:
- `401 Unauthorized`: Token invalid or expired → regenerate token
- `400 Validation Error`: Payload doesn't match schema → check data-model.md
- `429 Rate Limit`: Too many requests → implement backoff

**Solutions**:
```typescript
// Increase retry attempts
const sanityService = new SanityService(client, 5, 3000); // 5 attempts, 3s delay
```

### State Not Found on Callback

**Symptoms**: "⏰ Selection expired" when clicking category button

**Causes**:
- Bot restarted (in-memory state lost)
- More than 24 hours since message posted
- State cleanup removed entry

**Solutions**:
- Ask curator to re-share video link
- For persistence across restarts: Migrate to Redis (see data-model.md Section 9)

### Memory Leak Warnings

**Symptoms**: "Potential memory leak detected" in logs

**Checks**:
1. Check state store size: Should be <10,000 entries
2. Verify cleanup is running: Check logs for "Cleaned up X expired states"
3. Monitor Railway memory usage

**Solutions**:
```typescript
// Increase cleanup frequency
setInterval(cleanup, 30 * 60 * 1000); // Every 30 minutes instead of 1 hour

// Reduce TTL
const TTL_HOURS = 12; // Instead of 24
```

---

## Monitoring

### Key Metrics to Track

1. **Message Processing Time**:
   - Target: <2s from message to category buttons
   - Log: `messageToButtonsTime` in ms

2. **Submission Time**:
   - Target: <5s from category selection to confirmation
   - Log: `categoryToConfirmationTime` in ms

3. **Success Rate**:
   - Target: >95% first-attempt success, >99% after retries
   - Log: `sanitySubmitSuccess` vs `sanitySubmitFailed` count

4. **State Metrics**:
   - Active states: Should be proportional to daily curator activity
   - Expired states cleaned: Should increase daily
   - Average state lifetime: Typically <10 minutes (fast category selection)

### Log Examples

**Successful Submission**:
```json
{
  "timestamp": "2025-01-20T12:00:00Z",
  "level": "info",
  "event": "video_submitted",
  "chatId": -1001234567890,
  "userId": 987654321,
  "youtubeId": "dQw4w9WgXcQ",
  "category": "music",
  "ageRange": "3-5",
  "duration_ms": 3421
}
```

**YouTube API Error**:
```json
{
  "timestamp": "2025-01-20T12:00:00Z",
  "level": "warn",
  "event": "youtube_api_error",
  "error": "quotaExceeded",
  "youtubeId": "dQw4w9WgXcQ",
  "fallback": "using_url_as_title"
}
```

### Railway Monitoring

1. **Logs**: Railway dashboard → Logs tab
   - Filter by level: `error`, `warn`
   - Search for: `Sanity submission error`, `YouTube API error`

2. **Metrics**: Railway dashboard → Metrics tab
   - CPU usage: Should be <20% average
   - Memory usage: Should be <200MB
   - Network: Spikes during message processing

3. **Alerts**: Railway dashboard → Settings → Notifications
   - Set up email/Slack alerts for:
     - Deployment failures
     - High memory usage (>400MB)
     - Crash detection

---

## Advanced Configuration

### Enable Webhooks (Instead of Long-Polling)

**Benefits**: Lower latency, better for high-traffic bots

**Setup**:

1. Deploy bot to Railway (get public URL)
2. Set up webhook:
   ```bash
   curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
     -d "url=https://your-bot.railway.app/webhook"
   ```

3. Modify bot code:
   ```typescript
   // Instead of bot.start()
   app.post('/webhook', (req, res) => {
     bot.handleUpdate(req.body);
     res.sendStatus(200);
   });
   ```

### Migrate to Redis

**When**: Multiple bot instances or need state persistence

**Steps**: See `data-model.md` Section 9 for detailed migration guide

**Quick Setup**:
```bash
# Add Redis dependency
npm install ioredis

# Update stateManager.ts to use RedisStateStore
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
const stateStore = new RedisStateStore(redis);
```

---

## Support

### Resources

- **Specification**: `specs/001-telegram-video-curation/spec.md`
- **Data Model**: `specs/001-telegram-video-curation/data-model.md`
- **Research**: `specs/001-telegram-video-curation/research.md`
- **API Contracts**: `specs/001-telegram-video-curation/contracts/`

### Common Commands

```bash
# View Railway logs
railway logs

# Restart bot (Railway)
railway restart

# Check bot info
curl https://api.telegram.org/bot<TOKEN>/getMe

# Get updates (test bot connectivity)
curl https://api.telegram.org/bot<TOKEN>/getUpdates

# Check YouTube API quota
# Go to: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
```

### Getting Help

1. Check bot logs first
2. Review troubleshooting section above
3. Search existing issues in repository
4. Create new issue with:
   - Bot logs (redact tokens!)
   - Steps to reproduce
   - Expected vs actual behavior

---

**Last Updated**: 2025-01-20  
**Version**: 1.0.0  
**Maintainer**: CuratedReels Team
