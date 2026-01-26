# @curatedreels/deploy

White-label deployment CLI for CuratedReels - Deploy to customer's infrastructure without exposing source code.

## Overview

This CLI tool allows customers to deploy CuratedReels to their own infrastructure (Vercel, Deno Deploy, MongoDB) using pre-compiled bundles, without seeing or modifying the source code.

## Installation

```bash
npm install -g @curatedreels/deploy
```

## Usage

```bash
curatedreels-deploy
```

The CLI will guide you through:
1. License verification
2. Infrastructure credentials collection
3. Bundle download
4. Automated deployment

## Required Accounts

Customers need:
- ✅ [Vercel](https://vercel.com) account + API token
- ✅ [Deno Deploy](https://deno.com/deploy) account + access token
- ✅ [MongoDB Atlas](https://mongodb.com/atlas) cluster + connection URI
- ✅ [Telegram Bot](https://t.me/botfather) token
- ✅ Valid CuratedReels license key

## Optional Services

- [Cloudinary](https://cloudinary.com) - For video uploads
- [YouTube Data API](https://developers.google.com/youtube/v3) - For metadata extraction

## What Gets Deployed

### Vercel (2 projects)
1. **Frontend** - Public-facing web app
2. **CMS/Admin** - PayloadCMS admin panel + API

### Deno Deploy (1 project)
3. **Bot** - Telegram bot worker

###  MongoDB Atlas
- Creates database collections
- Sets up indexes
- Seeds initial data

## Architecture

```
Customer's Infrastructure:
├── Vercel
│   ├── Frontend (Next.js)
│   └── CMS (Next.js + PayloadCMS)
├── Deno Deploy
│   └── Bot (Telegram worker)
└── MongoDB Atlas
    └── Database
```

## Deployment Process

1. **License Verification** - Validates license key
2. **Credential Collection** - Interactive prompts for API tokens
3. **Bundle Download** - Downloads pre-compiled bundles (authenticated)
4. **Checksum Verification** - Ensures bundle integrity
5. **Deployment** - Deploys to all services
6. **Configuration** - Sets up environment variables
7. **Health Check** - Verifies all services are running

## Security

- ✅ Pre-compiled bundles only (no source code)
- ✅ License-gated downloads
- ✅ Checksum verification
- ✅ Encrypted credentials
- ✅ API token validation

## Bundle Contents

### frontend.zip
- Next.js production build (`.next/`)
- Static assets (`public/`)
- Package.json (dependencies only)

### cms.zip
- Next.js production build
- PayloadCMS compiled code
- Package.json (dependencies only)

### bot.js
- Single bundled Deno executable
- All dependencies included
- Obfuscated code

### schema.json
- MongoDB collection schemas
- Index definitions
- Seed data structure

## Environment Variables

Auto-configured during deployment:

**Frontend:**
```env
NEXT_PUBLIC_PAYLOAD_API_URL=<cms-url>
```

**CMS:**
```env
MONGODB_URI=<customer-mongo-uri>
NEXT_PUBLIC_FRONTEND_URL=<frontend-url>
TELEGRAM_BOT_TOKEN=<customer-bot-token>
CLOUDINARY_*=<customer-cloudinary-creds>
```

**Bot:**
```env
TELEGRAM_BOT_TOKEN=<customer-bot-token>
MONGODB_URI=<customer-mongo-uri>
PAYLOAD_API_URL=<cms-url>
CLOUDINARY_*=<customer-cloudinary-creds>
YOUTUBE_API_KEY=<customer-youtube-key>
```

## Troubleshooting

### License Issues
```
Error: Invalid license key
```
**Solution:** Ensure you have an active CuratedReels license. Purchase at https://curatedreels.com/pricing

### Vercel Deployment Fails
```
Error: Vercel API authentication failed
```
**Solution:** Verify your Vercel API token. Get it from https://vercel.com/account/tokens

### MongoDB Connection Fails
```
Error: MongoDB authentication failed
```
**Solution:** 
1. Check your connection string format
2. Verify IP whitelist in MongoDB Atlas
3. Confirm database user has read/write permissions

### Bundle Download Fails
```
Error: Failed to download bundles
```
**Solution:**
1. Check your internet connection
2. Verify license key is valid and not expired
3. Ensure you haven't exceeded deployment limits

## Support

- 📚 Documentation: https://docs.curatedreels.com
- 💬 Support: support@curatedreels.com
- 🐛 Issues: https://github.com/curatedreels/deploy-cli/issues

## License

Proprietary - © CuratedReels 2026

This tool is licensed software. Source code is not included in the distributed bundles.
