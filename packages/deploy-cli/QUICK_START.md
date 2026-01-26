# Quick Start Guide - Deployment CLI

## For Developers

### Setup Development Environment

```bash
cd packages/deploy-cli
npm install
npm run build
```

### Test Locally

```bash
# Run in dev mode
npm run dev

# This will start the CLI with hot reload
```

### Mock License Testing

For local testing without a license server:

```bash
# Set environment variable
export NODE_ENV=development

# Use test license key
curatedreels-deploy
# Enter license: test_12345 or dev_abcdef
```

### Required Credentials for Testing

1. **Vercel**
   - Get token: https://vercel.com/account/tokens
   - Format: Opaque string (e.g., `v1.xxxxxxxxxxxxxx`)

2. **Deno Deploy**
   - Get token: https://dash.deno.com/account#access-tokens
   - Format: Long alphanumeric string

3. **MongoDB Atlas**
   - Create cluster: https://cloud.mongodb.com
   - Format: `mongodb+srv://user:pass@cluster.mongodb.net/db`

4. **Telegram Bot**
   - Create bot: https://t.me/botfather
   - Format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### Test Deployment (Sandbox)

```bash
# Create a test deployment
curatedreels-deploy

# Enter test values:
Project name: test-curatedreels
Vercel token: [your-test-token]
Deno token: [your-test-token]
MongoDB URI: [your-test-cluster]
Telegram bot token: [your-test-bot]
```

### Clean Up Test Deployment

```bash
# Manually delete from:
# - Vercel dashboard
# - Deno Deploy dashboard
# - MongoDB collections (don't delete cluster)
```

## For Production Use

### 1. Build Bundles

```bash
# TODO: Create these scripts
cd ../../scripts/build-bundles
./build-all.sh
```

This will create:
- `frontend.zip` - Next.js  production build
- `cms.zip` - PayloadCMS production build
- `bot.js` - Bundled Deno executable
- `schema.json` - MongoDB schema

### 2. Upload to CDN

```bash
# TODO: Create upload script
./upload-to-cdn.sh v1.0.0
```

### 3. Publish CLI

```bash
cd packages/deploy-cli
npm version 1.0.0
npm publish
```

### 4. Customer Installation

```bash
npm install -g @curatedreels/deploy
curatedreels-deploy
```

## Testing Checklist

Before publishing:

- [ ] License verification works
- [ ] All credentials validate correctly
- [ ] Bundles download successfully
- [ ] MongoDB setup completes
- [ ] Vercel deployment works
- [ ] Deno deployment works
- [ ] Environment variables are set
- [ ] Services can communicate
- [ ] Custom domains work
- [ ] Error messages are helpful
- [ ] Deployment completes in < 5 min
- [ ] Can deploy multiple times
- [ ] Rollback works on failure

## Troubleshooting

### "Failed to verify license"
- Check LICENSE_API_URL env var
- Verify license server is running
- In dev mode, use test_ prefix

### "Vercel deployment failed"
- Verify API token is valid
- Check team permissions
- Verify bundle files exist

### "Deno deployment timeout"
- Check bot.js is valid Deno code
- Verify bundle size (< 10MB)
- Check Deno service status

### "MongoDB connection failed"
- Verify connection string format
- Check IP whitelist in Atlas
- Verify database user permissions

## Architecture Decisions

### Why Sequential Deployment?

We deploy in this order:
1. MongoDB (provides data layer)
2. CMS (provides API)
3. Frontend (consumes CMS API)
4. Bot (consumes CMS API)

This ensures URLs are available when needed.

### Why Vercel + Deno Deploy?

- **Vercel**: Best for Next.js, zero-config deploys
- **Deno Deploy**: Best for Telegram bots, V8 isolates
- Both have generous free tiers for customers

### Why Not Docker/K8s?

- Too complex for average customer
- Requires infrastructure knowledge
- Higher operating costs
- We want "click and deploy"

### Why Bundle Instead of Git?

- Protects source code
- Smaller download size
- Faster deployments
- Version control on our side
- Customer can't modify code

## Revenue Model

### Pricing
- **Starter**: $49/mo (1 deployment)
- **Pro**: $149/mo (3 deployments)
- **Enterprise**: Custom (unlimited)

### Customer Costs (Their Infrastructure)
- Vercel: $0-20/mo (likely free tier)
- Deno Deploy: $0-10/mo (likely free tier)
- MongoDB Atlas: $0-9/mo (M0 free tier)
- **Total customer infra cost**: $0-40/mo

### Our Costs Per Customer
- CDN bandwidth: ~$0.50/mo
- License server: ~$1/mo (shared)
- Support: Time-based
- **Total cost**: ~$2/mo per customer

### Profit Margins
- Starter: $47/mo profit (96% margin)
- Pro: $143/mo profit (96% margin)
- Enterprise: Negotiable

## Next Steps

1. **Create build scripts** (scripts/build-bundles/)
2. **Set up license server** (separate repo)
3. **Configure CDN** (S3 + CloudFront)
4. **Beta testing** (5-10 customers)
5. **Public launch** (Product Hunt, etc.)

## Support

Questions? Check:
- `DEPLOYMENT_ARCHITECTURE.md` - Full architecture
- `ORCHESTRATOR_COMPLETE.md` - Implementation details
- `README.md` - User documentation

---

Built with ❤️ for white-label SaaS deployment
