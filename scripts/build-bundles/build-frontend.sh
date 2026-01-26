#!/bin/bash

# Build Frontend Bundle
# Creates a production-ready Next.js build without source code

set -e

echo "🏗️  Building Frontend Bundle..."

# Configuration
FRONTEND_DIR="../frontend"
OUTPUT_DIR="./output/frontend"
BUNDLE_NAME="frontend.zip"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$OUTPUT_DIR"
rm -f "$BUNDLE_NAME"
mkdir -p "$OUTPUT_DIR"

# Build Next.js
echo "📦 Building Next.js..."
cd "$FRONTEND_DIR"
npm run build

# Copy necessary files
echo "📋 Copying build artifacts..."
cd -
cp -r "$FRONTEND_DIR/.next" "$OUTPUT_DIR/.next"
cp -r "$FRONTEND_DIR/public" "$OUTPUT_DIR/public"
cp "$FRONTEND_DIR/package.json" "$OUTPUT_DIR/package.json"
cp "$FRONTEND_DIR/package-lock.json" "$OUTPUT_DIR/package-lock.json" 2>/dev/null || true
cp "$FRONTEND_DIR/next.config.js" "$OUTPUT_DIR/next.config.js" 2>/dev/null || true
cp "$FRONTEND_DIR/next.config.mjs" "$OUTPUT_DIR/next.config.mjs" 2>/dev/null || true

# Remove source maps (hide code)
echo "🔒 Removing source maps..."
find "$OUTPUT_DIR/.next" -name "*.map" -delete

# Create package.json with only dependencies
echo "📝 Creating production package.json..."
cat > "$OUTPUT_DIR/package.json" << 'EOF'
{
  "name": "curatedreels-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.5.9",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create README
cat > "$OUTPUT_DIR/README.md" << 'EOF'
# CuratedReels Frontend

Pre-built Next.js application.
Source code is not included.

## Deployment

This is a production build. Deploy to Vercel or any Next.js host.

### Environment Variables Required:
- `NEXT_PUBLIC_PAYLOAD_API_URL` - URL to CMS API

### Start Development Server:
```bash
npm install
npm start
```

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
echo "✅ Frontend bundle created successfully!"
echo "📦 File: $BUNDLE_NAME"
echo "📏 Size: $BUNDLE_SIZE"
echo "🔐 SHA256: $CHECKSUM"
echo ""

# Save metadata
cat > "frontend-bundle-metadata.json" << EOF
{
  "name": "frontend",
  "version": "1.0.0",
  "file": "$BUNDLE_NAME",
  "size": "$BUNDLE_SIZE",
  "checksum": "$CHECKSUM",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "📋 Metadata saved to frontend-bundle-metadata.json"
