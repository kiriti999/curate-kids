# Activity Log Event Types - CurateKids CMS

## Event Type Format

All event types follow the pattern: `resource.action`

Example: `video.view`, `ad.click`, `user.login`

---

## Video Events.

### video.create
**Triggered**: When a new video document is created  
**Metadata**:
```json
{
  "videoId": "video-123",
  "title": "Learn Basic Addition",
  "categoryPath": ["5-7 years", "Education", "Math"],
  "ageRange": "5-7"
}
```

### video.update
**Triggered**: When a video document is updated  
**Metadata**:
```json
{
  "videoId": "video-123",
  "previousValue": "draft",
  "newValue": "published",
  "field": "status"
}
```

### video.delete
**Triggered**: When a video document is deleted  
**Metadata**:
```json
{
  "videoId": "video-123",
  "title": "Deleted Video Title",
  "categoryPath": ["5-7 years", "Education"]
}
```

### video.view
**Triggered**: When a user views a video on frontend  
**Metadata**:
```json
{
  "videoId": "video-123",
  "categoryPath": ["5-7 years", "Education", "Math"],
  "ageRange": "5-7",
  "duration": 142,
  "watchedToEnd": true
}
```

### video.publish
**Triggered**: When video status changes to published  
**Metadata**:
```json
{
  "videoId": "video-123",
  "publishedAt": "2026-01-10T14:30:00Z"
}
```

### video.archive
**Triggered**: When video status changes to archived  
**Metadata**:
```json
{
  "videoId": "video-123",
  "archivedAt": "2026-01-10T14:30:00Z"
}
```

---

## Category Events

### category.create
**Triggered**: When a new category is created  
**Metadata**:
```json
{
  "categoryId": "category-123",
  "name": "Math",
  "parent": "category-education",
  "ageRange": "5-7",
  "depth": 2
}
```

### category.update
**Triggered**: When a category is updated  
**Metadata**:
```json
{
  "categoryId": "category-123",
  "previousValue": "Mathematics",
  "newValue": "Math",
  "field": "name"
}
```

### category.delete
**Triggered**: When a category is deleted  
**Metadata**:
```json
{
  "categoryId": "category-123",
  "name": "Deleted Category",
  "childCount": 0,
  "videoCount": 0
}
```

### category.navigate
**Triggered**: When user navigates to a category on frontend  
**Metadata**:
```json
{
  "fromCategory": "category-education",
  "toCategory": "category-math",
  "navigationPath": ["5-7 years", "Education", "Math"],
  "ageRange": "5-7"
}
```

### category.reorder
**Triggered**: When category sort order is changed  
**Metadata**:
```json
{
  "categoryId": "category-123",
  "previousOrder": 10,
  "newOrder": 5
}
```

---

## Ad Events

### ad.create
**Triggered**: When a new ad placement is created  
**Metadata**:
```json
{
  "adId": "ad-123",
  "name": "Q1 2026 Header Banner",
  "position": "header",
  "type": "banner",
  "priority": 90
}
```

### ad.update
**Triggered**: When an ad placement is updated  
**Metadata**:
```json
{
  "adId": "ad-123",
  "previousValue": "inactive",
  "newValue": "active",
  "field": "status"
}
```

### ad.impression
**Triggered**: When an ad becomes visible on frontend  
**Metadata**:
```json
{
  "adId": "ad-123",
  "adPosition": "header",
  "adType": "banner",
  "ageRange": "5-7",
  "visibleDuration": 5000
}
```

### ad.click
**Triggered**: When a user clicks an ad  
**Metadata**:
```json
{
  "adId": "ad-123",
  "adPosition": "header",
  "clickDestination": "https://partner.com/track?id=123",
  "ageRange": "5-7"
}
```

### ad.activate
**Triggered**: When ad status changes to active  
**Metadata**:
```json
{
  "adId": "ad-123",
  "activatedAt": "2026-01-10T14:30:00Z"
}
```

### ad.deactivate
**Triggered**: When ad status changes to inactive  
**Metadata**:
```json
{
  "adId": "ad-123",
  "deactivatedAt": "2026-01-10T14:30:00Z",
  "reason": "campaign_ended"
}
```

---

## User Events

### user.create
**Triggered**: When a new user is created  
**Metadata**:
```json
{
  "userId": "user-123",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "editor",
  "addedBy": "user-admin-456"
}
```

### user.login
**Triggered**: When a user logs into Sanity Studio  
**Metadata**:
```json
{
  "userId": "user-123",
  "loginMethod": "google",
  "timestamp": "2026-01-10T09:00:00Z"
}
```

### user.logout
**Triggered**: When a user logs out  
**Metadata**:
```json
{
  "userId": "user-123",
  "sessionDuration": 3600
}
```

### user.failed_login
**Triggered**: When a login attempt fails  
**Metadata**:
```json
{
  "email": "jane@example.com",
  "failureReason": "invalid_credentials",
  "timestamp": "2026-01-10T09:00:00Z"
}
```

### user.deactivate
**Triggered**: When user status changes to inactive  
**Metadata**:
```json
{
  "userId": "user-123",
  "deactivatedAt": "2026-01-10T14:30:00Z",
  "deactivatedBy": "user-admin-456"
}
```

---

## System Events

### system.backup
**Triggered**: When system backup is initiated  
**Metadata**:
```json
{
  "backupId": "backup-123",
  "timestamp": "2026-01-10T00:00:00Z",
  "documentCount": 1500
}
```

### system.restore
**Triggered**: When system restore is performed  
**Metadata**:
```json
{
  "backupId": "backup-123",
  "restorePoint": "2026-01-09T23:59:59Z"
}
```

### system.migration
**Triggered**: When data migration is run  
**Metadata**:
```json
{
  "migrationId": "migration-v2",
  "documentsAffected": 250,
  "duration": 45
}
```

---

## Analytics Queries

### Total Video Views by Age Range

```groq
*[_type == "activityLog" && actionType == "video.view"] {
  "ageRange": metadata.ageRange,
  "count": count(*)
} | group(ageRange) { 
  ageRange, 
  "views": sum(count) 
}
```

### Ad Click-Through Rate

```groq
{
  "impressions": count(*[_type == "activityLog" && actionType == "ad.impression" && resourceId == $adId]),
  "clicks": count(*[_type == "activityLog" && actionType == "ad.click" && resourceId == $adId]),
  "ctr": (clicks / impressions) * 100
}
```

### User Login Activity

```groq
*[_type == "activityLog" && actionType == "user.login" && userId._ref == $userId] 
  | order(_createdAt desc) 
  [0...50]
```

### Category Navigation Funnel

```groq
*[_type == "activityLog" && actionType == "category.navigate"] {
  "from": metadata.fromCategory,
  "to": metadata.toCategory,
  "count": count(*)
} | group(from, to) {
  from,
  to,
  "transitions": sum(count)
}
```

### Top Videos by Views

```groq
*[_type == "activityLog" && actionType == "video.view"] {
  "videoId": metadata.videoId,
  "count": count(*)
} | group(videoId) {
  videoId,
  "views": sum(count)
} | order(views desc) [0...10]
```

---

## Integration Examples

### Creating a Log from Frontend

```typescript
// POST /api/activity-log
const logVideoView = async (videoId: string, duration: number) => {
  await fetch('/api/activity-log', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      actionType: 'video.view',
      sessionId: getSessionId(),
      resourceType: 'video',
      resourceId: videoId,
      metadata: {
        videoId,
        duration,
        watchedToEnd: duration > 0.9 * totalDuration,
        categoryPath: video.categoryPath,
        ageRange: video.ageRange,
      },
    }),
  })
}
```

### Creating a Log from Webhook

```typescript
// Sanity webhook handler
export default async function handler(req: any) {
  const {action, _id, _type} = req.body
  
  if (action === 'create' && _type === 'video') {
    await client.create({
      _type: 'activityLog',
      actionType: 'video.create',
      userId: {_ref: req.body._updatedBy},
      resourceType: 'video',
      resourceId: _id,
      metadata: {
        videoId: _id,
        title: req.body.title,
      },
    })
  }
}
```

---

**Last Updated**: 2026-01-10  
**For**: Analytics Team Integration
