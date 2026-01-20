# Data Model: Telegram Video Curation Bot

**Feature**: 001-telegram-video-curation  
**Date**: 2025-01-20  
**Purpose**: Define data structures, state management, and entity relationships

## Overview

This document defines the data model for the Telegram bot's in-memory state management and the structure of data sent to Sanity CMS. The bot maintains ephemeral state for message-callback correlation, while Sanity CMS persists the final video documents.

---

## 1. Bot State Entities

### 1.1 MessageState

**Purpose**: Track pending category selections for YouTube videos shared in groups

**Lifecycle**: Created when valid YouTube link detected → Deleted after category selection or 24h expiration

**Storage**: In-memory Map with TTL cleanup

**Schema**:

```typescript
interface MessageState {
  // Message identification
  messageId: number;           // Telegram message ID
  chatId: number;              // Telegram chat ID (group)
  userId: number;              // Telegram user ID (curator)
  
  // Video metadata (extracted from YouTube)
  youtubeUrl: string;          // Full YouTube URL
  youtubeId: string;           // Extracted 11-character ID
  title: string;               // Video title from YouTube API
  
  // State tracking
  timestamp: number;           // Unix timestamp (ms) when message received
  expiresAt: number;           // Unix timestamp (ms) when state expires (timestamp + 24h)
  
  // Group context
  ageRange: AgeRange;          // Determined from chat ID mapping
}

type AgeRange = '0-2' | '3-5' | '6-8' | '9-12' | '13+';
```

**Key Structure**: `${chatId}:${messageId}`  
- Ensures uniqueness across multiple groups
- Allows O(1) lookup during callback handling

**Example**:
```json
{
  "messageId": 12345,
  "chatId": -1001234567890,
  "userId": 987654321,
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "youtubeId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up (Official Video)",
  "timestamp": 1705776000000,
  "expiresAt": 1705862400000,
  "ageRange": "3-5"
}
```

**Validation Rules**:
- `messageId`: Must be positive integer
- `chatId`: Must be negative integer (groups have negative IDs)
- `userId`: Must be positive integer
- `youtubeUrl`: Must match YouTube URL regex
- `youtubeId`: Must be exactly 11 characters, alphanumeric + `_` + `-`
- `title`: Must be non-empty string (from YouTube API)
- `timestamp`: Must be <= current time
- `expiresAt`: Must be exactly `timestamp + 86400000` (24 hours in ms)
- `ageRange`: Must be one of the 5 valid values

**State Transitions**:
1. **Created**: Valid YouTube URL detected in message
2. **Pending**: Category buttons shown, awaiting selection
3. **Completed**: Category selected, submitted to Sanity
4. **Expired**: 24 hours passed without selection
5. **Deleted**: After completion or expiration

---

### 1.2 CategorySelection

**Purpose**: Represent inline keyboard button selection from curator

**Lifecycle**: Exists only during callback handling (not persisted)

**Schema**:

```typescript
interface CategorySelection {
  // Callback identification
  callbackQueryId: string;     // Telegram callback query ID
  
  // Selection data
  category: VideoCategory;     // Selected category value
  
  // Reference to original message
  chatId: number;              // From callback query
  messageId: number;           // From callback query
  userId: number;              // User who clicked button
}

type VideoCategory = 
  | 'education' 
  | 'entertainment' 
  | 'music' 
  | 'science' 
  | 'arts-crafts' 
  | 'sports' 
  | 'nature' 
  | 'stories';
```

**Validation Rules**:
- `callbackQueryId`: Must be non-empty string
- `category`: Must be one of 8 valid categories
- `chatId`, `messageId`, `userId`: Must exist in MessageState

**Processing Flow**:
1. Callback received from Telegram
2. Extract `chatId`, `messageId`, `category` from callback data
3. Lookup MessageState using key `${chatId}:${messageId}`
4. Validate: callback `userId` matches MessageState `userId`
5. Create VideoSubmission and send to Sanity
6. Delete MessageState entry
7. Send confirmation message to curator

---

### 1.3 AgeRangeGroupMapping

**Purpose**: Map Telegram group chat IDs to age ranges

**Lifecycle**: Static configuration, loaded at bot startup

**Storage**: Config file or environment variables

**Schema**:

```typescript
interface AgeRangeGroupMapping {
  [chatId: number]: AgeRange;
}

// Example configuration
const ageRangeGroups: AgeRangeGroupMapping = {
  -1001234567890: '0-2',   // Baby Videos Group
  -1001234567891: '3-5',   // Preschool Videos Group
  -1001234567892: '6-8',   // Elementary Videos Group
  -1001234567893: '9-12',  // Tween Videos Group
  -1001234567894: '13+',   // Teen Videos Group
};
```

**Usage**:
- When message received, lookup `ageRange` using `message.chat.id`
- If chat ID not found → use default or notify admin
- Store in MessageState for later use in VideoSubmission

**Configuration Methods**:

**Option 1: Environment Variables** (Recommended for Railway)
```bash
GROUP_0_2=-1001234567890
GROUP_3_5=-1001234567891
GROUP_6_8=-1001234567892
TELEGRAM_GROUP=-1001234567893
GROUP_13_PLUS=-1001234567894
```

**Option 2: Config File**
```typescript
// bot/src/config/ageRangeGroups.ts
export const ageRangeGroups: AgeRangeGroupMapping = {
  // Production groups
  [parseInt(process.env.GROUP_0_2 || '')]: '0-2',
  [parseInt(process.env.GROUP_3_5 || '')]: '3-5',
  [parseInt(process.env.GROUP_6_8 || '')]: '6-8',
  [parseInt(process.env.TELEGRAM_GROUP || '')]: '9-12',
  [parseInt(process.env.GROUP_13_PLUS || '')]: '13+',
};
```

---

## 2. Sanity CMS Entities

### 2.1 VideoSubmission (Payload to Sanity)

**Purpose**: Data structure sent to Sanity CMS to create video document

**Lifecycle**: Created after category selection → Sent to Sanity API → Becomes Video document

**Schema** (matches existing Sanity video schema):

```typescript
interface VideoSubmission {
  _type: 'video';
  
  // Required fields
  title: string;               // From YouTube API
  youtubeUrl: string;          // From original message
  youtubeId: string;           // Extracted from URL
  category: VideoCategory;     // From curator selection
  ageRange: AgeRange;          // From group mapping
  
  // Default values
  status: 'pending';           // Always "pending" for bot submissions
  tags: string[];              // Empty array initially
  
  // Optional fields (bot doesn't set these)
  // slug: Auto-generated by Sanity from title
  // duration: Could be fetched from YouTube API (future enhancement)
  // notes: Admin-only field
  // viewCount: Computed field
  // lastViewedAt: Computed field
}
```

**Example Payload**:
```json
{
  "_type": "video",
  "title": "Learning Colors with Fun Animations",
  "youtubeUrl": "https://www.youtube.com/watch?v=abc123def45",
  "youtubeId": "abc123def45",
  "category": "education",
  "ageRange": "3-5",
  "status": "pending",
  "tags": []
}
```

**Validation (Sanity-side)**:
- `title`: Required, max 200 characters
- `youtubeUrl`: Required, valid YouTube URL format
- `youtubeId`: 11 characters
- `category`: One of 8 valid categories
- `ageRange`: One of 5 valid ranges
- `slug`: Auto-generated from title (not sent by bot)

**Field Mapping**:

| Bot Data | Sanity Field | Source |
|----------|-------------|--------|
| MessageState.title | title | YouTube API |
| MessageState.youtubeUrl | youtubeUrl | Telegram message |
| MessageState.youtubeId | youtubeId | URL extraction |
| CategorySelection.category | category | Inline keyboard |
| MessageState.ageRange | ageRange | Group mapping |
| (hardcoded) | status | Always "pending" |
| (empty array) | tags | Default |

---

## 3. Entity Relationships

```
┌─────────────────────────┐
│  Telegram Message       │
│  (YouTube Link)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  YouTube API            │
│  (Fetch Metadata)       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  MessageState           │◄───┐
│  (In-Memory Map)        │    │
│  • chatId:messageId     │    │
│  • youtubeUrl           │    │
│  • title                │    │
│  • ageRange (from map)  │    │
│  • expires in 24h       │    │
└───────────┬─────────────┘    │
            │                   │
            │                   │
┌───────────┴─────────────┐    │
│  Inline Keyboard        │    │
│  (Category Buttons)     │    │
└───────────┬─────────────┘    │
            │                   │
            ▼                   │
┌─────────────────────────┐    │
│  CategorySelection      │    │
│  (Callback Query)       │    │
└───────────┬─────────────┘    │
            │                   │
            │ Lookup by         │
            │ chatId:messageId  │
            └───────────────────┘
            │
            ▼
┌─────────────────────────┐
│  VideoSubmission        │
│  (Payload to Sanity)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Sanity CMS             │
│  (Video Document)       │
│  • Published content    │
│  • Admin review         │
└─────────────────────────┘
```

---

## 4. State Manager Interface

**Purpose**: Abstract state storage to allow future Redis migration

**Interface Definition**:

```typescript
interface IStateStore {
  /**
   * Store a pending video submission state
   * @param key - Unique key (chatId:messageId)
   * @param state - Message state to store
   */
  set(key: string, state: MessageState): Promise<void>;
  
  /**
   * Retrieve a pending submission state
   * @param key - Unique key (chatId:messageId)
   * @returns MessageState if found and not expired, null otherwise
   */
  get(key: string): Promise<MessageState | null>;
  
  /**
   * Delete a submission state (after processing or expiration)
   * @param key - Unique key (chatId:messageId)
   */
  delete(key: string): Promise<void>;
  
  /**
   * Remove all expired states (TTL cleanup)
   * @returns Number of states deleted
   */
  cleanup(): Promise<number>;
  
  /**
   * Get current number of active states (for monitoring)
   * @returns Count of non-expired states
   */
  size(): Promise<number>;
}
```

**Implementation: In-Memory Map**

```typescript
class MemoryStateStore implements IStateStore {
  private store: Map<string, MessageState> = new Map();
  
  async set(key: string, state: MessageState): Promise<void> {
    this.store.set(key, state);
  }
  
  async get(key: string): Promise<MessageState | null> {
    const state = this.store.get(key);
    if (!state) return null;
    
    // Check expiration
    if (Date.now() > state.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return state;
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async cleanup(): Promise<number> {
    const now = Date.now();
    let deleted = 0;
    
    for (const [key, state] of this.store.entries()) {
      if (now > state.expiresAt) {
        this.store.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }
  
  async size(): Promise<number> {
    return this.store.size;
  }
}
```

**Cleanup Schedule**:
- Run `cleanup()` every 1 hour using `setInterval`
- Log number of expired states deleted
- Alert if size exceeds 10,000 (potential memory leak)

---

## 5. Configuration Schema

### 5.1 Category Buttons Configuration

**Purpose**: Define inline keyboard button layout

**Storage**: Config file (`bot/src/config/categories.ts`)

**Schema**:

```typescript
interface CategoryButton {
  text: string;        // Display text
  value: VideoCategory; // Callback data value
}

const categoryButtons: CategoryButton[] = [
  { text: '📚 Education', value: 'education' },
  { text: '🎭 Entertainment', value: 'entertainment' },
  { text: '🎵 Music', value: 'music' },
  { text: '🔬 Science', value: 'science' },
  { text: '🎨 Arts & Crafts', value: 'arts-crafts' },
  { text: '⚽ Sports', value: 'sports' },
  { text: '🌳 Nature', value: 'nature' },
  { text: '📖 Stories', value: 'stories' },
];
```

**Keyboard Layout**: 2 columns × 4 rows

```typescript
import { InlineKeyboard } from 'grammy';

function createCategoryKeyboard(messageId: number, chatId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  categoryButtons.forEach((button, index) => {
    // Callback data format: "cat:messageId:chatId:category"
    keyboard.text(
      button.text, 
      `cat:${messageId}:${chatId}:${button.value}`
    );
    
    // New row after every 2 buttons
    if ((index + 1) % 2 === 0) {
      keyboard.row();
    }
  });
  
  return keyboard;
}
```

**Callback Data Format**: `cat:{messageId}:{chatId}:{category}`
- Prefix `cat:` identifies category selection callbacks
- `messageId` and `chatId` for MessageState lookup
- `category` is the selected value
- Total length: ~40 characters (well under 64-byte limit)

---

## 6. Data Flow Diagrams

### 6.1 Message Processing Flow

```
1. Curator posts YouTube link
   ↓
2. Bot receives message
   ↓
3. Extract chatId, messageId, userId
   ↓
4. Validate YouTube URL format ──┬─→ Invalid: Ignore message
   ↓                              │
   Valid                          │
   ↓                              │
5. Extract youtubeId from URL     │
   ↓                              │
6. Lookup ageRange from chatId ───┼─→ Not found: Use default/"uncategorized"
   ↓                              │
   Found                          │
   ↓                              │
7. Fetch video metadata from YouTube API ─┬─→ API Error: Retry 3x
   ↓                                      │    └─→ Still fails: Use URL as title
   Success                                │
   ↓                                      │
8. Create MessageState                    │
   {                                      │
     messageId, chatId, userId,           │
     youtubeUrl, youtubeId, title,        │
     timestamp, expiresAt (24h),          │
     ageRange                             │
   }                                      │
   ↓                                      │
9. Store in Map with key "${chatId}:${messageId}"
   ↓
10. Send inline keyboard with 8 category buttons
   ↓
11. Wait for callback (or expire after 24h)
```

### 6.2 Callback Processing Flow

```
1. Curator clicks category button
   ↓
2. Bot receives callback query
   ↓
3. Parse callback data: "cat:{messageId}:{chatId}:{category}"
   ↓
4. Construct key: "${chatId}:${messageId}"
   ↓
5. Lookup MessageState ──┬─→ Not found: Reply "Selection expired, please re-share video"
   ↓                     │    └─→ Delete callback message
   Found                 │
   ↓                     │
6. Validate callback userId == MessageState.userId ─┬─→ Mismatch: Reply "Only original sender can select"
   ↓                                                │
   Match                                            │
   ↓                                                │
7. Create VideoSubmission payload                   │
   {                                                │
     _type: 'video',                                │
     title: MessageState.title,                     │
     youtubeUrl: MessageState.youtubeUrl,           │
     youtubeId: MessageState.youtubeId,             │
     category: from callback,                       │
     ageRange: MessageState.ageRange,               │
     status: 'pending',                             │
     tags: []                                       │
   }                                                │
   ↓                                                │
8. Submit to Sanity CMS ──┬─→ API Error: Retry with exponential backoff (3 attempts)
   ↓                      │    └─→ All retries fail: Reply "Submission failed, please try again"
   Success                │         └─→ Keep MessageState for manual retry
   ↓                      │
9. Delete MessageState     │
   ↓                      │
10. Reply to curator: "✅ Video saved! Category: {category}, Age: {ageRange}"
   ↓
11. Answer callback query (removes loading state from button)
```

### 6.3 State Cleanup Flow

```
Every 1 hour:
  ↓
1. Get current timestamp
  ↓
2. Iterate through all MessageState entries
  ↓
3. For each state:
   ├─→ If now > state.expiresAt:
   │     └─→ Delete from Map
   │         └─→ Increment deleted counter
   └─→ Else: Keep
  ↓
4. Log: "Cleaned up {count} expired states"
  ↓
5. If Map.size > 10,000:
     └─→ Alert: "Potential memory leak detected"
```

---

## 7. Error Handling & Edge Cases

### 7.1 State Not Found During Callback

**Scenario**: Callback received but MessageState doesn't exist

**Causes**:
- State expired (>24h since message)
- Bot restarted (in-memory state lost)
- Message from different bot instance (if multi-instance)

**Handling**:
- Reply: "⏰ Selection expired. Please share the video link again."
- Delete inline keyboard from original message
- Answer callback query to clear loading state

### 7.2 Concurrent Selections for Same Message

**Scenario**: Two curators click different categories on same video message

**Prevention**:
- Validate `callback.userId == MessageState.userId`
- Only original poster can select category

**Handling**:
- If mismatch: Reply "❌ Only the person who shared the video can select its category"
- Do not process submission
- Answer callback query

### 7.3 Bot Restart During Pending Selection

**Scenario**: Bot restarts with active MessageStates in memory

**Current Behavior** (in-memory Map):
- All pending states lost
- Curators see "Selection expired" when clicking buttons

**Mitigation**:
- Document in quickstart.md: "Avoid bot restarts during active hours"
- Railway auto-restart: Happens rarely, acceptable for MVP

**Future Enhancement** (Redis):
- States persist across restarts
- No data loss

### 7.4 YouTube API Quota Exceeded

**Scenario**: Daily quota (10,000 units) exhausted

**Handling**:
- Catch quota error from YouTube API
- Reply: "⚠️ Video metadata unavailable. Using link as title."
- Create MessageState with `title = youtubeUrl`
- Allow category selection to proceed
- Submission still succeeds (Sanity doesn't require title from YouTube)

### 7.5 Sanity API Failures

**Scenario**: Network error, authentication failure, rate limit

**Handling**:
- Retry up to 3 times with exponential backoff:
  - Attempt 1: Immediate
  - Attempt 2: 2 seconds delay
  - Attempt 3: 4 seconds delay
- If all fail:
  - Reply: "❌ Submission failed. Please try selecting the category again."
  - Keep MessageState (allow re-selection)
  - Log error for admin investigation

### 7.6 Invalid YouTube URL After Initial Validation

**Scenario**: URL passes regex but is malformed

**Handling**:
- YouTube API fetch fails → use URL as title (fallback)
- Proceed with submission (Sanity validation will catch truly invalid URLs)

---

## 8. Monitoring & Metrics

### 8.1 State Metrics

```typescript
interface StateMetrics {
  activeStates: number;          // Current Map size
  expiredStatesCleanedUp: number; // From last cleanup run
  averageStateLifetime: number;   // Seconds from creation to deletion
  statesCreatedToday: number;     // New MessageStates created today
  statesCompletedToday: number;   // Successful submissions today
}
```

**Collection**:
- Log metrics every hour
- Track in structured JSON logs
- Use for capacity planning

### 8.2 Performance Metrics

```typescript
interface PerformanceMetrics {
  messageToButtonsTime: number;  // Target: <2s (SC-004)
  categoryToConfirmationTime: number; // Target: <5s (SC-008)
  youtubeApiFetchTime: number;   // Track API performance
  sanityCmsSubmitTime: number;   // Track CMS performance
}
```

**Alerting**:
- If `messageToButtonsTime > 5s`: Investigate YouTube API latency
- If `categoryToConfirmationTime > 10s`: Investigate Sanity API latency

---

## 9. Migration Path to Redis

When scaling requires multi-instance deployment or state persistence:

### 9.1 Redis Schema

**Key Format**: `bot:message:{chatId}:{messageId}`

**Value**: JSON-serialized MessageState

**TTL**: 24 hours (Redis native EXPIRE command)

**Example**:
```bash
SET bot:message:-1001234567890:12345 '{"messageId":12345,"chatId":-1001234567890,...}'
EXPIRE bot:message:-1001234567890:12345 86400
```

### 9.2 Code Changes

**Minimal**: Only `MemoryStateStore` implementation changes

```typescript
class RedisStateStore implements IStateStore {
  constructor(private redis: Redis) {}
  
  async set(key: string, state: MessageState): Promise<void> {
    await this.redis.set(
      `bot:message:${key}`,
      JSON.stringify(state),
      'EX',
      86400 // 24h TTL
    );
  }
  
  async get(key: string): Promise<MessageState | null> {
    const data = await this.redis.get(`bot:message:${key}`);
    return data ? JSON.parse(data) : null;
  }
  
  async delete(key: string): Promise<void> {
    await this.redis.del(`bot:message:${key}`);
  }
  
  async cleanup(): Promise<number> {
    // Redis handles TTL automatically
    return 0;
  }
  
  async size(): Promise<number> {
    const keys = await this.redis.keys('bot:message:*');
    return keys.length;
  }
}
```

**No changes needed** in message handlers, callback handlers, or bot logic.

---

## Summary

This data model provides:

1. **Ephemeral state management** for message-callback correlation
2. **Clear entity relationships** between Telegram messages, YouTube metadata, and Sanity documents
3. **Abstracted storage interface** for easy Redis migration
4. **Robust validation** at each layer
5. **Comprehensive error handling** for edge cases
6. **Monitoring hooks** for performance tracking
7. **Configuration flexibility** for deployment environments

**Next Steps**:
- Generate API contracts (Phase 1)
- Implement TypeScript interfaces in `bot/src/types/`
- Create unit tests for state manager
- Document deployment configuration
