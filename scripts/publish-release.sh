#!/bin/bash
# Automated Release Script for CuratedReels
# 
# Usage: ./scripts/publish-release.sh [version] [type]
#   version: semver version (e.g., 1.0.15) or "auto" to auto-increment
#   type: patch|minor|major (only used if version is "auto")
#
# Examples:
#   ./scripts/publish-release.sh 1.0.15           # Specific version
#   ./scripts/publish-release.sh auto patch       # Auto-increment patch (1.0.14 -> 1.0.15)
#   ./scripts/publish-release.sh auto minor       # Auto-increment minor (1.0.14 -> 1.1.0)
#
# What it does:
#   1. Builds deployment bundles (bot, cms, frontend)
#   2. Creates GitHub release with bundles
#   3. Updates deploy-cli package.json with new version
#   4. Publishes deploy-cli to npm
#   5. Commits and pushes changes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="kiriti999/curate-kids"
DEPLOY_CLI_DIR="./packages/deploy-cli"
BOT_SOURCE_DIR="${BOT_SOURCE_DIR:-./bot}"

echo -e "${BLUE}🚀 CuratedReels Automated Release Script${NC}\n"

# Parse arguments
VERSION_ARG="${1:-auto}"
VERSION_TYPE="${2:-patch}"

# Get current version from deploy-cli package.json
CURRENT_VERSION=$(node -p "require('$DEPLOY_CLI_DIR/package.json').version")
echo -e "${BLUE}📌 Current version: ${CURRENT_VERSION}${NC}"

# Determine new version
if [ "$VERSION_ARG" = "auto" ]; then
    echo -e "${YELLOW}🔢 Auto-incrementing version (${VERSION_TYPE})...${NC}"
    cd "$DEPLOY_CLI_DIR"
    npm version "$VERSION_TYPE" --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
    cd - > /dev/null
else
    NEW_VERSION="$VERSION_ARG"
    echo -e "${YELLOW}🔢 Using specified version: ${NEW_VERSION}${NC}"
    # Update deploy-cli version
    cd "$DEPLOY_CLI_DIR"
    npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version
    cd - > /dev/null
fi

echo -e "${GREEN}✅ New version: ${NEW_VERSION}${NC}\n"

# Confirm
read -p "Continue with release v${NEW_VERSION}? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Release cancelled${NC}"
    exit 1
fi

# Step 1: Build bundles
echo -e "\n${BLUE}📦 Step 1: Building deployment bundles...${NC}"
BOT_SOURCE_DIR="$BOT_SOURCE_DIR" ./scripts/create-release.sh "$NEW_VERSION"

# Step 2: Create GitHub release
echo -e "\n${BLUE}📤 Step 2: Creating GitHub release v${NEW_VERSION}...${NC}"
gh release delete "v${NEW_VERSION}" -y --cleanup-tag 2>/dev/null || true
gh release create "v${NEW_VERSION}" \
    release-bundles/* \
    --title "Release v${NEW_VERSION}" \
    --notes "Automated release v${NEW_VERSION}" \
    --repo "$REPO"

echo -e "${GREEN}✅ GitHub release created${NC}"

# Step 3: Update deploy-cli to point to new bundles version
echo -e "\n${BLUE}🔧 Step 3: Updating deploy-cli bundle version...${NC}"
sed -i.bak "s/const BUNDLES_VERSION = '[^']*'/const BUNDLES_VERSION = '${NEW_VERSION}'/" "$DEPLOY_CLI_DIR/src/services/bundles.ts"
rm -f "$DEPLOY_CLI_DIR/src/services/bundles.ts.bak"

echo -e "${GREEN}✅ Bundle version updated to ${NEW_VERSION}${NC}"

# Step 4: Build deploy-cli
echo -e "\n${BLUE}🏗️  Step 4: Building deploy-cli...${NC}"
cd "$DEPLOY_CLI_DIR"
npm run build
cd - > /dev/null

# Step 5: Publish to npm
echo -e "\n${BLUE}📤 Step 5: Publishing to npm...${NC}"
cd "$DEPLOY_CLI_DIR"

# Check if logged in
if ! npm whoami &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to npm. Running 'npm login'...${NC}"
    npm login
fi

# Publish
npm publish --access public

echo -e "${GREEN}✅ Published curatedreels-deploy@${NEW_VERSION} to npm${NC}"
cd - > /dev/null

# Step 6: Commit and push changes
echo -e "\n${BLUE}📝 Step 6: Committing changes...${NC}"
git add "$DEPLOY_CLI_DIR/package.json" "$DEPLOY_CLI_DIR/src/services/bundles.ts"
git commit -m "Release v${NEW_VERSION}: Update deploy-cli and bundles" || true
git push origin main

echo -e "${GREEN}✅ Changes pushed to GitHub${NC}"

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Release v${NEW_VERSION} completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "📦 GitHub Release: https://github.com/${REPO}/releases/tag/v${NEW_VERSION}"
echo -e "📦 NPM Package:    curatedreels-deploy@${NEW_VERSION}"
echo -e ""
echo -e "${BLUE}To deploy with new version:${NC}"
echo -e "  ${YELLOW}GITHUB_TOKEN=\$(gh auth token) npx curatedreels-deploy@${NEW_VERSION}${NC}"
echo -e ""
