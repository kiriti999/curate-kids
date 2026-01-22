# CuratedReels - Youth Content CMS

A headless CMS built with PayloadCMS for curating age-appropriate YouTube videos with dynamic ad management, category hierarchies, and activity logging.

## Overview

CuratedReels is a comprehensive content management system designed to organize YouTube videos by age-based categories, manage dynamic ad placements, track affiliate partnerships, and log all user activity for analytics.

### Key Features

- **Age-Based Category Hierarchy**: 7 predefined age ranges (0-2, 2-4, 5-7, 8-9, 10-15, 16+, 18+) with unlimited subcategories
- **YouTube Video Management**: Automatic metadata extraction, YouTube ID parsing, and category assignment
- **Dynamic Ad Placement**: Position-aware ads (header, footer, sidebar, inline, floating) with scheduling and targeting
- **Affiliate Partner Management**: Track partners, commissions, and performance metrics
- **Role-Based Access Control**: Admin and editor roles with granular permissions
- **Activity Logging**: Comprehensive logging for analytics (video views, ad impressions/clicks, user actions)
- **Real-time Computed Fields**: Auto-calculated paths, counts, metrics, and timestamps

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/pnpm
- MongoDB 6.0+ (local or cloud instance)

### Environment Variables

Create a `.env` file in the project root with the following variables:

#### Required Variables

These environment variables are **required** for the application to run:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/curatekids` |
| `PAYLOAD_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |
| `NEXT_PUBLIC_PAYLOAD_API_URL` | PayloadCMS API URL for frontend | `http://localhost:3000` |

#### Optional Variables

These variables are optional and only needed for specific features:

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | If using Cloudinary for image uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | If using Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | If using Cloudinary |
| `YOUTUBE_API_KEY` | YouTube Data API key | If using YouTube API for metadata enrichment |

**Note**: The application will fail fast with a clear error message if required variables are missing. See `.env.example` for a template.

### Development Setup

Follow these steps to set up the development environment:

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd curatekids
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your MongoDB URI and PayloadCMS secret
   ```

3. **Seed age range categories** (first-time setup):
   ```bash
   pnpm tsx scripts/seed-age-ranges.ts
   ```

4. **Start development servers**:
   ```bash
   # Start PayloadCMS server (CMS backend + Admin UI)
   pnpm dev
   
   # In a separate terminal, start Next.js frontend
   cd frontend
   pnpm dev
   ```

5. **Access applications**:
   - PayloadCMS Admin: `http://localhost:3000/admin`
   - Frontend: `http://localhost:3001`

6. **Create first admin user**:
   - Navigate to `http://localhost:3000/admin`
   - Follow the setup wizard to create your first admin account

### Verification

After setup, verify the installation:

```bash
# Run TypeScript compilation check
pnpm tsc --noEmit

# Run ESLint checks
pnpm lint

# Test PayloadCMS connection
pnpm dev
```

## Quick Start

### Adding Videos

1. Navigate to Videos → Create new document in PayloadCMS Admin
2. Paste YouTube URL (auto-extracts ID)
3. Select category and age range
4. Add tags (optional)
5. Save (createdAt auto-set)

### Managing Categories

1. Age ranges are pre-seeded and protected (cannot be deleted)
2. Create subcategories under age ranges
3. Use sortOrder for custom positioning
4. Depth and fullPath are auto-calculated
5. Deletion blocked if has children or videos

### Creating Ads (Admins Only)

1. Choose position (header/footer/sidebar/inline/floating)
2. Configure content (HTML or image)
3. Set priority and targeting (age ranges)
4. Link affiliate partner (optional)
5. Set status and schedule dates

## Architecture

### Technology Stack

- **CMS**: PayloadCMS 3.72.0
- **Database**: MongoDB 6.0+
- **Language**: TypeScript 5.8+
- **Framework**: React 19.1 + Next.js 16

### Collections

- **Category**: Hierarchical age-based organization
- **Video**: YouTube videos with metadata
- **User**: Role-based access (admin/editor)
- **AdPlacement**: Dynamic ad system
- **AffiliatePartner**: Partner tracking
- **ActivityLog**: Analytics logging

## Admin Scripts

### Extract YouTube IDs
```bash
pnpm tsx scripts/extract-youtube-ids.ts
```
Automatically extracts and updates YouTube IDs from URLs for all videos.

### Seed Age Ranges
```bash
pnpm tsx scripts/seed-age-ranges.ts
```
Creates the 7 predefined age range root categories (run once during setup).

## Migration from Sanity

If you're migrating from Sanity CMS:

```bash
# Export data from Sanity
pnpm run migrate:export

# Transform data to PayloadCMS format
pnpm run migrate:transform

# Import to PayloadCMS (dry run first)
pnpm run migrate:import:dry-run

# Import for real
pnpm run migrate:import

# Verify migration
pnpm run migrate:verify
```

See `/migration/` directory for scripts and `/specs/001-sanity-payload-migration/` for detailed migration documentation.

## Documentation

- Migration specification: `/specs/001-sanity-payload-migration/spec.md`
- Data model: `/specs/001-sanity-payload-migration/data-model.md`
- Technical research: `/specs/001-sanity-payload-migration/research.md`
- Task breakdown: `/specs/001-sanity-payload-migration/tasks.md`

## Support

For issues or questions, review the `/specs/001-sanity-payload-migration/` documentation.

---

**Version**: 2.0.0 (PayloadCMS)  
**Last Updated**: 2025-01-18
