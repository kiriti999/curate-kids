#!/bin/bash

# Build CMS Bundle
# Creates a production-ready PayloadCMS build without source code

set -e

echo "🏗️  Building CMS Bundle..."

# Configuration
CMS_DIR=".."
OUTPUT_DIR="./output/cms"
BUNDLE_NAME="cms.zip"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$OUTPUT_DIR"
rm -f "$BUNDLE_NAME"
mkdir -p "$OUTPUT_DIR"

# Build Next.js + PayloadCMS
echo "📦 Building Next.js + PayloadCMS..."
cd "$CMS_DIR"
npm run build

# Copy necessary files
echo "📋 Copying build artifacts..."
cd scripts/build-bundles
cp -r "$CMS_DIR/.next" "$OUTPUT_DIR/.next"
cp -r "$CMS_DIR/public" "$OUTPUT_DIR/public"
cp "$CMS_DIR/next.config.mjs" "$OUTPUT_DIR/next.config.mjs"
cp "$CMS_DIR/payload.config.ts" "$OUTPUT_DIR/payload.config.ts"

# Copy payload-cms directory (compiled collections, plugins)
cp -r "$CMS_DIR/payload-cms" "$OUTPUT_DIR/payload-cms"

# Remove TypeScript source files (keep only .js)
echo "🔒 Removing TypeScript source..."
find "$OUTPUT_DIR/payload-cms" -name "*.ts" -delete
find "$OUTPUT_DIR/payload-cms" -name "*.tsx" -delete

# Remove source maps
echo "🔒 Removing source maps..."
find "$OUTPUT_DIR/.next" -name "*.map" -delete

# Create package.json with only dependencies
echo "📝 Creating production package.json..."
cat > "$OUTPUT_DIR/package.json" << 'EOF'
{
  "name": "curatekids-cms",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "next start",
    "payload": "payload"
  },
  "dependencies": {
    "next": "^15.5.9",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "payload": "^3.15.0",
    "@payloadcms/next": "^3.15.0",
    "@payloadcms/richtext-lexical": "^3.15.0",
    "mongodb": "^6.10.0",
    "sharp": "^0.32.6"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create README
cat > "$OUTPUT_DIR/README.md" << 'EOF'
# CuratedReels CMS

Pre-built PayloadCMS application.
Source code is not included.

## Deployment

Deploy to Vercel or any Next.js host with MongoDB.

### Environment Variables Required:
- `MONGODB_URI` - MongoDB connection string
- `NEXT_PUBLIC_FRONTEND_URL` - Frontend URL
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `CLOUDINARY_*` - Cloudinary credentials (optional)
- `YOUTUBE_API_KEY` - YouTube API key (optional)

### Start Server:
```bash
npm install
npm start
```

### Access Admin:
http://localhost:3000/admin

License: Proprietary
EOF

# Create zip bundle
echo "🗜️  Creating bundle..."
cd "$OUTPUT_DIR"
zip -r "../../$BUNDLE_NAME" .
cd -

# Generate checksum
echo "🔐 Generating checksum..."
CHECKSUM=$(shasum -a 256 "$BUNDLE_NAME" | awk '{print $1}')

# Output info
BUNDLE_SIZE=$(du -h "$BUNDLE_NAME" | cut -f1)
echo ""
echo "✅ CMS bundle created successfully!"
echo "📦 File: $BUNDLE_NAME"
echo "📏 Size: $BUNDLE_SIZE"
echo "🔐 SHA256: $CHECKSUM"
echo ""

# Save metadata
cat > "cms-bundle-metadata.json" << EOF
{
  "name": "cms",
  "version": "1.0.0",
  "file": "$BUNDLE_NAME",
  "size": "$BUNDLE_SIZE",
  "checksum": "$CHECKSUM",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "📋 Metadata saved to cms-bundle-metadata.json"
