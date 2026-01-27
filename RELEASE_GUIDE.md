# Release Guide

## Automated Release Process

When you make changes and want to publish a new version, just run:

```bash
npm run release
```

This single command will:
1. ✅ Auto-increment version (patch: 1.0.14 → 1.0.15)
2. ✅ Build deployment bundles (bot, cms, frontend)
3. ✅ Create GitHub release with all bundles
4. ✅ Update deploy-cli to use new bundles version
5. ✅ Publish deploy-cli to npm
6. ✅ Commit and push changes to GitHub

## Release Commands

```bash
# Patch release (1.0.14 → 1.0.15) - bug fixes
npm run release

# Minor release (1.0.14 → 1.1.0) - new features
npm run release:minor

# Major release (1.0.14 → 2.0.0) - breaking changes
npm run release:major

# Specific version
npm run release:version 1.2.3
```

## What Gets Published

### GitHub Release (v1.0.X)
- `bot.tar.gz` - Telegram bot source code
- `cms.tar.gz` - PayloadCMS source code
- `frontend.tar.gz` - Next.js frontend source code
- `manifest.json` - Deployment manifest
- `schema.json` - MongoDB schema

### NPM Package
- `curatedreels-deploy@1.0.X` - Deployment CLI

## Manual Steps (if needed)

If the automated script fails or you need manual control:

### 1. Build Bundles
```bash
BOT_SOURCE_DIR=/Users/arjun/curatekids-bot ./scripts/create-release.sh 1.0.15
```

### 2. Create GitHub Release
```bash
gh release create v1.0.15 release-bundles/* \
  --title "Release v1.0.15" \
  --notes "Description of changes"
```

### 3. Update Deploy CLI
```bash
cd packages/deploy-cli

# Update version
npm version 1.0.15 --no-git-tag-version

# Update bundle version in src/services/bundles.ts
# Change: const BUNDLES_VERSION = '1.0.15'

# Build and publish
npm run build
npm publish --access public
```

### 4. Commit Changes
```bash
git add packages/deploy-cli/
git commit -m "Release v1.0.15"
git push
```

## Prerequisites

- ✅ Logged in to npm (`npm login`)
- ✅ GitHub token configured (`gh auth login`)
- ✅ Bot source at `./bot` (moved from external directory)

## Example Workflow

1. Make changes to bot/cms/frontend code
2. Test changes locally
3. Run `npm run release`
4. Deploy with new version:
   ```bash
   GITHUB_TOKEN=$(gh auth token) npx curatedreels-deploy@latest
   ```

## Troubleshooting

### "Not logged in to npm"
```bash
npm login
```

### "GitHub token not found"
```bash
gh auth login
```

### "Bot source not found"
Bot is now part of the main repository at `./bot`. If you moved it elsewhere:
```bash
BOT_SOURCE_DIR=/path/to/bot npm run release
```

### Script fails during npm publish
The script will:
- Show what failed
- Leave you in a clean state
- You can re-run or do manual steps

### Need to rollback a release
```bash
# Delete GitHub release
gh release delete v1.0.15 -y

# Unpublish npm package (within 72 hours)
npm unpublish curatedreels-deploy@1.0.15

# Revert version in package.json
cd packages/deploy-cli
npm version 1.0.14 --no-git-tag-version
```
