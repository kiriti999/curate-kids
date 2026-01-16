# CurateKids Telegram Bot (Deno)

Telegram bot for curating videos from YouTube, Facebook, Instagram, and LinkedIn.

## Local Development

1. Install Deno: https://deno.land/manual/getting_started/installation

2. Copy environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Run locally:
   ```bash
   deno task dev
   ```

## Deploy to Deno Deploy (Free)

1. Go to [dash.deno.com](https://dash.deno.com)
2. Sign in with GitHub
3. Click **New Project** → **Import from GitHub**
4. Select your repo, set:
   - **Entry point:** `bot-deno/src/main.ts`
5. Add environment variables in Settings
6. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `YOUTUBE_API_KEY` | Google Cloud Console |
| `SANITY_PROJECT_ID` | Your Sanity project ID |
| `SANITY_DATASET` | Usually "production" |
| `SANITY_TOKEN` | Sanity API token (Editor role) |
| `GROUP_0_2` | Chat ID for 0-2 years group |
| `GROUP_3_5` | Chat ID for 3-5 years group |
| `GROUP_6_8` | Chat ID for 6-8 years group |
| `GROUP_9_12` | Chat ID for 9-12 years group |
| `GROUP_13_PLUS` | Chat ID for 13+ years group |

## Supported Platforms

- ✅ YouTube (with metadata)
- ✅ Facebook
- ✅ Instagram
- ✅ LinkedIn
