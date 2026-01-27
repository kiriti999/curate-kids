# Architecture Change: Single Unified App

**Date:** 2026-01-27  
**Type:** Major refactoring  
**Impact:** Fixes authentication and deployment issues

---

## Problem

CuratedReels had **two separate Next.js applications** deployed to different domains:

### Before:
```
├── /                      → PayloadCMS App (port 3001)
│   ├── app/(payload)/     → /admin routes
│   ├── app/(app)/         → /link route
│   └── payload-cms/       
│
└── /frontend/             → User-facing App (port 3000)
    └── src/app/           → /, /login, /pricing, /business, etc.
```

### Deployment Issues:
- **Frontend:** `deploy24-frontend-o3r21q0tr-whatsnxt.vercel.app`
- **CMS:** `thecureatekids-8em86m36q-whatsnxt.vercel.app`

### Problems This Caused:
1. ❌ **Cross-domain cookies don't work** - Authentication failed between apps
2. ❌ **Telegram account linking broken** - Redirect from frontend to CMS admin login failed
3. ❌ **CORS complexity** - Had to configure cross-origin requests
4. ❌ **Duplicate dependencies** - Two package.json files  
5. ❌ **Deployment complexity** - Two separate Vercel projects
6. ❌ **Environment variable confusion** - Different URLs for different apps

---

## Solution

**Merged everything into ONE Next.js application** in the root directory.

### After:
```
├── /                      → UNIFIED App (single deployment)
│   ├── app/(payload)/     → /admin routes (PayloadCMS)
│   ├── app/(app)/         → All public routes
│   │   ├── page.tsx       → Homepage (/)
│   │   ├── login/         → /login
│   │   ├── link/          → /link (Telegram linking)
│   │   ├── admin-login/   → /admin-login (custom admin auth)
│   │   ├── pricing/       → /pricing
│   │   ├── business/      → /business
│   │   └── reset-password/→ /reset-password
│   ├── components/        → All components (merged)
│   └── lib/              → Utilities
│
└── /frontend/             → DEPRECATED (marked for removal)
```

### What Was Migrated:
- ✅ All routes from `frontend/src/app/` → `app/(app)/`
- ✅ All components from `frontend/src/components/` → `components/`
- ✅ Dependencies merged into root `package.json`
- ✅ Layout updated with `AuthProvider` and analytics
- ✅ Created custom `/admin-login` page for Telegram linking

---

## Benefits

1. ✅ **Single domain** - All routes under one URL
2. ✅ **Shared authentication** - Cookies work everywhere
3. ✅ **Telegram linking fixed** - No cross-domain issues
4. ✅ **Simpler deployment** - One Vercel project
5. ✅ **Better DX** - One codebase, one dev server
6. ✅ **Faster** - No cross-origin requests

---

## Breaking Changes

### For Deployment:
- **Before:** Deploy two separate apps
- **After:** Deploy only the root app

### For Development:
```bash
# Before
cd frontend && pnpm dev  # Port 3000
cd .. && pnpm dev        # Port 3001 (separate terminal)

# After
pnpm dev                 # Port 3001 (everything)
```

### Environment Variables:
All URLs now point to the same domain:
```env
PAYLOAD_PUBLIC_SERVER_URL=https://your-app.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_PAYLOAD_API_URL=https://your-app.vercel.app
```

---

## Migration Checklist

- [x] Merge routes from frontend to root
- [x] Merge components
- [x] Update package.json
- [x] Update root layout with AuthProvider
- [x] Create custom `/admin-login` page
- [x] Mark frontend directory as deprecated
- [ ] Update Vercel deployment settings
- [ ] Remove frontend deployment from Vercel
- [ ] Update bot to use single URL
- [ ] Test Telegram linking end-to-end
- [ ] Remove frontend directory (future)

---

## Testing

### Local Testing:
```bash
cd /Users/arjun/curatekids
pnpm dev

# Test routes:
# http://localhost:3001           → Homepage
# http://localhost:3001/login     → Login
# http://localhost:3001/pricing   → Pricing
# http://localhost:3001/admin     → PayloadCMS admin
# http://localhost:3001/admin-login → Custom admin login
# http://localhost:3001/link?tg=... → Telegram linking
```

### Deployment:
1. Push to GitHub
2. Vercel auto-deploys
3. Update bot with new single URL
4. Test Telegram /link command

---

## Rollback Plan

If issues arise, the frontend directory is still present and can be re-deployed separately. However, this is not recommended as it brings back all the original problems.

---

## Future Work

1. Remove `frontend/` directory entirely (after confirming everything works)
2. Update all documentation references
3. Simplify deployment scripts
4. Remove CORS configuration (no longer needed)

---

## Related Files

- `frontend/DEPRECATED.md` - Deprecation notice
- `app/(app)/admin-login/page.tsx` - Custom admin login
- `app/api/auth/login/route.ts` - Authentication API
- `components/link-account/LoginPrompt.tsx` - Updated redirect
