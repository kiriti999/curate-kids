# CuratedReels Telegram Bot (Deno)

Telegram bot for curating videos from YouTube, Facebook, Instagram, and LinkedIn. Uses MongoDB Atlas for video storage and metadata management.

## Local Development

1. Install Deno: https://deno.land/manual/getting_started/installation

2. Copy environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Run locally:
   ```bash
   deno task dev
   ```

## Deploy to Deno Deploy (Free)

1. Go to [dash.deno.com](https://dash.deno.com)
2. Sign in with GitHub
3. Click **New Project** → **Import from GitHub**
4. Select your repo, set:
   - **Entry point:** `src/main.ts`
5. Add environment variables in Settings
6. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `MONGODB_URI` | MongoDB Atlas connection string (e.g., mongodb+srv://user:pass@cluster.mongodb.net/curatekids) |
| `YOUTUBE_API_KEY` | Google Cloud Console |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional, for direct uploads) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (optional) |
| `TELEGRAM_GROUP` | Chat ID for group |

## MongoDB Atlas Setup

1. **Create MongoDB Atlas Account** (free tier available)
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   
2. **Create a Free Cluster**
   - Select **M0 Free Tier** (512 MB storage)
   - Choose your preferred cloud provider and region
   - Name your cluster (e.g., "curatekids-cluster")

3. **Configure Network Access**
   - Go to **Network Access** → **Add IP Address**
   - Select **Allow Access from Anywhere** (0.0.0.0/0)
   - Or add specific IPs for better security

4. **Create Database User**
   - Go to **Database Access** → **Add New Database User**
   - Choose **Password** authentication
   - Username: `curatekids_user` (or your choice)
   - Auto-generate a secure password
   - Database User Privileges: **Read and write to any database**

5. **Get Connection String**
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `myFirstDatabase` with `curatekids`
   - Add to `.env` as `MONGODB_URI`

6. **Database and Collection**
   - The bot automatically creates the `curatekids` database
   - The bot automatically creates the `videos` collection
   - The bot automatically creates necessary indexes on first connection

## Videos Collection Schema

The bot stores videos in MongoDB with the following structure:

```javascript
{
  "_id": ObjectId,          // Auto-generated MongoDB ID
  "title": String,          // Video title (required)
  "slug": String,           // URL-friendly slug (required, unique)
  "youtubeUrl": String,     // Full YouTube URL (conditional)
  "youtubeId": String,      // YouTube video ID (conditional)
  "cloudinaryUrl": String,  // Cloudinary hosted URL (conditional)
  "cloudinaryId": String,   // Cloudinary public ID (conditional)
  "thumbnailUrl": String,   // Thumbnail image URL (optional)
  "duration": Number,       // Video duration in seconds (optional)
  "category": String,       // One of: education, entertainment, music, science, arts-crafts, sports, nature, stories
  "ageRange": String,       // One of: 0-2, 3-5, 6-8, 9-12, 13+
  "tags": [String],         // Array of tags (optional)
  "source": String,         // Either "url" or "telegram"
  "createdAt": Date,        // Creation timestamp
  "updatedAt": Date         // Last update timestamp
}
```

**Validation Rules:**
- If `source = "url"`: `youtubeUrl` and `youtubeId` are required
- If `source = "telegram"`: `cloudinaryUrl` and `cloudinaryId` are required
- `slug` must be unique across all videos

**Indexes (created automatically):**
- Unique index on `slug`
- Index on `category`
- Index on `ageRange`
- Index on `createdAt` (descending)
- Compound index on `category` + `ageRange`

## Supported Platforms

- ✅ YouTube (with metadata)
- ✅ Facebook
- ✅ Instagram
- ✅ LinkedIn

## Architecture

- **Bot Framework:** grammy (Telegram bot framework)
- **Runtime:** Deno (TypeScript runtime)
- **Database:** MongoDB Atlas (cloud-hosted MongoDB)
- **Deployment:** Deno Deploy (serverless platform)
- **Video Storage:** Cloudinary (for Telegram uploads)
