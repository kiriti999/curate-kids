# Customer Onboarding Checklist

Welcome to CuratedReels! This guide will help you set up your own curated video platform for kids.

---

## Prerequisites

Before we begin, you'll need to create accounts on the following platforms:

### 1. MongoDB Atlas (Database)
**Time: ~10 minutes**

- [ ] Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
- [ ] Create a free account
- [ ] Create a new cluster (free tier is fine to start)
- [ ] Create a database user with read/write permissions
- [ ] Whitelist IP addresses (or allow access from anywhere: `0.0.0.0/0`)
- [ ] Get your connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)

**Save this:** `MongoDB Connection URI`

---

### 2. Vercel Account (Frontend Hosting)
**Time: ~5 minutes**

- [ ] Go to [Vercel](https://vercel.com)
- [ ] Create an account (GitHub login recommended)
- [ ] Go to Account Settings → Tokens
- [ ] Create a new token with full access
- [ ] Copy the token immediately (you can't see it again)

**Save this:** `Vercel Access Token`

---

### 3. Deno Deploy (Bot Hosting)
**Time: ~5 minutes**

- [ ] Go to [Deno Deploy](https://deno.com/deploy)
- [ ] Create an account (GitHub login recommended)
- [ ] Go to Account Settings → Access Tokens
- [ ] Create a new token
- [ ] Copy the token

**Save this:** `Deno Deploy Access Token`

---

### 4. Telegram Bot
**Time: ~5 minutes**

- [ ] Open Telegram and search for [@BotFather](https://t.me/BotFather)
- [ ] Send `/newbot`
- [ ] Choose a name (e.g., "My CuratedReels Bot")
- [ ] Choose a username (e.g., "MyCurateKidsBot") - must end with "bot"
- [ ] Copy the bot token

**Save this:** `Telegram Bot Token`

---

### 5. Cloudinary Account (Video Storage)
**Time: ~5 minutes**

- [ ] Go to [Cloudinary](https://cloudinary.com)
- [ ] Create a free account
- [ ] Go to Dashboard
- [ ] Copy your Cloud Name, API Key, and API Secret

**Save these:**
- `Cloudinary Cloud Name`
- `Cloudinary API Key`
- `Cloudinary API Secret`

---

### 6. YouTube API Key (Optional - for video metadata)
**Time: ~10 minutes**

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create a new project
- [ ] Enable YouTube Data API v3
- [ ] Create an API key (restrict to YouTube API for security)

**Save this:** `YouTube API Key`

---

### 7. Telegram Groups (Age-based curation)
**Time: ~15 minutes**

Create 5 private Telegram groups for content curation:

- [ ] Create group: "CuratedReels 0-2 Years"
- [ ] Create group: "CuratedReels 3-5 Years"
- [ ] Create group: "CuratedReels 6-8 Years"
- [ ] Create group: "CuratedReels 9-12 Years"
- [ ] Create group: "CuratedReels 13+ Years"

For each group:
1. Add your bot as an admin
2. Get the group ID (you can use [@userinfobot](https://t.me/userinfobot) or our setup script)

**Save these:**
- `Group ID for 0-2`
- `Group ID for 3-5`
- `Group ID for 6-8`
- `Group ID for 9-12`
- `Group ID for 13+`

---

### 8. Custom Domain (Optional)
**Time: varies**

If you want a custom domain (e.g., `curatedreels.yourname.com`):

- [ ] Purchase/own a domain
- [ ] Have access to DNS settings
- [ ] We'll configure the DNS during setup

**Save this:** `Custom Domain`

---

## Credentials Summary

Copy this template and fill in your values:

```
# MongoDB
MONGODB_URI=mongodb+srv://...

# Vercel
VERCEL_TOKEN=...

# Deno Deploy
DENO_TOKEN=...

# Telegram
TELEGRAM_BOT_TOKEN=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# YouTube (optional)
YOUTUBE_API_KEY=...

# Telegram Groups
GROUP_0_2=...
GROUP_3_5=...
GROUP_6_8=...
GROUP_9_12=...
GROUP_13_PLUS=...

# Admin
ADMIN_EMAIL=your@email.com

# Domain (optional)
CUSTOM_DOMAIN=
```

---

## Next Steps

Once you have all credentials ready:

1. Send us your filled credentials (securely via encrypted channel)
2. We'll run the provisioning script
3. Within 30 minutes, you'll receive:
   - Your frontend URL
   - Admin login credentials
   - Bot confirmation

---

## Estimated Costs (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| MongoDB Atlas | 512 MB free | ~$10/mo for 10GB |
| Vercel | Hobby (free) | ~$20/mo Pro |
| Deno Deploy | 100K req/day free | ~$10/mo |
| Cloudinary | 25 GB free | ~$89/mo for 225 GB |

**Total for small deployment: $0 - $50/month**

---

## Support

If you have questions during setup:
- Email: support@curatedreels.io (replace with actual)
- Telegram: @CurateKidsSupport (replace with actual)

---

## Security Notes

⚠️ **Important:**
- Never share these credentials publicly
- Use a password manager to store them
- Send credentials only through encrypted channels
- Change all passwords after initial setup
