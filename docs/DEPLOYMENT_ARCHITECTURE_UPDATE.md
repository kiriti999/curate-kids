# Deployment Architecture Update

**Date:** 2026-01-27  
**Change:** Merged Frontend and CMS into Unified App

---

## What Changed

### Before (v1.0.14 and earlier):
- **Two separate apps:**
  - `frontend.zip` - User-facing Next.js app
  - `cms.zip` - PayloadCMS admin app
- **Two separate deployments** required
- **Cross-domain authentication issues**

### After (v1.0.15+):
- **One unified app:**
  - `app.zip` - Contains both frontend AND CMS
- **Single deployment**
- **All routes in one app:** `/admin`, `/`, `/login`, etc.
- **No cross-domain issues**

---

## Bundle Structure

### New Unified Architecture:

```
app.zip
├── .next/                  # Next.js build
├── public/                 # Static files
├── payload-cms/           # PayloadCMS collections
├── components/            # React components
├── lib/                   # Utilities
├── utils/                 # Utilities
├── middleware.ts          # Auth middleware
├── next.config.mjs
├── payload.config.ts
├── package.json
└── README.md
```

### Routes Included:
- `/admin` - PayloadCMS admin panel
- `/` - Homepage with video gallery
- `/login` - User login
- `/pricing` - Pricing page
- `/business` - Business page
- `/link` - Telegram account linking
- `/admin-login` - Custom admin login for Telegram

---

## Migration Guide

### For New Deployments (v1.0.15+):

```bash
# Deploy CLI automatically handles new structure
npx @curatedreels/deploy

# Or manual deployment:
1. Extract app.zip
2. Set environment variables (same as before)
3. Deploy to Vercel (single project)
```

### For Existing Deployments (Upgrading from v1.0.14):

**Option A: Fresh Deployment (Recommended)**
1. Delete old frontend deployment from Vercel
2. Delete old CMS deployment from Vercel  
3. Deploy new unified app.zip

**Option B: Migrate CMS Deployment**
1. Keep CMS deployment
2. Delete frontend deployment
3. Update CMS deployment with new app.zip
4. All routes now work on CMS domain

---

## Environment Variables

**Simplified:** All URLs now point to single domain

```env
# Before (Two domains):
NEXT_PUBLIC_FRONTEND_URL=https://frontend-abc.vercel.app
PAYLOAD_PUBLIC_SERVER_URL=https://cms-xyz.vercel.app
NEXT_PUBLIC_PAYLOAD_API_URL=https://cms-xyz.vercel.app

# After (One domain):
NEXT_PUBLIC_FRONTEND_URL=https://yourapp.vercel.app
PAYLOAD_PUBLIC_SERVER_URL=https://yourapp.vercel.app
NEXT_PUBLIC_PAYLOAD_API_URL=https://yourapp.vercel.app
```

---

## Breaking Changes

### Deploy CLI Updates Needed:

1. **Bundle download:** Look for `app.zip` instead of `frontend.zip` + `cms.zip`
2. **Deployment:** Deploy ONE app instead of two
3. **Manifest:** Check `architecture` field to detect unified vs legacy

### Backward Compatibility:

Legacy bundles (v1.0.14 and earlier) still work, but:
- Will have cross-domain auth issues
- Require two separate deployments
- **Recommendation:** Upgrade to unified architecture

---

## Build Scripts

### Build Unified Bundle:

```bash
cd scripts/build-bundles
./build-app.sh
```

### Build All (App + Bot):

```bash
./build-all.sh 1.0.15
```

Output:
- `app.zip` - Unified app bundle
- `bot.js` - Telegram bot
- `manifest.json` - Bundle metadata

---

## Testing

### Local Testing:

```bash
cd output/app
npm install
npm start
```

Visit:
- http://localhost:3001 - Homepage
- http://localhost:3001/admin - Admin panel
- http://localhost:3001/login - Login page

### Production Testing:

Deploy to Vercel and verify:
- All routes accessible
- No CORS errors
- Authentication works across all pages
- Telegram linking works

---

## Rollback Plan

If issues occur:

1. **Download previous release** (v1.0.14)
2. **Deploy legacy bundles:**
   - `frontend.zip` → Frontend deployment
   - `cms.zip` → CMS deployment
3. **Revert environment variables** to two domains

---

## Benefits

✅ **Single deployment** - Simpler infrastructure  
✅ **No cross-domain issues** - All routes on same domain  
✅ **Better UX** - No cookie/auth problems  
✅ **Faster** - No cross-origin requests  
✅ **Easier maintenance** - One codebase, one deployment  

---

## Files Updated

- `scripts/build-bundles/build-app.sh` - New unified build script
- `scripts/build-bundles/build-all.sh` - Updated to build app instead of frontend+cms
- `packages/deploy-cli/src/services/bundles.ts` - Support for unified architecture
- Frontend directory marked as DEPRECATED

---

## Next Release

**Version:** 1.0.15  
**Release Date:** TBD  
**Key Changes:**
- Unified app architecture
- Single deployment
- Fixed authentication issues
- Added middleware for server-side auth
