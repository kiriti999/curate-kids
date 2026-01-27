# Pre-Release Checklist v1.0.15

**Target Release:** v1.0.15 (Unified Architecture)  
**Date:** 2026-01-27

---

## ✅ Code Changes (Completed)

- [x] Merged frontend into CMS app
- [x] Added middleware for server-side auth
- [x] Created `/admin-login` page
- [x] Created `/api/auth/login` endpoint
- [x] Added logout button to Header
- [x] Updated all route imports
- [x] Removed duplicate routes
- [x] Marked frontend directory as deprecated

---

## ✅ Build & Release Infrastructure (Completed)

- [x] Updated `create-release.sh` for unified architecture
- [x] Updated `build-all.sh` for app.zip
- [x] Created `build-app.sh` script
- [x] Updated BundleManifest TypeScript types
- [x] Created migration documentation

---

## 📋 Pre-Release Tasks (TODO)

### 1. Testing

- [ ] **Test local build:**
  ```bash
  pnpm run build
  # Should complete without errors
  ```

- [ ] **Test release bundle creation:**
  ```bash
  ./scripts/create-release.sh v1.0.15-test
  # Check release-bundles/ for:
  #   - app.tar.gz
  #   - bot.tar.gz
  #   - schema.json
  #   - manifest.json (architecture: "unified")
  ```

- [ ] **Verify bundle contents:**
  ```bash
  cd release-bundles
  tar -tzf app.tar.gz | head -20
  # Should include:
  #   - app/ directory
  #   - components/
  #   - middleware.ts
  #   - payload-cms/
  ```

### 2. Git Preparation

- [ ] **Commit all changes:**
  ```bash
  git status
  git add .
  git commit -m "v1.0.15: Unified architecture - merged frontend and CMS"
  ```

- [ ] **Push to GitHub:**
  ```bash
  git push origin main
  ```

- [ ] **Verify GitHub status:**
  - All files pushed
  - No pending changes
  - CI/CD passing (if applicable)

### 3. NPM Preparation

- [ ] **Check npm login:**
  ```bash
  npm whoami
  # Should show your npm username
  ```

- [ ] **If not logged in:**
  ```bash
  npm login
  ```

### 4. GitHub CLI Preparation

- [ ] **Check gh auth:**
  ```bash
  gh auth status
  # Should show: Logged in to github.com
  ```

- [ ] **If not authenticated:**
  ```bash
  gh auth login
  ```

- [ ] **Verify token has permissions:**
  - repo (all)
  - write:packages

### 5. Environment Check

- [ ] **Node version:**
  ```bash
  node --version
  # Should be >= 18.0.0
  ```

- [ ] **pnpm installed:**
  ```bash
  pnpm --version
  ```

- [ ] **Dependencies installed:**
  ```bash
  pnpm install
  ```

---

## 🚀 Release Process

Once all above items are checked:

```bash
# Start the release
pnpm run release

# This will:
# 1. Build app.tar.gz + bot.tar.gz
# 2. Create GitHub release v1.0.15
# 3. Update deploy-cli to v1.0.15
# 4. Publish to npm
# 5. Commit and push changes
```

---

## ⚠️ Important Notes

### Breaking Changes in v1.0.15:

1. **Single app deployment** (not frontend + CMS)
2. **Environment variables simplified** (all URLs same domain)
3. **Manifest format changed** (includes "architecture" field)

### Deploy CLI Updates Needed:

The deploy CLI will need updates to:
- [ ] Download `app.tar.gz` instead of `frontend.tar.gz` + `cms.tar.gz`
- [ ] Deploy to single Vercel project
- [ ] Handle both unified and legacy manifests (backward compatibility)

**Note:** These updates can be done in a separate PR after v1.0.15 release.

---

## 📊 Post-Release Verification

After `pnpm run release` completes:

### 1. GitHub Release

- [ ] Visit: https://github.com/kiriti999/curate-kids/releases/tag/v1.0.15
- [ ] Verify files uploaded:
  - app.tar.gz
  - bot.tar.gz
  - schema.json
  - manifest.json
- [ ] Download and inspect manifest.json
- [ ] Verify "architecture": "unified"

### 2. NPM Package

- [ ] Visit: https://www.npmjs.com/package/@curatedreels/deploy
- [ ] Verify version 1.0.15 published
- [ ] Check package.json version
- [ ] Test installation:
  ```bash
  npx @curatedreels/deploy@1.0.15 --version
  ```

### 3. Git Repository

- [ ] Check commits pushed
- [ ] Verify version bump in:
  - packages/deploy-cli/package.json
  - packages/deploy-cli/src/services/bundles.ts
- [ ] Tag created: v1.0.15

---

## 🔄 Rollback Plan

If critical issues found after release:

### Option 1: Quick Fix
1. Fix the issue
2. Release v1.0.16 with fix
3. Mark v1.0.15 as deprecated

### Option 2: Rollback
1. Delete GitHub release v1.0.15
2. Unpublish npm package (if within 72 hours)
   ```bash
   npm unpublish @curatedreels/deploy@1.0.15
   ```
3. Revert commits
4. Release v1.0.14 again

### Option 3: Beta Release
1. Keep v1.0.15 but mark as beta
2. Recommend users stay on v1.0.14
3. Fix issues in v1.0.16

---

## 📝 Release Notes Template

For GitHub release description:

```markdown
# CuratedReels v1.0.15 - Unified Architecture

## 🎉 Major Improvement

Merged Frontend and CMS into a single unified application!

## ✨ What's New

- **Single App Deployment**: No more separate frontend and CMS deployments
- **Server-Side Auth**: Added middleware for proper authentication
- **Custom Admin Login**: New `/admin-login` page for Telegram linking
- **Logout Functionality**: Added logout button to header

## 🔧 What Changed

- Combined `frontend.zip` and `cms.zip` into single `app.zip`
- All routes now in one application
- Simplified environment variables (single domain)
- Fixed cross-domain authentication issues

## 📦 Bundles

- `app.tar.gz` - Unified application (Frontend + CMS)
- `bot.tar.gz` - Telegram bot
- `schema.json` - Database schema

## 🚀 Migration

For existing deployments:
1. Download new `app.tar.gz`
2. Deploy to single Vercel project (remove old frontend deployment)
3. Update environment variables (all URLs → same domain)

See: [Migration Guide](../docs/DEPLOYMENT_ARCHITECTURE_UPDATE.md)

## ⚠️ Breaking Changes

- Deploy CLI will need updates to handle unified architecture
- Environment variable structure simplified
- Two deployments → One deployment

## 🐛 Bug Fixes

- Fixed cross-domain cookie issues
- Fixed Telegram account linking
- Fixed login gate not working server-side

## 📚 Documentation

- [Deployment Architecture Update](../docs/DEPLOYMENT_ARCHITECTURE_UPDATE.md)
- [Migration Checklist](../docs/MIGRATION_CHECKLIST.md)
- [Session Summary](../docs/SESSION_SUMMARY_2026-01-27.md)
```

---

## ✅ Ready Checklist

Before running `pnpm run release`:

- [ ] All code changes committed and pushed
- [ ] Local build passes
- [ ] Test bundle creation works
- [ ] npm logged in
- [ ] gh authenticated
- [ ] All dependencies installed
- [ ] No uncommitted changes
- [ ] Reviewed release notes
- [ ] Team notified (if applicable)

---

**When all items checked, run:**
```bash
pnpm run release
```

**Status:** 🟡 Ready for testing, then release

