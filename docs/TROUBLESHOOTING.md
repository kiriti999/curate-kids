# Troubleshooting Guide - CurateKids CMS

## Common Issues and Solutions

### Video Management

#### YouTube ID Not Extracting

**Symptoms**: youtubeId field remains empty after pasting URL

**Causes**:
- Incorrect URL format
- URL doesn't contain 11-character video ID
- Browser issue

**Solutions**:
1. Verify URL format (must be youtube.com/watch?v=, youtu.be/, or youtube.com/embed/)
2. Check video ID is exactly 11 characters
3. Try pasting URL again
4. Refresh browser page
5. Manually enter YouTube ID if extraction fails

#### Cannot Publish Video

**Symptoms**: Publish button disabled or errors on save

**Causes**:
- Missing required fields (title, youtubeUrl, category)
- Category is not a leaf node
- Validation errors

**Solutions**:
1. Fill in all required fields (marked with *)
2. Verify category has no subcategories (must be leaf)
3. Check for validation error messages
4. Ensure YouTube URL is valid

#### Video Not Appearing in Category

**Symptoms**: Published video doesn't show under selected category

**Causes**:
- Video status is not "published"
- Category path not computed
- Caching issue

**Solutions**:
1. Verify status is "published" not "draft"
2. Re-publish to trigger computed field update
3. Check categoryPath field is populated
4. Clear frontend cache

---

### Category Management

#### Cannot Delete Category

**Symptoms**: Error message when attempting to delete

**Causes**:
- Category has child categories (childCount > 0)
- Category has assigned videos (videoCount > 0)
- Category is age range root (protected)

**Solutions**:
1. Check childCount and videoCount in preview
2. Move or delete all child categories first
3. Reassign or delete all videos in category
4. Age range roots cannot be deleted (by design)

#### Circular Reference Error

**Symptoms**: Error when setting parent category

**Causes**:
- Attempting to set category as its own parent
- Creating circular hierarchy loop

**Solutions**:
1. Select different parent category
2. Review hierarchy structure
3. Ensure parent is not a descendant

#### Maximum Depth Exceeded

**Symptoms**: Cannot create subcategory, depth error

**Causes**:
- Parent category is at depth 9 (max is 10)
- Hierarchy is too deep

**Solutions**:
1. Restructure category hierarchy
2. Flatten levels where possible
3. Create sibling category instead of child

#### Age Range Mismatch

**Symptoms**: Cannot select parent, age range error

**Causes**:
- Child and parent have different age ranges

**Solutions**:
1. Verify child's age range matches parent
2. Create category under correct age range root
3. Change child's age range to match

---

### Ad Placement

#### Inline Ad Not Showing

**Symptoms**: Inline ad not appearing between videos

**Causes**:
- Missing inlinePosition configuration
- everyNVideos not set
- Not enough videos to trigger ad

**Solutions**:
1. Set inlinePosition.everyNVideos (required)
2. Ensure status is "active"
3. Check if enough videos exist to trigger ad
4. Verify priority if multiple inline ads

#### Multiple Ads in Same Position

**Symptoms**: Wrong ad showing, expected different ad

**Causes**:
- Multiple ads have same position
- Priority determines which shows

**Solutions**:
1. Review all ads with same position
2. Use priority field to control order (higher = first)
3. Deactivate lower-priority ads if not needed
4. Set age range targeting to differentiate

#### Ad Not Showing for Age Range

**Symptoms**: Ad doesn't appear for targeted age group

**Causes**:
- ageRanges array doesn't include the age group
- Frontend filtering issue

**Solutions**:
1. Check ageRanges array (empty = all ages)
2. Add missing age range to array
3. Verify frontend is passing age range correctly

---

### User Management

#### Editor Can Access Restricted Documents

**Symptoms**: Editor sees users, ads, or logs

**Causes**:
- User role is "admin" not "editor"
- Role was changed after creation

**Solutions**:
1. Verify role field shows "editor"
2. Check Sanity Studio permissions
3. Role cannot be changed after creation
4. Create new user with correct role

#### Cannot Delete User

**Symptoms**: Delete blocked with error

**Causes**:
- Attempting to delete your own account
- User has created other users (addedBy references)

**Solutions**:
1. Self-deletion is blocked (security)
2. Have another admin delete the user
3. Deactivate user instead of deleting

#### User Cannot Login

**Symptoms**: User receives access denied

**Causes**:
- User status is "inactive"
- User not invited to Sanity project
- Email doesn't match Sanity account

**Solutions**:
1. Check status is "active" not "inactive"
2. Ensure user accepted Sanity invitation
3. Verify email matches exactly
4. Re-invite user through Sanity dashboard

---

### Activity Logs

#### Logs Not Appearing

**Symptoms**: Expected logs missing

**Causes**:
- Logs are created by frontend/webhooks, not Studio
- Action hasn't been performed yet

**Solutions**:
1. Activity logs are auto-created, not manual
2. Frontend must call API to create logs
3. Check webhook configuration
4. Logs may have retention policy applied

#### Cannot Create/Edit Logs

**Symptoms**: Create button disabled, logs read-only

**Causes**:
- Activity logs are intentionally read-only
- Prevents manual tampering

**Solutions**:
1. Logs are read-only by design (audit trail)
2. Logs are created automatically by system
3. Contact developer if logs need correction

---

### Computed Fields

#### Fields Not Updating

**Symptoms**: categoryPath, ageRange, counts not updating

**Causes**:
- Need to publish to trigger computation
- Document actions not firing
- Browser JavaScript error

**Solutions**:
1. Click "Publish" button (not just Save)
2. Check browser console for errors
3. Refresh page and try again
4. Verify parent references are valid

#### Counts Incorrect

**Symptoms**: childCount or videoCount doesn't match actual

**Causes**:
- Counts computed on publish, may be stale
- Videos/categories changed after last publish

**Solutions**:
1. Re-publish category to recalculate
2. Counts update when category is published
3. Check if unpublished drafts affecting count

---

### Performance

#### Studio Loading Slowly

**Symptoms**: Sanity Studio takes long to load

**Causes**:
- Large dataset (>10K documents)
- Complex queries
- Browser cache

**Solutions**:
1. Clear browser cache
2. Use filters to limit query results
3. Check internet connection
4. Optimize GROQ queries

#### Publish Takes Long Time

**Symptoms**: Publish button spins for >10 seconds

**Causes**:
- Computing many fields
- Large document size
- Network latency

**Solutions**:
1. Wait for completion (computed fields take time)
2. Reduce document size if possible
3. Check network connection
4. Normal for categories with many children

---

## Getting Help

### Before Contacting Support

1. Check this troubleshooting guide
2. Review admin user guide
3. Check browser console for errors
4. Test in incognito/private mode
5. Try different browser

### Information to Provide

- **Document type** (video, category, ad, user)
- **Error message** (exact text or screenshot)
- **Browser console** errors (F12 → Console)
- **Steps to reproduce** (what actions led to issue)
- **Expected vs actual** behavior

### Contact

- System administrator: [contact info]
- Technical documentation: `/specs/001-youth-cms/`

---

**Last Updated**: 2026-01-10
