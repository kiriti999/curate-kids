# Migration Checklist: Unified App Architecture

**Version:** 1.0.15  
**Status:** In Progress  
**Date:** 2026-01-27

---

## ✅ Completed

- [x] Merged frontend directory into root app
- [x] Copied all routes to `app/(app)/`
- [x] Copied all components to `components/`
- [x] Updated root layout with AuthProvider
- [x] Created custom `/admin-login` page
- [x] Created `/api/auth/login` endpoint
- [x] Added middleware for server-side auth
- [x] Added logout button to Header
- [x] Marked frontend directory as DEPRECATED
- [x] Created `build-app.sh` script
- [x] Updated `build-all.sh` script
- [x] Updated BundleManifest interface
- [x] Created migration documentation
- [x] Local testing completed

---

## 🔄 In Progress

- [ ] Update deploy-cli to handle unified bundles
- [ ] Test build process end-to-end
- [ ] Update GitHub release workflow

---

## 📋 TODO

### Deploy CLI Updates

- [ ] Update `bundles.ts` download logic:
  - [ ] Check manifest `architecture` field
  - [ ] Download `app.zip` for unified architecture
  - [ ] Fall back to `frontend.zip` + `cms.zip` for legacy

- [ ] Update `vercel.ts` deployment logic:
  - [ ] Deploy single app for unified architecture
  - [ ] Skip frontend deployment if unified
  - [ ] Update environment variable setup

- [ ] Update progress messages:
  - [ ] "Deploying unified app..." instead of "Deploying frontend..."
  - [ ] Remove separate frontend/CMS deployment steps

### Build & Release

- [ ] Test build process:
  ```bash
  cd scripts/build-bundles
  ./build-app.sh
  ```

- [ ] Verify bundle contents:
  - [ ] Check all routes included
  - [ ] Check components included
  - [ ] Check middleware included
  - [ ] Verify package.json dependencies

- [ ] Test full build:
  ```bash
  ./build-all.sh 1.0.15
  ```

- [ ] Update version in `package.json` to 1.0.15

- [ ] Create GitHub release:
  - [ ] Upload `app.zip`
  - [ ] Upload `bot.js`
  - [ ] Upload `manifest.json`
  - [ ] Add release notes about unified architecture

### Documentation

- [ ] Update main README.md:
  - [ ] Mention unified architecture
  - [ ] Update deployment instructions
  - [ ] Add migration guide link

- [ ] Update DEPLOYMENT_ARCHITECTURE.md
- [ ] Update white-label docs
- [ ] Update release guide

### Testing

- [ ] Test deployment with CLI:
  - [ ] Fresh deployment
  - [ ] Verify all routes work
  - [ ] Test authentication flow
  - [ ] Test Telegram linking

- [ ] Test migration from v1.0.14:
  - [ ] Upgrade existing deployment
  - [ ] Verify data preserved
  - [ ] Check no downtime

- [ ] Production testing:
  - [ ] Deploy to Vercel
  - [ ] Test all functionality
  - [ ] Performance check
  - [ ] Cross-browser testing

### Cleanup

- [ ] Mark old scripts as deprecated:
  - [ ] Rename `build-frontend.sh` → `build-frontend.sh.deprecated`
  - [ ] Rename `build-cms.sh` → `build-cms.sh.deprecated`

- [ ] Update `.gitignore` if needed

- [ ] Remove frontend directory (after confirming everything works)

---

## 🚨 Breaking Changes

### For Customers Using Deploy CLI:

**Impact:** Medium  
**Action Required:** Update to latest CLI version

The CLI will:
- Automatically detect unified vs legacy bundles
- Deploy single app for new releases
- Maintain backward compatibility with old releases

### For Manual Deployments:

**Impact:** High  
**Action Required:** New deployment process

Instead of deploying two apps:
1. Download `app.zip` (not frontend.zip + cms.zip)
2. Deploy to single Vercel project
3. Update environment variables (all URLs same domain)

---

## 📝 Rollback Plan

If critical issues found:

1. **Revert to v1.0.14**
   - Use legacy frontend.zip + cms.zip bundles
   - Deploy as two separate apps

2. **Keep codebase changes**
   - Middleware and merged code work fine
   - Just use old bundling process

3. **Mark v1.0.15 as beta**
   - Give customers option to stay on v1.0.14
   - Gradual migration

---

## 🎯 Success Criteria

- [ ] Build process completes without errors
- [ ] Deploy CLI successfully deploys unified app
- [ ] All routes accessible on single domain
- [ ] Authentication works across all pages
- [ ] Telegram linking works
- [ ] No performance regression
- [ ] Existing deployments can migrate smoothly

---

## 📊 Timeline

- **Day 1 (Today):** ✅ Code merge, scripts update
- **Day 2:** Deploy CLI updates, testing
- **Day 3:** Documentation, release preparation
- **Day 4:** Release v1.0.15, monitor deployments

---

## 👥 Stakeholders

- **Developers:** Updated build scripts
- **Customers:** Simpler deployment (1 vs 2 apps)
- **Support:** Less complex troubleshooting

---

## 📞 Communication Plan

### Release Notes:

```markdown
# CuratedReels v1.0.15 - Unified Architecture

## 🎉 Major Improvement: Merged Frontend and CMS

We've merged the frontend and CMS into a single application!

### Benefits:
- ✅ Single deployment (down from 2)
- ✅ No cross-domain authentication issues
- ✅ Simpler environment configuration
- ✅ Faster performance (no CORS)

### For Existing Users:
- CLI automatically handles the new structure
- Recommend fresh deployment for best results
- Legacy bundles still supported (for now)

### Migration Guide:
See: docs/DEPLOYMENT_ARCHITECTURE_UPDATE.md
```

### Customer Email (if applicable):

Subject: Important Update - Simplified Deployment

Body: Inform about unified architecture, benefits, and migration path.

---

## 🔗 Related Documents

- [DEPLOYMENT_ARCHITECTURE_UPDATE.md](./DEPLOYMENT_ARCHITECTURE_UPDATE.md)
- [ARCHITECTURE_CHANGE_UNIFIED_APP.md](./ARCHITECTURE_CHANGE_UNIFIED_APP.md)
- [LOCAL_TESTING_RESULTS.md](./LOCAL_TESTING_RESULTS.md)
- [frontend/DEPRECATED.md](../frontend/DEPRECATED.md)
