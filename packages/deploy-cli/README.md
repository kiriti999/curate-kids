# CuratedReels Deploy CLI

Deploy your white-label video curation platform to your own infrastructure in minutes.

## 🚀 Quick Start

**One-line deployment (easiest):**

```bash
GITHUB_TOKEN=$(gh auth token) npx curatedreels-deploy@latest
```

**Or set token separately:**

```bash
# Get your GitHub token
export GITHUB_TOKEN=$(gh auth token)

# Run the deployment
npx curatedreels-deploy@latest
```

That's it! The CLI will guide you through the entire deployment process.

## 📋 Prerequisites

Before you start, make sure you have:

1. **CuratedReels License Key** - You received this when you purchased CuratedReels
2. **GitHub CLI** - To get authentication token
   - Install: https://cli.github.com/
   - Login: `gh auth login`
   - Or create token manually: https://github.com/settings/tokens (needs `repo` scope)
3. **Vercel Account** (free tier works)
   - Sign up: https://vercel.com
   - Get API token: https://vercel.com/account/tokens
4. **Deno Deploy Account** (free tier works)
   - Sign up: https://deno.com/deploy
   - Get access token: https://dash.deno.com/account/access-tokens
5. **MongoDB Atlas** (free tier works)
   - Sign up: https://mongodb.com/atlas
   - Create a cluster and get connection URI
6. **Telegram Bot Token** (See detailed steps below)
   - Chat with [@BotFather](https://t.me/botfather)
   - Create a new bot and get the token

### Optional (Recommended)
- **Cloudinary** - For video uploads (https://cloudinary.com)
- **YouTube API Key** - For video metadata (https://developers.google.com/youtube/v3)

## 🎯 What You'll Get

After deployment, you'll have:

- **Public Website** - Your branded video platform at `your-project.vercel.app`
- **Admin Panel** - CMS to manage content at `your-project-cms.vercel.app`
- **Telegram Bot** - Interactive bot for video curation at `t.me/your_bot`
- **Database** - All your data in your own MongoDB

## 📖 Step-by-Step Guide

### STEP 1: Create Bot (BEFORE Deployment)

Before running the deploy command, create your Telegram bot:

1. **Open Telegram**
2. **Search for @BotFather**
3. **Send:** `/newbot`
4. **Choose a name:** "My CuratedReels Bot"
5. **Choose username:** `my_curated_bot` (must end with 'bot')
6. **BotFather gives you a TOKEN:** `7951673577:AAEalQZ...`
7. **Save this token!** You'll need it in Step 3

**Configure Bot Privacy (IMPORTANT):**

8. **Send to @BotFather:** `/setprivacy`
9. **Select your bot:** Click on @my_curated_bot
10. **Choose:** `Disable`
11. **Confirmation:** BotFather says "Success! Privacy mode is disabled"

⚠️ **Why?** By default, bots only see messages that start with `/` or mention them. Disabling privacy mode lets your bot see ALL messages in the group, which is required to detect video links.

### STEP 2: Run the Deploy Command

```bash
npx curatedreels-deploy
```

### STEP 3: Enter Your License Key

Paste the license key you received from CuratedReels:
```
? Enter your CuratedReels license key: ck_live_abc123...
```

### STEP 4: Choose Your Project Name

```
? Enter project name: my-video-platform
```

This will be used for:
- Vercel project names (`my-video-platform`, `my-video-platform-cms`)
- Deno Deploy project name (`my-video-platform-bot`)

### STEP 5: Enter API Tokens

The CLI will ask for your tokens one by one:

**Vercel:**
```
? Vercel API token: [paste your token]
```

**Deno Deploy:**
```
? Deno Deploy access token: [paste your token]
```

**MongoDB:**
```
? MongoDB connection URI: mongodb+srv://user:pass@cluster.mongodb.net/curatedreels
```

⚠️ **IMPORTANT:** Always add `/curatedreels` at the end of your MongoDB URI to specify the database name. This ensures all data is stored in a dedicated database.

**Telegram:**
```
? Telegram bot token: [paste the token from STEP 1]
```

**Admin Account:**
```
? Admin Full Name: John Doe
? Admin Email: john@mycompany.com
? Admin Password: ******** (min 8 characters)
```

**Cloudinary (optional):**
```
? Cloudinary cloud name: [your-cloud-name]
? Cloudinary API key: [your-api-key]
? Cloudinary API secret: [your-api-secret]
```

### STEP 6: Wait for Deployment

The CLI will:
1. ✅ Verify your license
2. ✅ Download deployment bundles
3. ✅ Deploy frontend to Vercel
4. ✅ Deploy CMS/admin to Vercel
5. ✅ Deploy bot to Deno Deploy
6. ✅ Configure environment variables
7. ✅ Run health checks

This takes ~3-5 minutes.

### STEP 7: Access Your Platform

When complete, you'll see:
```
✅ Deployment successful!

🌐 Frontend: https://my-video-platform.vercel.app
⚙️  CMS Admin: https://my-video-platform-cms.vercel.app
🤖 Telegram Bot: https://t.me/my_video_bot
```

### STEP 8: Add Bot to Group

After deployment completes, add your bot to a Telegram group:

1. **Create a Telegram group** (or use an existing one)
2. **In group settings** → Add Members
3. **Search for @my_curated_bot** (the username from STEP 1)
4. **Add it to the group**
5. **Make it admin** (optional, but recommended for full functionality)

✅ **Test it:** Post a YouTube/Instagram/Facebook video link in the group. The bot should respond with age range options!

⚠️ **Not working?** Make sure you disabled privacy mode in STEP 1. If you skipped it, go back to @BotFather, send `/setprivacy`, select your bot, and choose `Disable`. Then **remove and re-add** the bot to your group.

## 🎨 Next Steps

1. **Open your admin panel** - Visit the CMS URL and login with the credentials you provided during deployment
2. **Configure your bot** - Send `/start` to your Telegram bot
3. **Customize branding** - Update colors, logo in the admin panel
4. **Add videos** - Start curating content!

## ❓ FAQ

### Do I need to know how to code?
No! The CLI handles everything. Just provide your API tokens and project name.

### Will I own the infrastructure?
Yes! Everything is deployed to **your** accounts (Vercel, Deno, MongoDB). You have full control.

### Can I use the free tiers?
Yes! All platforms offer free tiers that work with CuratedReels:
- Vercel: Free tier (100GB bandwidth)
- Deno Deploy: Free tier (100k requests/day)
- MongoDB Atlas: Free tier (512MB storage)

### How do I update my deployment?
Run `GITHUB_TOKEN=$(gh auth token) npx curatedreels-deploy@latest` again with the same project name. It will update your existing deployment.

### Can I customize the platform?
You can customize branding, colors, and content through the admin panel. Source code customization is not available.

### What happens if I exceed deployment limits?
Your license tier determines how many deployments you can create:
- **Starter**: 1 deployment
- **Pro**: 5 deployments
- **Enterprise**: 999 deployments

Contact support to upgrade your license.

## 🐛 Troubleshooting

### Error: "GitHub token not found"

Make sure you're setting the token when running npx:

```bash
# Use this command (not just npx curatedreels-deploy)
GITHUB_TOKEN=$(gh auth token) npx curatedreels-deploy@latest
```

Or export it first:
```bash
export GITHUB_TOKEN=$(gh auth token)
npx curatedreels-deploy@latest
```

### Error: "Authentication required"

Your GitHub CLI might not be logged in:
```bash
gh auth login
# Then try deployment again
GITHUB_TOKEN=$(gh auth token) npx curatedreels-deploy@latest
```

### Error: "Release v1.0.7 not found"

Make sure you're using the latest version:
```bash
GITHUB_TOKEN=$(gh auth token) npx curatedreels-deploy@latest
```

### Bot not responding in Telegram group

1. Check privacy mode is disabled (`/setprivacy` with @BotFather)
2. Remove bot from group and add it back
3. Verify webhook was set (check the webhook URL from deployment output)

## 🏗️ Architecture

Your deployed platform includes:

```
Your Infrastructure:
├── Vercel (Frontend)
│   └── User-facing website
├── Vercel (CMS)
│   └── Admin panel + API
├── Deno Deploy (Bot)
│   └── Telegram bot worker
└── MongoDB Atlas
    └── Your database
```

All components connect automatically during deployment.

## 🔒 Security & Privacy

- Your data stays in **your** infrastructure
- CuratedReels never has access to your MongoDB or user data
- Pre-compiled, secure bundles
- Automatic SSL certificates on all deployments
- Environment variables encrypted in transit

## 🐛 Troubleshooting

### "Invalid license key"
- Double-check you copied the entire key (starts with `ck_live_`)
- Ensure your license hasn't expired
- Contact support if you need a new key

### "Vercel API authentication failed"
- Get a new token from https://vercel.com/account/tokens
- Make sure it has deployment permissions
- Copy the entire token without spaces

### "MongoDB connection failed"
- **IP Whitelist**: Go to MongoDB Atlas → Network Access → Add IP `0.0.0.0/0` (allow all)
- **Format**: Should look like `mongodb+srv://user:password@cluster.mongodb.net/curatedreels` (note the `/curatedreels` at the end)
- **Database Name**: Always append `/curatedreels` to specify the database name
- **Permissions**: Database user needs read/write access

### "Deployment limit exceeded"
You've used all deployments for your license tier. To add more:
- Upgrade your license tier
- Or delete an existing deployment from the admin panel

### "Bot not responding on Telegram"
- Make sure bot token is correct
- Send `/start` to the bot
- Check bot status at https://dash.deno.com

### Still stuck?
Contact support with your deployment logs:
- 💬 Email: support@whatsnxt.in
- Include: License key (first 10 chars only), error message, timestamps

## 📦 What's Included

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js | Public video platform |
| CMS/Admin | PayloadCMS | Content management |
| Bot | Grammy (Deno) | Telegram integration |
| Database | MongoDB | Data storage |

## 🔄 Updates

To update your deployment to the latest version:
```bash
npx curatedreels-deploy
```

Use the same project name and credentials. The CLI will update everything automatically.

## 📄 License

Proprietary - © CuratedReels 2026

This is licensed software. You have the right to deploy and use the platform, but source code is not included.
