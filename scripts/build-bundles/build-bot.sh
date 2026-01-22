#!/bin/bash

# Build Bot Bundle
# Creates a single-file Deno executable without source code

set -e

echo "🏗️  Building Bot Bundle..."

# Configuration
BOT_DIR="../../curatekids-bot"
OUTPUT_DIR="./output/bot"
BUNDLE_NAME="bot.js"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$OUTPUT_DIR"
rm -f "$BUNDLE_NAME"
mkdir -p "$OUTPUT_DIR"

# Bundle Deno code into single file
echo "📦 Bundling Deno code..."
cd "$BOT_DIR"
deno  bundle src/main.ts "../curatekids/scripts/build-bundles/$OUTPUT_DIR/bot.bundle.js"
cd -

# Minify the bundle
echo "🔒 Minifying code..."
npx terser "$OUTPUT_DIR/bot.bundle.js" \
  --compress \
  --mangle \
  --output "$OUTPUT_DIR/bot.min.js"

# Obfuscate (optional - adds extra protection)
echo "🔐 Obfuscating code..."
npx javascript-obfuscator "$OUTPUT_DIR/bot.min.js" \
  --output "$BUNDLE_NAME" \
  --compact true \
  --control-flow-flattening false \
  --dead-code-injection false \
  --debug-protection false \
  --disable-console-output false \
  --identifier-names-generator hexadecimal \
  --log false \
  --rename-globals false \
  --self-defending false \
  --string-array true \
  --string-array-rotate true \
  --string-array-shuffle true \
  --string-array-encoding rc4 \
  --string-array-threshold 0.75 \
  --unicode-escape-sequence false

# Clean up intermediate files
rm "$OUTPUT_DIR/bot.bundle.js"
rm "$OUTPUT_DIR/bot.min.js"

# Generate checksum
echo "🔐 Generating checksum..."
CHECKSUM=$(shasum -a 256 "$BUNDLE_NAME" | awk '{print $1}')

# Output info
BUNDLE_SIZE=$(du -h "$BUNDLE_NAME" | cut -f1)
echo ""
echo "✅ Bot bundle created successfully!"
echo "📦 File: $BUNDLE_NAME"
echo "📏 Size: $BUNDLE_SIZE"
echo "🔐 SHA256: $CHECKSUM"
echo ""

# Create README
cat > "$OUTPUT_DIR/README.md" << 'EOF'
# CuratedReels Bot

Pre-built Telegram bot (Deno runtime).
Source code is not included.

## Deployment

Deploy to Deno Deploy.

### Environment Variables Required:
- `TELEGRAM_BOT_TOKEN` - Bot token from BotFather
- `MONGODB_URI` - MongoDB connection string
- `PAYLOAD_API_URL` - CMS API URL
- `FRONTEND_URL` - Frontend URL
- `CLOUDINARY_*` - Cloudinary credentials (optional)
- `YOUTUBE_API_KEY` - YouTube API key (optional)

### Local Testing:
```bash
deno run --allow-net --allow-env bot.js
```

License: Proprietary
EOF

# Save metadata
cat > "bot-bundle-metadata.json" << EOF
{
  "name": "bot",
  "version": "1.0.0",
  "file": "$BUNDLE_NAME",
  "size": "$BUNDLE_SIZE",
  "checksum": "$CHECKSUM",
  "runtime": "deno",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "📋 Metadata saved to bot-bundle-metadata.json"
