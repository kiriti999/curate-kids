# Deployment Checklist - CuratedReels CMS

## Pre-Deployment

### Environment Setup

- [ ] **Node.js Version**: >=20.19 <22 || >=22.12
- [ ] **Package Manager**: pnpm 8.0+ installed
- [ ] **Sanity Account**: Create account at sanity.io (free tier)
- [ ] **Project Created**: Sanity project exists with ID `3rcl6ir9`
- [ ] **Dataset**: Production dataset configured

### Dependencies

- [ ] **Install Packages**: Run `pnpm install`
- [ ] **TypeScript Check**: Run `pnpm tsc --noEmit` (should pass)
- [ ] **Verify Schemas**: All schema files in schemaTypes/ load correctly

---

## Initial Data Setup

### 1. Seed Age Range Categories

```bash
# Set Sanity token with editor/admin rights
export SANITY_TOKEN="your-sanity-token-here"

# Run seed script
pnpm tsx scripts/seed-age-ranges.ts
```

**Expected Result**: 7 age range categories created:
- 0-2 years
- 2-4 years
- 5-7 years
- 8-9 years
- 10-15 years
- 16+ years
- 18+ years

**Verify**:
- [ ] All 7 age ranges exist in Sanity Studio
- [ ] Each has `isAgeRangeRoot: true`
- [ ] Depth is 0 for all
- [ ] Cannot be deleted (protected)

### 2. Create First Admin User

**Via Sanity Dashboard** (https://sanity.io/manage):
1. Go to Project → API → Tokens
2. Create token with Editor permissions
3. Use token to invite first admin via email

**Via Sanity Studio**:
1. Log in with Sanity account
2. Navigate to Users document type
3. Create first user:
   - Name: Your name
   - Email: Your email
   - Role: admin
   - Status: active
   - addedBy: Reference self (will error - ignore for first user)

**Verify**:
- [ ] Admin user exists and can login
- [ ] Admin can access all document types
- [ ] Admin can create other users

---

## Content Setup

### 3. Create Sample Categories

Under each age range, create at least:
- **Education** (Math, Reading, Science)
- **Entertainment** (Stories, Games, Music)

**Verify**:
- [ ] Categories have correct parent references
- [ ] fullPath computes correctly
- [ ] depth increments properly
- [ ] sortOrder controls display order

### 4. Add Sample Videos

Create 3-5 test videos:
- Use real YouTube URLs
- Assign to different categories
- Set status to "published"
- Add tags and descriptions

**Verify**:
- [ ] youtubeId extracts correctly
- [ ] categoryPath populates
- [ ] ageRange inherits from category
- [ ] publishedAt sets when published
- [ ] Video appears under correct category

---

## Permissions & Security

### 5. Configure User Roles

**Create Test Editor**:
- [ ] Create user with role: editor
- [ ] Verify editor CANNOT see:
  - Users
  - Ad Placements
  - Affiliate Partners
  - Activity Logs
- [ ] Verify editor CAN see:
  - Videos
  - Categories

**Admin Permissions**:
- [ ] Admin can access all document types
- [ ] Admin can create/delete users
- [ ] Admin cannot delete own account

### 6. Test Validation Rules

**Category Validation**:
- [ ] Cannot delete age range roots
- [ ] Cannot delete category with children
- [ ] Cannot delete category with videos
- [ ] Depth limit enforced (max 10)
- [ ] Same age range required for parent/child

**Video Validation**:
- [ ] YouTube URL format validated
- [ ] Must select leaf category (no children)
- [ ] Slug must be unique
- [ ] Max 20 tags enforced

**User Validation**:
- [ ] Email must be unique
- [ ] Role immutable after creation
- [ ] Cannot delete self

---

## Ad System Setup (Optional)

### 7. Create Sample Ads

**If using ads**:
- [ ] Create 1-2 test ad placements
- [ ] Set position, priority, content
- [ ] Verify inline ads require position config
- [ ] Test scheduling with start/end dates

### 8. Add Affiliate Partners (Optional)

**If using affiliates**:
- [ ] Create 1-2 test partners
- [ ] Link partner to ad placement
- [ ] Verify metrics initialize to 0

---

## Frontend Integration

### 9. GROQ Query Testing

Test key queries in Vision tool:

```groq
// Get published videos by age range
*[_type == "video" && status == "published" && ageRange == "5-7"] 
  | order(publishedAt desc) [0...20]

// Get category tree
*[_type == "category" && ageRange == "5-7"] 
  | order(depth asc, sortOrder asc)

// Get active ads for position
*[_type == "adPlacement" && status == "active" && position == "header"]
  | order(priority desc) [0]
```

**Verify**:
- [ ] Published videos return correctly
- [ ] Categories organize by depth/order
- [ ] Ads filter by status and position

### 10. Activity Logging Setup

**If using activity logs**:
- [ ] Set up frontend API endpoint for log creation
- [ ] Test creating sample logs
- [ ] Verify logs are read-only in Studio
- [ ] Test log queries by action type and date

---

## Production Deployment

### 11. Deploy Sanity Studio

```bash
# Build Studio
pnpm build

# Deploy to Sanity hosting
pnpm sanity deploy
```

**Verify**:
- [ ] Studio accessible at [project-name].sanity.studio
- [ ] All schemas load correctly
- [ ] Users can login

### 12. Configure Domain (Optional)

**If using custom domain**:
- [ ] Add CNAME record pointing to Sanity
- [ ] Configure in Sanity project settings
- [ ] Verify SSL certificate active

---

## Post-Deployment

### 13. User Onboarding

- [ ] Create admin accounts for team members
- [ ] Create editor accounts for content managers
- [ ] Share admin guide (/docs/ADMIN_GUIDE.md)
- [ ] Share troubleshooting guide (/docs/TROUBLESHOOTING.md)

### 14. Monitoring Setup

**Recommended**:
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor Sanity API usage
- [ ] Track document counts (videos, categories)
- [ ] Review activity logs periodically

### 15. Backup Strategy

**Recommendations**:
- [ ] Enable Sanity project history (automatic)
- [ ] Export dataset weekly (sanity dataset export)
- [ ] Document restore procedure

```bash
# Export dataset
pnpm sanity dataset export production backup.tar.gz

# Import dataset (if needed)
pnpm sanity dataset import backup.tar.gz production
```

---

## Rollback Plan

### If Issues Arise

1. **Studio Not Loading**:
   - Check browser console errors
   - Verify schema syntax
   - Test with `pnpm dev` locally

2. **Data Issues**:
   - Restore from backup
   - Use Sanity history to revert changes

3. **Permission Issues**:
   - Verify user roles in Sanity dashboard
   - Check document action configuration

---

## Success Criteria

Before marking deployment complete:

- [ ] All 7 age range categories exist
- [ ] At least 1 admin user can login
- [ ] Sample videos display correctly
- [ ] Editor cannot access restricted types
- [ ] All validation rules working
- [ ] TypeScript checks pass
- [ ] Documentation accessible to team

---

## Support Contacts

- **Technical Issues**: [your-email@example.com]
- **Sanity Support**: https://www.sanity.io/help
- **Documentation**: /docs/ and /specs/001-youth-cms/

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Sanity Studio URL**: ___________  
**Notes**: ___________

---

**Last Updated**: 2026-01-10
