#!/bin/bash

# Build All Bundles
# Creates production-ready bundles for Frontend, CMS, and Bot

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

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required"
    exit 1
fi

# Check Deno
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is required"
    exit 1
fi

# Check terser
if ! npm list -g terser &> /dev/null; then
    echo "📦 Installing terser globally..."
    npm install -g terser
fi

# Check javascript-obfuscator
if ! npm list -g javascript-obfuscator &> /dev/null; then
    echo "📦 Installing javascript-obfuscator globally..."
    npm install -g javascript-obfuscator
fi

echo "✅ All requirements met"
echo ""

# Parse arguments
VERSION=${1:-"1.0.0"}
echo "📌 Building version: $VERSION"
echo ""

# Track start time
START_TIME=$(date +%s)

# Build frontend
echo "1️⃣  Building Frontend..."
bash ./build-frontend.sh
echo ""

# Build CMS
echo "2️⃣  Building CMS..."
bash ./build-cms.sh
echo ""

# Build bot
echo "3️⃣  Building Bot..."
bash ./build-bot.sh
echo ""

# Create release package
echo "📦 Creating release package..."
RELEASE_DIR="./releases/v$VERSION"
mkdir -p "$RELEASE_DIR"

# Copy bundles
cp frontend.zip "$RELEASE_DIR/"
cp cms.zip "$RELEASE_DIR/"
cp bot.js "$RELEASE_DIR/"

# Copy schema
cp ../../packages/deploy-cli/schema.json "$RELEASE_DIR/"

# Generate manifest
FRONTEND_CHECKSUM=$(shasum -a 256 frontend.zip | awk '{print $1}')
CMS_CHECKSUM=$(shasum -a 256 cms.zip | awk '{print $1}')
BOT_CHECKSUM=$(shasum -a 256 bot.js | awk '{print $1}')
SCHEMA_CHECKSUM=$(shasum -a 256 "$RELEASE_DIR/schema.json" | awk '{print $1}')

cat > "$RELEASE_DIR/manifest.json" << EOF
{
  "version": "$VERSION",
  "releaseDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "bundles": {
    "frontend": "frontend.zip",
    "cms": "cms.zip",
    "bot": "bot.js",
    "schema": "schema.json"
  },
  "checksums": {
    "frontend": "$FRONTEND_CHECKSUM",
    "cms": "$CMS_CHECKSUM",
    "bot": "$BOT_CHECKSUM",
    "schema": "$SCHEMA_CHECKSUM"
  },
  "requirements": {
    "node": ">=18.0.0",
    "deno": ">=1.40.0"
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
echo "📏 Total Size: $TOTAL_SIZE"
echo "🗜️  Archive Size: $ARCHIVE_SIZE"
echo "⏱️  Duration: ${DURATION}s"
echo ""
echo "📂 Release Location:"
echo "   $RELEASE_DIR/"
echo ""
echo "📋 Files Created:"
echo "   ✓ frontend.zip ($FRONTEND_CHECKSUM)"
echo "   ✓ cms.zip ($CMS_CHECKSUM)"
echo "   ✓ bot.js ($BOT_CHECKSUM)"
echo "   ✓ schema.json ($SCHEMA_CHECKSUM)"
echo "   ✓ manifest.json"
echo "   ✓ curatedreels-v$VERSION.tar.gz"
echo ""
echo "🚀 Next Steps:"
echo "   1. Upload to CDN: ./upload-to-cdn.sh v$VERSION"
echo "   2. Test deployment with CLI"
echo "   3. Update version in deploy-cli/package.json"
echo ""
