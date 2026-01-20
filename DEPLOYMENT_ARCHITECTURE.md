# CurateKids White-Label Deployment Architecture

## Overview

CurateKids uses a **white-label deployment model** where customers deploy to their own infrastructure without accessing source code.

## Customer Experience

```bash
# One command to deploy everything
npx @curatekids/deploy
```

### Interactive Setup
1. Customer provides their credentials
2. System downloads pre-built bundles
3. Deploys to customer's accounts
4. Customer gets working system (no source code)

## Architecture Components

### 1. Build System (Your Side)

**Pre-compilation Pipeline:**
```
Source Code → Build → Bundle → Obfuscate → CDN
```

**Build Outputs:**
- `frontend.zip` - Next.js production build
- `cms.zip` - PayloadCMS production build  
- `bot.js` - Bundled Deno executable (single file)
- `schema.json` - MongoDB schema/indexes

**Build Commands:**
```bash
# Frontend
cd frontend && npm run build
zip -r frontend.zip .next public package.json

# CMS
cd curatekids && npm run build
zip -r cms.zip .next payload-cms package.json

# Bot (bundle everything into single file)
cd curatekids-bot && deno bundle src/main.ts dist/bot.js
# Minify/obfuscate bot.js
```

### 2. Distribution (CDN)

**Storage:**
- AWS S3 / Cloudflare R2
- Versioned releases
- Access via license key

**Structure:**
```
releases/
  v1.0.0/
    frontend.zip
    cms.zip
    bot.js
    schema.json
    config.template.json
```

### 3. Deployment CLI

**NPM Package: `@curatekids/deploy`**

```typescript
// packages/deploy-cli/src/index.ts

import { prompt } from 'prompts'
import { DeploymentOrchestrator } from './orchestrator'

async function main() {
  console.log('🎯 CurateKids Deployment CLI')
  
  // 1. License verification
  const { licenseKey } = await prompt({
    type: 'password',
    name: 'licenseKey',
    message: 'Enter your CurateKids license key:'
  })
  
  if (!verifyLicense(licenseKey)) {
    console.error('❌ Invalid license key')
    process.exit(1)
  }
  
  // 2. Collect credentials
  const credentials = await collectCredentials()
  
  // 3. Download bundles from CDN
  console.log('📦 Downloading deployment bundles...')
  await downloadBundles(licenseKey)
  
  // 4. Deploy
  const orchestrator = new DeploymentOrchestrator(credentials)
  await orchestrator.deploy()
  
  console.log('✅ Deployment complete!')
}
```

**Credential Collection:**
```typescript
async function collectCredentials() {
  return await prompt([
    {
      type: 'password',
      name: 'vercelToken',
      message: 'Vercel API Token:',
      validate: (v) => v.startsWith('vercel_') || 'Invalid Vercel token'
    },
    {
      type: 'password',
      name: 'denoToken',
      message: 'Deno Deploy Token:',
      validate: (v) => v.length > 20 || 'Invalid Deno token'
    },
    {
      type: 'text',
      name: 'mongodbUri',
      message: 'MongoDB Atlas URI:',
      validate: (v) => v.startsWith('mongodb+srv://') || 'Invalid MongoDB URI'
    },
    {
      type: 'password',
      name: 'telegramBotToken',
      message: 'Telegram Bot Token:',
      validate: (v) => /^\d+:.+/.test(v) || 'Invalid bot token'
    },
    {
      type: 'text',
      name: 'cloudinaryCloudName',
      message: 'Cloudinary Cloud Name (optional):',
    },
    // ... more credentials
  ])
}
```

### 4. Deployment Orchestrator

```typescript
class DeploymentOrchestrator {
  async deploy() {
    console.log('🚀 Starting deployment...\n')
    
    // Step 1: Create Vercel projects
    await this.deployToVercel()
    
    // Step 2: Deploy bot to Deno
    await this.deployToDeno()
    
    // Step 3: Setup MongoDB
    await this.setupMongoDB()
    
    // Step 4: Link services
    await this.linkServices()
  }
  
  private async deployToVercel() {
    console.log('📤 Deploying to Vercel...')
    
    // Deploy Frontend
    const frontendUrl = await this.vercelClient.deploy({
      name: `${this.projectName}-frontend`,
      files: await readZip('frontend.zip'),
      env: {
        NEXT_PUBLIC_PAYLOAD_API_URL: '{{CMS_URL}}',
        // ... other env vars
      }
    })
    
    // Deploy CMS
    const cmsUrl = await this.vercelClient.deploy({
      name: `${this.projectName}-cms`,
      files: await readZip('cms.zip'),
      env: {
        MONGODB_URI: this.credentials.mongodbUri,
        NEXT_PUBLIC_FRONTEND_URL: frontendUrl,
        // ... other env vars
      }
    })
    
    console.log(`✅ Frontend: ${frontendUrl}`)
    console.log(`✅ CMS: ${cmsUrl}`)
  }
  
  private async deployToDeno() {
    console.log('📤 Deploying bot to Deno Deploy...')
    
    const botUrl = await this.denoClient.deploy({
      project: `${this.projectName}-bot`,
      entrypoint: 'bot.js',
      env: {
        TELEGRAM_BOT_TOKEN: this.credentials.telegramBotToken,
        MONGODB_URI: this.credentials.mongodbUri,
        PAYLOAD_API_URL: this.cmsUrl,
        // ... other env vars
      }
    })
    
    console.log(`✅ Bot: ${botUrl}`)
  }
  
  private async setupMongoDB() {
    console.log('📊 Setting up MongoDB...')
    
    const client = new MongoClient(this.credentials.mongodbUri)
    await client.connect()
    
    const db = client.db('curatekids')
    
    // Create indexes
    await db.collection('videos').createIndexes([
      { key: { slug: 1 }, unique: true },
      { key: { category: 1 } },
      { key: { ageRange: 1 } },
      { key: { createdAt: -1 } }
    ])
    
    // Create collections
    await db.createCollection('organizations')
    await db.createCollection('users')
    
    console.log('✅ MongoDB configured')
  }
}
```

## Security Features

### 1. Code Protection

**Obfuscation:**
- JavaScript/TypeScript → Minified + Obfuscated
- Module bundling (single file)
- Dead code elimination
- Variable name mangling

**Tools:**
```bash
# Frontend/CMS (Next.js already does this)
npm run build

# Bot (additional obfuscation)
deno bundle src/main.ts dist/bot.js
npx javascript-obfuscator dist/bot.js --output dist/bot.obfuscated.js
```

### 2. License Verification

**License Key System:**
```typescript
interface License {
  key: string
  customerId: string
  tier: 'starter' | 'pro' | 'enterprise'
  expiresAt: Date
  maxDeployments: number
}

async function verifyLicense(key: string): Promise<boolean> {
  const response = await fetch('https://api.curatekids.com/v1/licenses/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  })
  
  return response.ok
}
```

### 3. Bundle Distribution

**Authenticated CDN:**
```typescript
async function downloadBundles(licenseKey: string) {
  const bundleUrl = `https://releases.curatekids.com/v1.0.0/bundles.tar.gz`
  
  const response = await fetch(bundleUrl, {
    headers: {
      'Authorization': `License ${licenseKey}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to download bundles')
  }
  
  // Extract bundles
  await extractTarGz(await response.arrayBuffer(), './bundles')
}
```

## Deployment Flow

### Phase 1: Initial Setup (Customer)

```bash
# Install CLI
npm install -g @curatekids/deploy

# Run deployment
curatekids-deploy init
```

### Phase 2: Credential Collection

Interactive prompts for:
- ✅ Vercel API Token
- ✅ Deno Deploy Token  
- ✅ MongoDB Atlas URI
- ✅ Telegram Bot Token
- ✅ Cloudinary credentials (optional)
- ✅ YouTube API Key (optional)

### Phase 3: Deployment

Automated steps:
1. Verify license
2. Download pre-built bundles
3. Deploy to Vercel (Frontend + CMS)
4. Deploy to Deno Deploy (Bot)
5. Configure MongoDB
6. Set environment variables
7. Run health checks

### Phase 4: Post-Deployment

```
✅ Deployment Complete!

Your CurateKids instance is live:
  📱 Frontend: https://your-project-frontend.vercel.app
  ⚙️  Admin:    https://your-project-cms.vercel.app/admin
  🤖 Bot:      https://your-project-bot.deno.dev

Next steps:
1. Add bot to Telegram: t.me/YourBotName
2. Login to admin: https://your-project-cms.vercel.app/admin
3. Configure groups

Documentation: https://docs.curatekids.com
Support: support@curatekids.com
```

## Monetization Model

### Pricing Tiers

**Starter - $49/month**
- 1 deployment
- Community support
- Standard features

**Pro - $149/month**
- 3 deployments
- Priority support
- Advanced features
- Custom branding

**Enterprise - Custom**
- Unlimited deployments
- Dedicated support
- White-label
- Custom features

### License Management

**License Server:**
```
https://api.curatekids.com/v1/licenses
  - POST /verify
  - POST /activate
  - GET /deployments
```

## Update Strategy

### Version Updates

**Customer update process:**
```bash
# Check for updates
curatekids-deploy update --check

# Apply update
curatekids-deploy update --apply
```

**Automatic:**
- Download new bundles
- Deploy with zero downtime
- Rollback on failure

## Source Code Protection Checklist

- ✅ Production builds only (no source maps)
- ✅ Bundled single files
- ✅ Obfuscated JavaScript
- ✅ License-gated distribution
- ✅ CDN authentication
- ✅ No Git access needed
- ✅ Encrypted environment variables
- ✅ Read-only deployments

## Tech Stack

### Build System
- esbuild (bundling)
- Terser (minification)
- javascript-obfuscator (obfuscation)

### Distribution
- AWS S3 / Cloudflare R2 (bundle storage)
- CloudFront / Cloudflare CDN
- License API (verification)

### CLI Tool
- Node.js CLI
- Vercel SDK
- Deno Deploy API
- MongoDB Node Driver

## Files Structure

```
@curatekids/deploy/
├── src/
│   ├── index.ts                 # CLI entry
│   ├── orchestrator.ts          # Deployment orchestration
│   ├── vercel-client.ts         # Vercel API
│   ├── deno-client.ts           # Deno Deploy API
│   ├── mongodb-setup.ts         # DB setup
│   └── license.ts               # License verification
├── package.json
└── README.md

releases/
├── v1.0.0/
│   ├── frontend.zip             # Pre-built Next.js
│   ├── cms.zip                  # Pre-built PayloadCMS
│   ├── bot.js                   # Bundled Deno bot
│   └── schema.json              # DB schema
└── latest.json                  # Version manifest
```

## Next Steps

1. **Build the CLI tool** (`@curatekids/deploy`)
2. **Set up build pipeline** (automate bundling)
3. **Create license system** (API + database)
4. **Set up CDN** (S3 + CloudFront)
5. **Test deployment** (end-to-end)
6. **Create documentation** (customer onboarding)
7. **Launch marketplace** (Gumroad/Stripe)

---

**Result:** Customers deploy CurateKids to their own infrastructure in minutes, without ever seeing your source code.
