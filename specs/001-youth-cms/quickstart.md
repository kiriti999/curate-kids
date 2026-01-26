# Youth Content CMS - Quickstart Guide

**Branch**: `001-youth-cms`  
**Date**: 2026-01-10

Get started with the Youth Content CMS in under 10 minutes.

---

## Prerequisites

- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- Sanity account (free at [sanity.io](https://www.sanity.io))

---

## 1. Installation

```bash
# Clone repository (if not already)
cd /Users/arjun/curatedreels

# Install dependencies
pnpm install

# Start Sanity Studio locally
pnpm dev
```

Studio opens at: **http://localhost:3333**

---

## 2. Initial Setup: Age Range Categories

The system requires 7 age range root categories. Run this seed script **once**:

```bash
# Create seed script
cat > scripts/seed-age-ranges.ts << 'EOF'
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '3rcl6ir9',
  dataset: 'production',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const ageRanges = [
  { name: '0-2 years', ageRange: '0-2', slug: '0-2-years' },
  { name: '2-4 years', ageRange: '2-4', slug: '2-4-years' },
  { name: '5-7 years', ageRange: '5-7', slug: '5-7-years' },
  { name: '8-9 years', ageRange: '8-9', slug: '8-9-years' },
  { name: '10-15 years', ageRange: '10-15', slug: '10-15-years' },
  { name: '16+ years', ageRange: '16+', slug: '16-plus-years' },
  { name: '18+ years', ageRange: '18+', slug: '18-plus-years' },
]

async function seed() {
  for (const ar of ageRanges) {
    await client.create({
      _type: 'category',
      name: ar.name,
      slug: { current: ar.slug },
      ageRange: ar.ageRange,
      isAgeRangeRoot: true,
      depth: 0,
      fullPath: [ar.name],
    })
  }
  console.log('✅ Age range categories created')
}

seed().catch(console.error)
EOF

# Run seed script
SANITY_TOKEN=your_write_token npx tsx scripts/seed-age-ranges.ts
```

Get your token from: **Sanity Project → API → Tokens** (needs Write permissions)

---

## 3. Create Your First Content Category

**In Sanity Studio:**

1. Click **"Categories"** in sidebar
2. Click **"Create new Category"**
3. Fill in:
   - **Name**: `Education`
   - **Age Range**: Select `5-7 years` (dropdown)
   - **Description**: `Educational videos for early learners`
   - **Icon**: Upload an image (optional)
4. Click **"Publish"**

✅ Result: Category path is now `5-7 years → Education`

---

## 4. Create a Subcategory

**Create nested category:**

1. Click **"Create new Category"**
2. Fill in:
   - **Name**: `Math`
   - **Age Range**: `5-7 years` (must match parent)
   - **Parent**: Select `Education` (dropdown)
   - **Description**: `Math videos for 5-7 year olds`
3. Click **"Publish"**

✅ Result: Category path is now `5-7 years → Education → Math`

---

## 5. Add Your First Video

**In Sanity Studio:**

1. Click **"Videos"** in sidebar
2. Click **"Create new Video"**
3. Fill in:
   - **YouTube URL**: Paste full URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
   - **Title**: Auto-filled (can edit)
   - **Description**: Auto-filled or custom
   - **Category**: Select `Math` (under 5-7 years → Education)
   - **Status**: Change to `Published`
4. Click **"Publish"**

✅ Result: Video appears in `5-7 years → Education → Math`

**YouTube URL Formats Supported**:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

---

## 6. Create an Ad Placement

**In Sanity Studio:**

1. Click **"Ad Placements"**
2. Click **"Create new Ad Placement"**
3. Configure:
   - **Name**: `Header Banner - Educational Toys`
   - **Type**: `Banner`
   - **Position**: `Header`
   - **Priority**: `90` (1-100, higher shows first)
   - **Content Type**: `Image`
   - **Image URL**: `https://example.com/ad-image.jpg`
   - **Link URL**: `https://shop.example.com/toys`
   - **Status**: `Active`
4. Click **"Publish"**

✅ Result: Ad displays at top of all pages

**Position Options**:
- **Header**: Top of page (one ad)
- **Footer**: Bottom of page (one ad)
- **Sidebar**: Side column (one ad)
- **Inline**: Between video rows (multiple ads, configured by "every N videos")
- **Floating**: Overlay (one ad)

---

## 7. Add a CMS User

**In Sanity Studio (Admins only):**

1. Click **"Users"**
2. Click **"Create new User"**
3. Fill in:
   - **Name**: `Jane Editor`
   - **Email**: `jane@example.com`
   - **Role**: `Editor` (or `Admin`)
   - **Status**: `Active`
4. Click **"Publish"**

✅ Result: User can now log in to Sanity Studio

**Role Permissions**:
- **Admin**: Full access (videos, categories, ads, users, logs)
- **Editor**: Videos and categories only (no ads, users, logs)

---

## Key Concepts

### 1. Age-Based Hierarchy

```
Age Range (Root)
├── Content Category (Depth 1)
│   ├── Subcategory (Depth 2)
│   │   └── Leaf Category (Videos go here)
│   └── Another Subcategory (Depth 2)
└── Another Content Category (Depth 1)
```

**Rules**:
- Age ranges are **immutable** (cannot be edited/deleted)
- All categories under an age range must have same `ageRange` value
- Videos can only be assigned to **leaf categories** (no children)
- Maximum depth: **10 levels**

### 2. Category Path Display

Always shows full path from age range root:
- `5-7 years → Education → Math → Basic Addition`

### 3. Video Assignment

Videos belong to **ONE** category at the **leaf level**:
- ✅ Assign to: `Math` (if Math has no children)
- ❌ Cannot assign to: `Education` (if Education has children like Math, Science)

### 4. Ad Priority

When multiple ads target same position:
- **Higher priority number = shown first**
- Example: Priority 90 beats Priority 50
- Only **one ad** shown per position (except inline)

### 5. Inline Ads

Special positioning between videos:
- **Every N Videos**: Show ad after every N videos
- **Offset Start**: Skip first N videos before showing ads
- Example: `everyNVideos: 6, offsetStart: 3` → Ad after videos 3, 9, 15, 21...

---

## Common Tasks

### Move Video to Different Category

1. Open video document
2. Change **Category** field to new category
3. Click **"Publish"**

✅ Old category's `videoCount` auto-decrements, new category's auto-increments

### Delete a Category

**Requirements**:
- No videos assigned (`videoCount = 0`)
- No child categories (`childCount = 0`)
- Not an age range root

If blocked:
1. Reassign all videos to other categories
2. Delete or move all child categories first
3. Try deletion again

### Deactivate a User

1. Open user document
2. Change **Status** to `Inactive`
3. Click **"Publish"**

✅ User immediately loses CMS access

### Deactivate an Ad

1. Open ad placement document
2. Change **Status** to `Inactive`
3. Click **"Publish"**

✅ Ad immediately stops displaying

### View Activity Logs

1. Click **"Activity Logs"** (Admins only)
2. Use filters:
   - **Action Type**: `video.view`, `ad.click`, `user.login`, etc.
   - **Date Range**: Last 7 days, 30 days, custom
   - **User**: Filter by specific user
3. Export logs for analytics (future feature)

---

## Troubleshooting

### Video won't save

**Error**: "Category must be a leaf category"

**Fix**: Select a category that has **no subcategories**. If category has children, create/select a subcategory.

---

### YouTube metadata not loading

**Symptoms**: Title and thumbnail don't auto-fill

**Fix**:
1. Wait 2-3 seconds after pasting URL
2. Check URL is valid YouTube format
3. If still failing, manually enter title and description

---

### Can't delete category

**Error**: "Cannot delete category with videos or subcategories"

**Fix**:
1. Check **Video Count**: Move all videos to other categories
2. Check **Child Count**: Delete or move all subcategories
3. Try deletion again

---

### Ad not showing

**Check**:
1. **Status** is `Active`
2. **Start Date** is in past (or not set)
3. **End Date** is in future (or not set)
4. **Age Range Targeting**: If set, must match current age range view
5. **Priority**: Another ad may have higher priority

---

## Next Steps

1. **Create category structure** for all age ranges
2. **Bulk import videos** (future feature: CSV import)
3. **Set up affiliate partnerships** and tracking URLs
4. **Configure ad placements** for monetization
5. **Review activity logs** to understand usage patterns
6. **Build analytics dashboard** (Phase 3)

---

## File Structure Reference

```
curatedreels/
├── schemaTypes/
│   ├── documents/
│   │   ├── video.ts
│   │   ├── category.ts
│   │   ├── adPlacement.ts
│   │   ├── affiliatePartner.ts
│   │   ├── user.ts
│   │   └── activityLog.ts
│   └── index.ts
├── specs/001-youth-cms/
│   ├── plan.md              ← Implementation plan
│   ├── research.md          ← Technical decisions
│   ├── data-model.md        ← Entity definitions
│   ├── quickstart.md        ← This file
│   └── contracts/           ← JSON schemas
├── scripts/
│   └── seed-age-ranges.ts   ← Age range seeding
└── sanity.config.ts         ← Sanity Studio config
```

---

## Support

- **Documentation**: See `specs/001-youth-cms/plan.md` for detailed implementation plan
- **Data Model**: See `specs/001-youth-cms/data-model.md` for entity definitions
- **Research**: See `specs/001-youth-cms/research.md` for technical decisions

---

**Quickstart Status**: ✅ COMPLETE  
**Estimated Setup Time**: 10 minutes  
**Ready for**: Production use after schema implementation
