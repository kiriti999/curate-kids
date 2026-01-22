# CuratedReels Template - Restructuring Plan

## Current State

### /Users/arjun/curatekids (Frontend + Payload CMS)
- Next.js frontend in `frontend/`
- Payload CMS in `payload/`
- MongoDB-based backend
- Already migrated from Sanity to Payload

### /Users/arjun/curatekids-bot (Telegram Bot)
- Deno-based Telegram bot
- Grammy framework
- MongoDB integration (migrated from Sanity)
- Cloudinary for video uploads

---

## Target Structure

```
curatekids-template/
├── apps/
│   ├── frontend/          # Next.js + Payload CMS
│   │   ├── frontend/      # Next.js app
│   │   ├── payload/       # Payload collections
│   │   ├── server.ts
│   │   ├── payload.config.ts
│   │   ├── package.json
│   │   └── .env.template
│   │
│   └── bot/               # Telegram Bot (Deno)
│       ├── src/
│       ├── deno.json
│       └── .env.template
│
├── infra/
│   ├── terraform/
│   │   ├── vercel/
│   │   │   └── main.tf           # Vercel project + env vars
│   │   ├── deno/
│   │   │   └── main.tf           # Deno Deploy config
│   │   ├── cloudflare/
│   │   │   └── main.tf           # Optional: DNS + R2
│   │   ├── providers.tf
│   │   └── variables.tf
│   │
│   └── mongo/
│       └── indexes.js            # MongoDB index creation script
│
├── scripts/
│   ├── provision.js              # Main orchestration script
│   ├── bootstrap.sh              # Initial setup
│   ├── validate-env.js           # Environment validation
│   ├── setup-mongo.js            # MongoDB setup (collections, indexes, admin)
│   ├── deploy-frontend.sh        # Vercel deployment
│   ├── deploy-bot.sh             # Deno Deploy
│   └── generate-credentials.js   # Generate customer credentials
│
├── docs/
│   ├── onboarding.md             # Customer onboarding checklist
│   ├── customer-checklist.md     # What customer needs to provide
│   ├── support-tiers.md          # Pricing & support documentation
│   └── troubleshooting.md
│
├── .env.example                   # Master env template
├── customer-config.example.json   # Customer-specific config template
├── README.md
└── LICENSE
```

---

## Implementation Steps

### Phase 1: Create Template Repository Structure
1. Create new directory structure
2. Move frontend code to `apps/frontend/`
3. Move bot code to `apps/bot/`
4. Create shared configuration

### Phase 2: Terraform Infrastructure
1. Vercel project creation
2. Deno Deploy configuration
3. Environment variable management
4. Domain binding (optional)

### Phase 3: Provisioning Scripts
1. `provision.js` - Main orchestration
2. `validate-env.js` - Input validation
3. `setup-mongo.js` - Database setup
4. Deployment scripts

### Phase 4: Documentation
1. Customer onboarding checklist
2. Support tier documentation
3. Troubleshooting guide

---

## Customer Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER SETUP (One-Time)                │
├─────────────────────────────────────────────────────────────┤
│  1. Create MongoDB Atlas account → Get connection string    │
│  2. Create Vercel account → Generate access token           │
│  3. Create Deno Deploy account → Generate access token      │
│  4. Create Telegram Bot → Get bot token                     │
│  5. Create Cloudinary account → Get API credentials         │
│  6. (Optional) Register domain                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    YOUR AUTOMATION                          │
├─────────────────────────────────────────────────────────────┤
│  $ npm run provision                                        │
│                                                             │
│  → Prompts for all credentials                              │
│  → Validates connections                                    │
│  → Creates MongoDB collections + indexes                    │
│  → Runs Terraform (Vercel + Deno projects)                  │
│  → Deploys code                                             │
│  → Outputs admin credentials                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    OUTPUT                                   │
├─────────────────────────────────────────────────────────────┤
│  ✓ Frontend URL: https://customer.vercel.app                │
│  ✓ Bot: @CustomerCurateBot                                  │
│  ✓ Admin Email: admin@customer.com                          │
│  ✓ Temp Password: xxxxxx                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Pricing Tiers (Reference)

### Tier 1: One-Time Setup - ₹15k–₹30k ($200–$400)
- Infrastructure setup
- Bot deployment
- Admin account creation
- 30-day basic support

### Tier 2: Annual Support - ₹5k–₹10k/year
- Bug fixes
- Telegram API updates
- Security patches

### Tier 3: Managed/Subscription - ₹1k–₹3k/month
- Feature upgrades
- Analytics
- Priority support

---

## Next Steps

1. [ ] Create template repository structure
2. [ ] Write Terraform files
3. [ ] Write provision.js orchestration
4. [ ] Create customer onboarding docs
5. [ ] Test end-to-end provisioning
