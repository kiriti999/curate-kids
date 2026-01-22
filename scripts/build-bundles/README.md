# Build Scripts - CuratedReels White-Label Bundles

Scripts to create production-ready bundles for white-label deployment.

## Overview

These scripts compile and package CuratedReels into distributable bundles that **hide source code** while maintaining functionality.

## Prerequisites

- Node.js >= 18.0.0
- Deno >= 1.40.0
- npm
- AWS CLI (for CDN upload)

## Scripts

### 1. `build-frontend.sh`
Builds the Next.js frontend

**Output:** `frontend.zip` (~5-10 MB)

**Contents:**
- `.next/` - Production build
- `public/` - Static assets
- `package.json` - Dependencies only
- No source code (.tsx, .ts files removed)
- No source maps

### 2. `build-cms.sh`
Builds the PayloadCMS + Next.js backend

**Output:** `cms.zip` (~15-20 MB)

**Contents:**
- `.next/` - Production build
- `payload-cms/` - Compiled collections (no .ts files)
- `package.json` - Dependencies only
- No source code
- No source maps

### 3. `build-bot.sh`
Bundles the Telegram bot into single file

**Output:** `bot.js` (~500 KB)

**Process:**
1. Bundle all Deno code → single file
2. Minify with Terser
3. Obfuscate with javascript-obfuscator

**Protection:**
- String array encoding
- Identifier mangling
- Control flow obfuscation
- Dead code injection (optional)

### 4. `build-all.sh [version]`
Runs all build scripts and creates release

**Usage:**
```bash
./build-all.sh 1.0.0
```

**Output:**
- `releases/v1.0.0/` directory with all bundles
- `manifest.json` with checksums
- `curatekids-v1.0.0.tar.gz` archive

### 5. upload-to-cdn.sh [version]`
Uploads bundles to S3/CloudFront

**Usage:**
```bash
export S3_BUCKET=curatekids-releases
export AWS_REGION=us-east-1
./upload-to-cdn.sh 1.0.0
```

**Uploads:**
- All bundles to `s3://bucket/v1.0.0/`
- Updates `latest.json`
- Sets cache headers
- Invalidates CloudFront (if configured)

## Quick Start

### Build Everything

```bash
# Install prerequisites
npm install -g terser javascript-obfuscator

# Build release
cd scripts/build-bundles
./build-all.sh 1.0.0
```

### Upload to CDN

```bash
# Configure AWS
aws configure

# Set environment
export S3_BUCKET=curatekids-releases
export CDN_URL=https://releases.curatekids.com

# Upload
./upload-to-cdn.sh 1.0.0
```

### Test Bundles

```bash
# Extract and test frontend
unzip releases/v1.0.0/frontend.zip -d test-frontend
cd test-frontend
npm install
npm start
# Visit http://localhost:3000

# Test bot
deno run --allow-net --allow-env releases/v1.0.0/bot.js
```

## Build Output

```
releases/
└── v1.0.0/
    ├── frontend.zip          # Frontend bundle
    ├── cms.zip               # CMS bundle
    ├── bot.js                # Bot bundle
    ├── schema.json           # DB schema
    ├── manifest.json         # Release metadata
    └── curatekids-v1.0.0.tar.gz  # Complete archive
```

## Metadata Files

### manifest.json
```json
{
  "version": "1.0.0",
  "releaseDate": "2026-01-21T00:00:00Z",
  "bundles": {
    "frontend": "frontend.zip",
    "cms": "cms.zip",
    "bot": "bot.js",
    "schema": "schema.json"
  },
  "checksums": {
    "frontend": "sha256...",
    "cms": "sha256...",
    "bot": "sha256...",
    "schema": "sha256..."
  }
}
```

### latest.json (on CDN)
```json
{
  "version": "1.0.0",
  "releaseDate": "2026-01-21T00:00:00Z",
  "downloadUrl": "https://releases.curatekids.com/v1.0.0/curatekids-v1.0.0.tar.gz",
  "manifestUrl": "https://releases.curatekids.com/v1.0.0/manifest.json"
}
```

## Security Features

### Code Protection
- ✅ No source files (.ts, .tsx) in bundles
- ✅ No source maps (.map files)
- ✅ Obfuscated identifiers
- ✅ String encoding
- ✅ Minified code
- ✅ Single-file bot (harder to reverse)

### Distribution Security
- ✅ SHA256 checksums
- ✅ Authenticated CDN downloads (license-gated)
- ✅ Immutable versioned URLs
- ✅ HTTPS only

## Environment Variables

### For build-all.sh
```bash
# None required - builds locally
```

### For upload-to-cdn.sh
```bash
S3_BUCKET=curatekids-releases        # S3 bucket name
AWS_REGION=us-east-1                  # AWS region
CDN_URL=https://releases.curatekids.com  # CDN base URL
CLOUDFRONT_DISTRIBUTION_ID=E1234567   # CloudFront ID (optional)
WEBHOOK_URL=https://...               # Notification webhook (optional)
```

## Troubleshooting

### "deno: command not found"
Install Deno: https://deno.land/

### "terser: command not found"
```bash
npm install -g terser
```

### "javascript-obfuscator: command not found"
```bash
npm install -g javascript-obfuscator
```

### "AWS credentials not configured"
```bash
aws configure
# Enter your AWS Access Key ID and Secret
```

### Build fails for frontend/CMS
```bash
# Make sure dependencies are installed
cd ../frontend && npm install
cd ../curatekids && npm install
```

## Development Workflow

1. **Make code changes** in source repositories
2. **Test locally** with `pnpm dev`
3. **Build bundles** with `./build-all.sh 1.0.1`
4. **Test bundles** locally
5. **Upload to CDN** with `./upload-to-cdn.sh 1.0.1`
6. **Update deploy-cli** to reference new version
7. **Test deployment** with CLI
8. **Publish** deploy-cli to npm

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Build bundles
        run: |
          cd scripts/build-bundles
          ./build-all.sh ${{ github.ref_name }}
      
      - name: Upload to CDN
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd scripts/build-bundles
          ./upload-to-cdn.sh ${{ github.ref_name }}
```

## Artifact Sizes (Approximate)

- `frontend.zip`: 5-10 MB
- `cms.zip`: 15-20 MB
- `bot.js`: 400-600 KB
- `schema.json`: < 10 KB
- **Total**: ~20-30 MB

## Next Steps

After building bundles:
1. Upload to CDN
2. Update deploy-cli with new version
3. Test deployment end-to-end
4. Publish to npm: `npm publish packages/deploy-cli`
5. Customer installs: `npm install -g @curatekids/deploy`

---

**Questions?** See `DEPLOYMENT_ARCHITECTURE.md` for full system design.
