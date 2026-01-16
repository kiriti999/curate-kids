# CurateKids Telegram Bot

Telegram bot for curating YouTube videos by age range and category. Monitors age-specific Telegram groups, extracts YouTube video metadata, and submits videos to Sanity CMS with curator-selected categories.

## Features

- **Automatic YouTube metadata extraction** - Fetches video titles using YouTube Data API
- **Inline category selection** - Presents 8 category buttons for curator selection
- **Age range detection** - Automatically applies age range based on Telegram group
- **Sanity CMS integration** - Submits videos with retry logic for reliability
- **Concurrent curator support** - Handles multiple curators submitting simultaneously
- **State management** - In-memory state with 24-hour TTL and automatic cleanup

## Quick Start

### Prerequisites

- Node.js 18+
- Telegram bot token (from [@BotFather](https://t.me/botfather))
- YouTube Data API key
- Sanity CMS project credentials

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Configuration

1. **Create Telegram Bot**: Message [@BotFather](https://t.me/botfather) and run `/newbot`
2. **Disable Privacy Mode**: Send `/setprivacy` to BotFather, select your bot, and choose "Disable"
3. **Create Age-Range Groups**: Create 5 Telegram groups and add the bot as a member
4. **Get Group Chat IDs**: Send a message in each group, then check `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. **Get YouTube API Key**: Enable YouTube Data API v3 in Google Cloud Console
6. **Get Sanity Token**: Create an Editor token in Sanity project settings

### Development

```bash
# Run in development mode (auto-reload)
pnpm dev

# Build for production
pnpm build

# Run in production
pnpm start

# Run tests
pnpm test
```

## Usage

1. Share a YouTube link in any age-range group
2. Bot presents category selection buttons
3. Click a category (e.g., "📚 Education")
4. Bot confirms submission to Sanity CMS
5. Video appears in Sanity Studio with status "pending"

## Architecture

```
bot/
├── src/
│   ├── index.ts              # Entry point, bot initialization
│   ├── handlers/
│   │   ├── messageHandler.ts    # Processes incoming messages
│   │   └── callbackHandler.ts   # Processes button clicks
│   ├── services/
│   │   ├── youtubeService.ts    # YouTube API integration
│   │   ├── sanityService.ts     # Sanity CMS integration
│   │   └── stateManager.ts      # Message-callback correlation
│   ├── utils/
│   │   ├── urlParser.ts         # YouTube URL parsing
│   │   ├── categoryKeyboard.ts  # Inline keyboard builder
│   │   ├── callbackDataParser.ts # Callback data parsing
│   │   └── logger.ts            # Structured logging
│   ├── config/
│   │   ├── categories.ts        # Category definitions
│   │   └── ageRangeGroups.ts    # Group ID mappings
│   └── types/
│       ├── MessageState.ts      # State interface
│       ├── VideoSubmission.ts   # CMS payload interface
│       └── CategorySelection.ts # Callback interface
└── tests/
    ├── unit/                # Unit tests
    ├── integration/         # Integration tests
    └── fixtures/            # Test data

```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | ✅ |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | ✅ |
| `SANITY_PROJECT_ID` | Sanity project ID | ✅ |
| `SANITY_DATASET` | Sanity dataset name | ✅ |
| `SANITY_TOKEN` | Sanity API token (Editor) | ✅ |
| `GROUP_0_2` | Chat ID for 0-2 age group | ✅ |
| `GROUP_3_5` | Chat ID for 3-5 age group | ✅ |
| `GROUP_6_8` | Chat ID for 6-8 age group | ✅ |
| `GROUP_9_12` | Chat ID for 9-12 age group | ✅ |
| `GROUP_13_PLUS` | Chat ID for 13+ age group | ✅ |
| `LOG_LEVEL` | Logging level (info/warn/error) | ❌ |
| `NODE_ENV` | Environment (development/production) | ❌ |

## Deployment

### Railway (Recommended)

1. Push code to GitHub
2. Create new project on [Railway.app](https://railway.app)
3. Connect GitHub repository
4. Set environment variables in Railway dashboard
5. Deploy automatically on push to main branch

See [quickstart.md](../specs/001-telegram-video-curation/quickstart.md) for detailed deployment instructions.

## Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test urlParser.test.ts

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test:watch
```

## Troubleshooting

### Bot not responding to messages

- Verify bot privacy mode is disabled in BotFather
- Check bot is a member of the group
- Review logs for errors

### YouTube API quota exceeded

- Check quota usage in Google Cloud Console
- Default limit: 10,000 units/day
- Request quota increase if needed

### Sanity submission fails

- Verify token has Editor permissions
- Check Sanity API status
- Review retry logic in logs

See [quickstart.md](../specs/001-telegram-video-curation/quickstart.md) for comprehensive troubleshooting guide.

## Documentation

- **Specification**: `specs/001-telegram-video-curation/spec.md`
- **Implementation Plan**: `specs/001-telegram-video-curation/plan.md`
- **Data Model**: `specs/001-telegram-video-curation/data-model.md`
- **API Contracts**: `specs/001-telegram-video-curation/contracts/`
- **Setup Guide**: `specs/001-telegram-video-curation/quickstart.md`

## License

UNLICENSED - Internal use only

## Support

For issues or questions, see [quickstart.md](../specs/001-telegram-video-curation/quickstart.md) troubleshooting section.
