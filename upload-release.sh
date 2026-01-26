#!/bin/bash
# Upload release assets to GitHub
# Run this AFTER creating the release v1.0.7 on GitHub

set -e

REPO="kiriti999/curate-kids"
TAG="v1.0.7"
RELEASE_DIR="./release-bundles"

echo "📦 Uploading release assets to $REPO release $TAG"
echo ""

# Get release ID
RELEASE_ID=$(gh api repos/$REPO/releases/tags/$TAG --jq '.id')

if [ -z "$RELEASE_ID" ]; then
  echo "❌ Release $TAG not found. Please create it first on GitHub."
  echo "   Go to: https://github.com/$REPO/releases/new"
  echo "   Tag: $TAG"
  echo "   Title: CuratedReels v1.0.7"
  echo "   Description: Release v1.0.7 with admin auto-creation during deployment"
  exit 1
fi

echo "✅ Found release ID: $RELEASE_ID"
echo ""

# Upload assets
for file in bot.tar.gz cms.tar.gz frontend.tar.gz manifest.json schema.json; do
  echo "📤 Uploading $file..."
  gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    repos/$REPO/releases/$RELEASE_ID/assets?name=$file \
    --input "$RELEASE_DIR/$file" > /dev/null
  echo "   ✅ Uploaded"
done

echo ""
echo "✅ All assets uploaded successfully!"
echo "🔗 View release: https://github.com/$REPO/releases/tag/$TAG"
