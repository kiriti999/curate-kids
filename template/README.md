# CuratedReels Template

A complete, white-label solution for curating kid-friendly video content via Telegram with a beautiful web frontend.

## 🎯 What is CuratedReels?

CuratedReels allows parents, educators, and content curators to:

- **Curate videos** from YouTube, Facebook, Instagram, and direct uploads
- **Organize by age** (0-2, 3-5, 6-8, 9-12, 13+)
- **Categorize content** (Education, Entertainment, Music, Science, etc.)
- **Share via Telegram** - Just paste a video link, select category, done!
- **Display on web** - Beautiful, responsive gallery for kids to browse

## 🏗️ Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Telegram      │      │   Next.js       │      │   MongoDB       │
│   Bot           │─────▶│   + Payload     │─────▶│   Atlas         │
│   (Deno)        │      │   (Vercel)      │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│   Cloudinary    │      │   YouTube API   │
│   (Videos)      │      │   (Metadata)    │
└─────────────────┘      └─────────────────┘
```

## 📁 Project Structure

```
curatedreels-template/
├── apps/
│   ├── frontend/          # Next.js + Payload CMS
│   └── bot/               # Telegram Bot (Deno)
├── infra/
│   ├── terraform/         # Infrastructure as Code
│   └── mongo/             # Database scripts
├── scripts/
│   ├── provision.ts       # Main setup script
│   └── ...
├── docs/
│   ├── customer-checklist.md
│   └── support-tiers.md
└── .env.example
```

## 🚀 Quick Start (For Operators)

### Prerequisites

- Node.js 18+
- Deno 1.40+
- Terraform 1.0+
- pnpm

### 1. Clone & Install

```bash
git clone https://github.com/your-org/curatedreels-template.git
cd curatedreels-template
pnpm install
```

### 2. Get Customer Credentials

Send your customer the [Customer Checklist](./docs/customer-checklist.md).

They need to provide:
- MongoDB URI
- Vercel Token
- Deno Deploy Token
- Telegram Bot Token
- Cloudinary credentials
- Telegram Group IDs

### 3. Run Provisioning

```bash
npm run provision
```

This will:
1. Prompt for all credentials
2. Validate connections
3. Set up MongoDB (collections, indexes, admin user)
4. Run Terraform (create Vercel + Deno projects)
5. Deploy code
6. Output credentials

### 4. Share Results with Customer

After provisioning, you'll receive:
- Frontend URL
- Bot username
- Admin email
- Temporary password

## 📖 Documentation

- [Customer Onboarding Checklist](./docs/customer-checklist.md)
- [Support Tiers & Pricing](./docs/support-tiers.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)
- [Restructure Plan](./RESTRUCTURE_PLAN.md)

## 🔧 Manual Deployment

### Frontend (Vercel)

```bash
cd apps/frontend
vercel deploy --prod
```

### Bot (Deno Deploy)

```bash
cd apps/bot
deployctl deploy --project=customer-bot src/main.ts
```

### Set Telegram Webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://customer-bot.deno.dev/webhook"
```

## 🏷️ Pricing Tiers

| Tier | Price | Includes |
|------|-------|----------|
| **Setup** | ₹15-30K once | Full setup + 30-day support |
| **Annual** | ₹5-10K/year | Bug fixes + security patches |
| **Managed** | ₹1-3K/month | Priority support + new features |

See [Support Tiers](./docs/support-tiers.md) for details.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, Mantine UI
- **CMS**: Payload CMS 3.0
- **Database**: MongoDB Atlas
- **Bot**: Deno, Grammy
- **Hosting**: Vercel (frontend), Deno Deploy (bot)
- **Storage**: Cloudinary
- **IaC**: Terraform

## 📄 License

Proprietary - Contact for licensing terms.

## 🤝 Support

- **Email**: support@curatedreels.io
- **Telegram**: @CuratedReelsSupport

---

Built with ❤️ for kids' digital wellness
