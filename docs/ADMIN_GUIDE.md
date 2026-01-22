# Admin User Guide - CuratedReels CMS

## Quick Reference

### Common Tasks

1. **Add a YouTube Video**
2. **Create a Category**  
3. **Configure an Ad**
4. **Add a User**
5. **View Activity Logs**

---

## 1. Adding YouTube Videos

### Step-by-Step

1. Navigate to Videos → Create new document
2. Paste YouTube URL (ID auto-extracts)
3. Fill in title, select category (leaf only)
4. Set status to "Published"
5. Save (publishedAt auto-sets)

### Troubleshooting

- **YouTube ID Not Extracting**: Verify URL format, try again
- **Cannot Select Category**: Ensure category has no subcategories
- **Slug Already Exists**: Edit slug to make unique

---

## 2. Creating Categories

### Hierarchy
```
Age Range → Content Type → Topic → Subtopic
Example: 5-7 years → Education → Math → Addition
```

### Important Rules

- Age range roots are protected (cannot delete)
- Child must match parent's age range
- Maximum depth: 10 levels
- Deletion blocked if has children or videos

---

## 3. Configuring Ad Placements (Admin Only)

### Positions

- **Header**: Top of page
- **Footer**: Bottom of page
- **Sidebar**: Side panel
- **Inline**: Between videos (requires config)
- **Floating**: Overlay

### Best Practices

- Test before activating (set to inactive)
- Use priority 90-100 for critical ads
- Target age ranges for relevance
- Monitor CTR regularly

---

## 4. Managing Users (Admin Only)

### Roles

- **Admin**: Full access
- **Editor**: Videos and categories only

### Key Points

- Role cannot change after creation
- Cannot delete your own account
- Email must be unique

---

## 5. Viewing Activity Logs (Admin Only)

### What's Logged

- Video actions (create, update, view)
- Category navigation
- Ad impressions and clicks
- User authentication

Logs are read-only and cannot be manually created.

---

**Last Updated**: 2026-01-10
