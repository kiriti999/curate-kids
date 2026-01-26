#!/bin/bash

# Upload Bundles to CDN
# Uploads release bundles to S3/R2 for distribution

set -e

# Configuration
VERSION=$1
S3_BUCKET=${S3_BUCKET:-"curatedreels-releases"}
CDN_URL=${CDN_URL:-"https://releases.curatedreels.com"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

if [ -z "$VERSION" ]; then
    echo "❌ Usage: ./upload-to-cdn.sh <version>"
    echo "   Example: ./upload-to-cdn.sh 1.0.0"
    exit 1
fi

echo "☁️  Uploading CuratedReels v$VERSION to CDN"
echo "========================================"
echo ""

# Check if release exists
RELEASE_DIR="./releases/v$VERSION"
if [ ! -d "$RELEASE_DIR" ]; then
    echo "❌ Release v$VERSION not found"
    echo "   Run: ./build-all.sh $VERSION"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is required"
    echo "   Install: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "   Run: aws configure"
    exit 1
fi

echo "📦 Uploading bundles..."

# Upload each file
aws s3 cp "$RELEASE_DIR/frontend.zip" \
    "s3://$S3_BUCKET/v$VERSION/frontend.zip" \
    --region "$AWS_REGION" \
    --content-type "application/zip"

aws s3 cp "$RELEASE_DIR/cms.zip" \
    "s3://$S3_BUCKET/v$VERSION/cms.zip" \
    --region "$AWS_REGION" \
    --content-type "application/zip"

aws s3 cp "$RELEASE_DIR/bot.js" \
    "s3://$S3_BUCKET/v$VERSION/bot.js" \
    --region "$AWS_REGION" \
    --content-type "application/javascript"

aws s3 cp "$RELEASE_DIR/schema.json" \
    "s3://$S3_BUCKET/v$VERSION/schema.json" \
    --region "$AWS_REGION" \
    --content-type "application/json"

aws s3 cp "$RELEASE_DIR/manifest.json" \
    "s3://$S3_BUCKET/v$VERSION/manifest.json" \
    --region "$AWS_REGION" \
    --content-type "application/json"

# Upload archive
aws s3 cp "./releases/curatedreels-v$VERSION.tar.gz" \
    "s3://$S3_BUCKET/v$VERSION/curatedreels-v$VERSION.tar.gz" \
    --region "$AWS_REGION" \
    --content-type "application/gzip"

# Update latest.json
echo "📝 Updating latest.json..."
cat > "./releases/latest.json" << EOF
{
  "version": "$VERSION",
  "releaseDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "downloadUrl": "$CDN_URL/v$VERSION/curatedreels-v$VERSION.tar.gz",
  "manifestUrl": "$CDN_URL/v$VERSION/manifest.json"
}
EOF

aws s3 cp "./releases/latest.json" \
    "s3://$S3_BUCKET/latest.json" \
    --region "$AWS_REGION" \
    --content-type "application/json"

# Set cache headers for versioned files (immutable - cache forever)
echo "🔧 Setting cache headers..."
aws s3api copy-object \
    --copy-source "$S3_BUCKET/v$VERSION/manifest.json" \
    --bucket "$S3_BUCKET" \
    --key "v$VERSION/manifest.json" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata-directive "REPLACE"

# Set cache headers for latest.json (short cache - 5 minutes)
aws s3api copy-object \
    --copy-source "$S3_BUCKET/latest.json" \
    --bucket "$S3_BUCKET" \
    --key "latest.json" \
    --cache-control "public, max-age=300" \
    --metadata-directive "REPLACE"

# Invalidate CloudFront cache (if using CloudFront)
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/latest.json" "/v$VERSION/*"
fi

echo ""
echo "✅ Upload Complete!"
echo ""
echo "📦 Release v$VERSION is now available at:"
echo "   $CDN_URL/v$VERSION/"
echo ""
echo "📋 Files:"
echo "   ✓ $CDN_URL/v$VERSION/frontend.zip"
echo "   ✓ $CDN_URL/v$VERSION/cms.zip"
echo "   ✓ $CDN_URL/v$VERSION/bot.js"
echo "   ✓ $CDN_URL/v$VERSION/schema.json"
echo "   ✓ $CDN_URL/v$VERSION/manifest.json"
echo ""
echo "🔗 Latest release info:"
echo "   $CDN_URL/latest.json"
echo ""
echo "🚀 Next Steps:"
echo "   1. Update deploy-cli to use v$VERSION"
echo "   2. Test deployment with new bundles"
echo "   3. Publish deploy-cli to npm"
echo ""

# Optional: Send webhook notification
if [ -n "$WEBHOOK_URL" ]; then
    echo "📢 Sending webhook notification..."
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"version\": \"$VERSION\", \"releaseDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
fi
