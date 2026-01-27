#!/bin/bash

# Build All Bundles
# Creates production-ready bundles for Unified App and Bot

set -e

echo "🚀 CuratedReels Bundle Builder"
echo "============================"
echo ""

# Check requirements
echo "🔍 Checking requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is required"
    exit 1
fi

# Check Deno
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is required"
    exit 1
fi

echo "✅ All requirements met"
echo ""

# Parse arguments
VERSION=${1:-"1.0.0"}
echo "📌 Building version: $VERSION"
echo ""

# Track start time
START_TIME=$(date +%s)

# Build unified app (frontend + CMS merged)
echo "1️⃣  Building Unified App (Frontend + CMS)..."
bash ./build-app.sh
echo ""

# Build bot
echo "2️⃣  Building Bot..."
bash ./build-bot.sh
echo ""

# Create release package
echo "📦 Creating release package..."
RELEASE_DIR="./releases/v$VERSION"
mkdir -p "$RELEASE_DIR"

# Copy bundles
cp app.zip "$RELEASE_DIR/"
cp bot.js "$RELEASE_DIR/"

# Copy schema
cp ../../packages/deploy-cli/schema.json "$RELEASE_DIR/" 2>/dev/null || echo "⚠️  schema.json not found"

# Generate manifest
APP_CHECKSUM=$(shasum -a 256 app.zip | awk '{print $1}')
BOT_CHECKSUM=$(shasum -a 256 bot.js | awk '{print $1}')
SCHEMA_CHECKSUM=$(shasum -a 256 "$RELEASE_DIR/schema.json" 2>/dev/null | awk '{print $1}' || echo "N/A")

cat > "$RELEASE_DIR/manifest.json" << EOF
{
  "version": "$VERSION",
  "releaseDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "architecture": "unified",
  "bundles": {
    "app": "app.zip",
    "bot": "bot.js",
    "schema": "schema.json"
  },
  "checksums": {
    "app": "$APP_CHECKSUM",
    "bot": "$BOT_CHECKSUM",
    "schema": "$SCHEMA_CHECKSUM"
  },
  "requirements": {
    "node": ">=18.0.0",
    "deno": ">=1.40.0"
  },
  "changes": {
    "v1.0.0": "Merged frontend and CMS into unified app. Single deployment for both admin and user-facing pages."
  }
}
EOF

# Create release archive
echo "🗜️  Creating release archive..."
cd "$RELEASE_DIR"
tar -czf "../curatedreels-v$VERSION.tar.gz" .
cd -

# Calculate total size
TOTAL_SIZE=$(du -sh "$RELEASE_DIR" | cut -f1)
ARCHIVE_SIZE=$(du -h "./releases/curatedreels-v$VERSION.tar.gz" | cut -f1)

# Track end time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Summary
echo ""
echo "============================"
echo "✅ Build Complete!"
echo "============================"
echo ""
echo "📦 Release: v$VERSION"
echo "🏗️  Architecture: Unified App (Frontend + CMS)"
echo "📏 Total Size: $TOTAL_SIZE"
echo "🗜️  Archive Size: $ARCHIVE_SIZE"
echo "⏱️  Duration: ${DURATION}s"
echo ""
echo "📂 Release Location:"
echo "   $RELEASE_DIR/"
echo ""
echo "📋 Files Created:"
echo "   ✓ app.zip ($APP_CHECKSUM)"
echo "   ✓ bot.js ($BOT_CHECKSUM)"
if [ -f "$RELEASE_DIR/schema.json" ]; then
    echo "   ✓ schema.json ($SCHEMA_CHECKSUM)"
fi
echo "   ✓ manifest.json"
echo "   ✓ curatedreels-v$VERSION.tar.gz"
echo ""
echo "⚠️  IMPORTANT CHANGES:"
echo "   • Frontend and CMS are now merged into a single 'app.zip'"
echo "   • Only ONE deployment needed (not two separate deployments)"
echo "   • All routes (/admin, /, /login, etc.) are in one app"
echo ""
echo "🚀 Next Steps:"
echo "   1. Upload to CDN: ./upload-to-cdn.sh v$VERSION"
echo "   2. Update deploy-cli to use new 'app' bundle"
echo "   3. Test deployment with CLI"
echo ""

