#!/bin/bash

# Build Unified App Bundle
# Creates a production-ready Next.js build with PayloadCMS + Frontend routes

set -e

echo "🏗️  Building Unified App Bundle..."

# Configuration
APP_DIR=".."
OUTPUT_DIR="./output/app"
BUNDLE_NAME="app.zip"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$OUTPUT_DIR"
rm -f "$BUNDLE_NAME"
mkdir -p "$OUTPUT_DIR"

# Build Next.js + PayloadCMS
echo "📦 Building Next.js + PayloadCMS + Frontend..."
cd "$APP_DIR"
pnpm run build

# Copy necessary files
echo "📋 Copying build artifacts..."
cd scripts/build-bundles
cp -r "$APP_DIR/.next" "$OUTPUT_DIR/.next"
cp -r "$APP_DIR/public" "$OUTPUT_DIR/public"
cp "$APP_DIR/next.config.mjs" "$OUTPUT_DIR/next.config.mjs"
cp "$APP_DIR/payload.config.ts" "$OUTPUT_DIR/payload.config.ts"

# Copy payload-cms directory (compiled collections, plugins)
cp -r "$APP_DIR/payload-cms" "$OUTPUT_DIR/payload-cms"

# Copy components (needed for client components)
echo "📋 Copying components..."
mkdir -p "$OUTPUT_DIR/components"
cp -r "$APP_DIR/components/"* "$OUTPUT_DIR/components/"

# Copy lib and utils
mkdir -p "$OUTPUT_DIR/lib"
mkdir -p "$OUTPUT_DIR/utils"
cp -r "$APP_DIR/lib/"* "$OUTPUT_DIR/lib/" 2>/dev/null || true
cp -r "$APP_DIR/utils/"* "$OUTPUT_DIR/utils/" 2>/dev/null || true

# Copy middleware if exists
cp "$APP_DIR/middleware.ts" "$OUTPUT_DIR/middleware.ts" 2>/dev/null || true

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
  "name": "curatedreels-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "next start",
    "payload": "payload"
  },
  "dependencies": {
    "@builder.io/partytown": "0.10.2",
    "@payloadcms/db-mongodb": "3.72.0",
    "@payloadcms/email-nodemailer": "^3.72.0",
    "@payloadcms/next": "3.73.0",
    "@payloadcms/richtext-lexical": "3.72.0",
    "@radix-ui/react-slot": "^1.2.4",
    "@tailwindcss/postcss": "^4.1.18",
    "@tanstack/react-virtual": "^3.13.18",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "graphql": "^16.12.0",
    "lucide-react": "^0.562.0",
    "next": "16.1.4",
    "next-themes": "^0.4.6",
    "payload": "3.72.0",
    "postcss": "^8.5.6",
    "react": "^19.0.0",
    "react-dom": "^19.1",
    "sharp": "^0.32.6",
    "tailwind-merge": "^3.4.0",
    "tailwindcss": "^4.1.18",
    "tw-animate-css": "^1.4.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create README
cat > "$OUTPUT_DIR/README.md" << 'EOF'
# CuratedReels Unified App

Pre-built Next.js application with PayloadCMS and Frontend.
Source code is not included.

## What's Included

- ✅ PayloadCMS Admin Panel (`/admin`)
- ✅ Frontend Pages (`/`, `/login`, `/pricing`, `/business`)
- ✅ Telegram Bot Integration
- ✅ Video Gallery
- ✅ Authentication & Authorization

## Deployment

Deploy to Vercel or any Next.js host with MongoDB.

### Environment Variables Required:

**Database:**
- `MONGODB_URI` - MongoDB connection string

**Telegram:**
- `TELEGRAM_BOT_TOKEN` - Telegram bot token

**URLs:**
- `NEXT_PUBLIC_FRONTEND_URL` - Your app URL (e.g., https://yourapp.vercel.app)
- `PAYLOAD_PUBLIC_SERVER_URL` - Same as NEXT_PUBLIC_FRONTEND_URL

**Optional:**
- `NEXT_PUBLIC_REQUIRE_LOGIN` - Set to "true" to require login for video gallery
- `CLOUDINARY_*` - Cloudinary credentials (for media storage)
- `YOUTUBE_API_KEY` - YouTube API key

### Start Server:
```bash
npm install
npm start
```

### Access:
- Frontend: http://localhost:3001
- Admin Panel: http://localhost:3001/admin

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
echo "✅ Unified app bundle created successfully!"
echo "📦 File: $BUNDLE_NAME"
echo "📏 Size: $BUNDLE_SIZE"
echo "🔐 SHA256: $CHECKSUM"
echo ""

# Save metadata
cat > "app-bundle-metadata.json" << EOF
{
  "name": "app",
  "version": "1.0.0",
  "file": "$BUNDLE_NAME",
  "size": "$BUNDLE_SIZE",
  "checksum": "$CHECKSUM",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "📋 Metadata saved to app-bundle-metadata.json"
