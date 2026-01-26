#!/bin/bash
# Create GitHub Release with deployment bundles
# Usage: ./scripts/create-release.sh v1.0.0
#
# Creates SOURCE-ONLY bundles for Vercel API deployment
# Vercel builds the app from source (10MB API limit)

set -e

VERSION=${1:-"v1.0.0"}
RELEASE_DIR="./release-bundles"
STAGING_DIR="./release-staging"

echo "📦 Creating release bundles for $VERSION"

# Clean up previous release
rm -rf "$RELEASE_DIR" "$STAGING_DIR"
mkdir -p "$RELEASE_DIR" "$STAGING_DIR/cms" "$STAGING_DIR/frontend"

# --- CMS Bundle (source only) ---
echo "📦 Packaging CMS source bundle..."

# Copy only source files needed for Vercel build
cp package.json "$STAGING_DIR/cms/"
cp pnpm-lock.yaml "$STAGING_DIR/cms/" 2>/dev/null || true
cp next.config.mjs "$STAGING_DIR/cms/"
cp payload.config.ts "$STAGING_DIR/cms/"
cp tsconfig.json "$STAGING_DIR/cms/"
cp postcss.config.mjs "$STAGING_DIR/cms/" 2>/dev/null || true
cp .npmrc "$STAGING_DIR/cms/" 2>/dev/null || true
cp vercel.json "$STAGING_DIR/cms/" 2>/dev/null || true
cp tailwind.config.ts "$STAGING_DIR/cms/" 2>/dev/null || true
cp tailwind.config.js "$STAGING_DIR/cms/" 2>/dev/null || true

# Copy source directories
[ -d "app" ] && cp -r app "$STAGING_DIR/cms/"
[ -d "components" ] && cp -r components "$STAGING_DIR/cms/"
[ -d "lib" ] && cp -r lib "$STAGING_DIR/cms/"
[ -d "utils" ] && cp -r utils "$STAGING_DIR/cms/"
[ -d "types" ] && cp -r types "$STAGING_DIR/cms/"
[ -d "config" ] && cp -r config "$STAGING_DIR/cms/"
[ -d "public" ] && cp -r public "$STAGING_DIR/cms/"
[ -d "static" ] && cp -r static "$STAGING_DIR/cms/"
[ -d "payload-cms" ] && cp -r payload-cms "$STAGING_DIR/cms/"

# Remove any .next or node_modules that might have been copied
rm -rf "$STAGING_DIR/cms/.next" "$STAGING_DIR/cms/node_modules"

# Create CMS tarball (exclude macOS resource fork files)
export COPYFILE_DISABLE=1
(cd "$STAGING_DIR/cms" && tar --exclude='._*' -czf "../../$RELEASE_DIR/cms.tar.gz" .)

# --- Frontend Bundle (same source for now) ---
echo "📋 Creating frontend bundle..."
cp "$RELEASE_DIR/cms.tar.gz" "$RELEASE_DIR/frontend.tar.gz"

# Cleanup staging
rm -rf "$STAGING_DIR"

# Copy bot bundle (entire Deno project)
echo "📋 Packaging bot..."
BOT_SOURCE_DIR="${BOT_SOURCE_DIR:-../curatedreels-bot}"
if [ -d "$BOT_SOURCE_DIR/src" ]; then
    mkdir -p "$STAGING_DIR/bot"
    # Copy bot source files
    cp -r "$BOT_SOURCE_DIR/src" "$STAGING_DIR/bot/"
    cp "$BOT_SOURCE_DIR/deno.json" "$STAGING_DIR/bot/"
    cp "$BOT_SOURCE_DIR/deno.lock" "$STAGING_DIR/bot/" 2>/dev/null || true
    
    # Create bot tarball
    COPYFILE_DISABLE=1 tar -czf "$RELEASE_DIR/bot.tar.gz" -C "$STAGING_DIR/bot" --exclude='._*' .
    rm -rf "$STAGING_DIR/bot"
    echo "✅ Bot bundle created from $BOT_SOURCE_DIR"
else
    # Fallback: create minimal bot placeholder
    echo "⚠️  Bot source not found at $BOT_SOURCE_DIR, creating placeholder"
    mkdir -p "$STAGING_DIR/bot/src"
    cat > "$STAGING_DIR/bot/src/main.ts" << 'BOTEOF'
Deno.serve((req) => {
  const url = new URL(req.url);
  if (url.pathname === "/" || url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok", bot: "CuratedReels" }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response("Not Found", { status: 404 });
});
BOTEOF
    cat > "$STAGING_DIR/bot/deno.json" << 'DENOEOF'
{"name": "curatedreels-bot", "version": "1.0.0", "exports": "./src/main.ts"}
DENOEOF
    COPYFILE_DISABLE=1 tar -czf "$RELEASE_DIR/bot.tar.gz" -C "$STAGING_DIR/bot" --exclude='._*' .
    rm -rf "$STAGING_DIR/bot"
fi

# Create database schema
echo "📋 Creating schema..."
cat > "$RELEASE_DIR/schema.json" << 'EOF'
{
  "version": "1.0.0",
  "collections": [
    {
      "name": "users",
      "indexes": [
        { "key": { "email": 1 }, "unique": true, "name": "email_1" }
      ]
    },
    {
      "name": "videos",
      "indexes": [
        { "key": { "slug": 1 }, "unique": true, "name": "slug_1" },
        { "key": { "category": 1 }, "name": "category_1" },
        { "key": { "ageRange": 1 }, "name": "ageRange_1" }
      ]
    },
    {
      "name": "categories",
      "indexes": [
        { "key": { "slug": 1 }, "unique": true, "name": "slug_1" }
      ]
    },
    {
      "name": "organizations",
      "indexes": [
        { "key": { "slug": 1 }, "unique": true, "name": "slug_1" }
      ]
    }
  ]
}
EOF

# Create manifest
echo "📋 Creating manifest..."
cat > "$RELEASE_DIR/manifest.json" << EOF
{
  "version": "${VERSION#v}",
  "releaseDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "bundles": {
    "frontend": "frontend.tar.gz",
    "cms": "cms.tar.gz",
    "bot": "bot.tar.gz",
    "schema": "schema.json"
  }
}
EOF

echo ""
echo "✅ Release bundles created in $RELEASE_DIR/"
echo ""
echo "Files:"
ls -lh "$RELEASE_DIR/"
echo ""
