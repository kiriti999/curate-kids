# CurateKids - Youth Content CMS

A headless CMS built with Sanity Studio for curating age-appropriate YouTube videos with dynamic ad management, category hierarchies, and activity logging.

## Overview

CurateKids is a comprehensive content management system designed to organize YouTube videos by age-based categories, manage dynamic ad placements, track affiliate partnerships, and log all user activity for analytics.

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
- Sanity account (free tier available)

### Environment Variables

Create a `.env` file in the project root with the following variables:

#### Required Variables

These environment variables are **required** for the application to run:

| Variable | Description | Example |
|----------|-------------|---------|
| `SANITY_PROJECT_ID` | Sanity project ID from project settings | `3rcl6ir9` |
| `SANITY_DATASET` | Sanity dataset name (usually 'production') | `production` |
| `SANITY_TOKEN` | Sanity API token for write operations | `skXXXXXXXXXXXXXX` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Public Sanity project ID for frontend | `3rcl6ir9` |
| `NEXT_PUBLIC_SANITY_DATASET` | Public dataset name for frontend | `production` |

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
   # Edit .env and add your Sanity credentials
   ```

3. **Seed age range categories** (first-time setup):
   ```bash
   # Export token if not in .env
   export SANITY_TOKEN="your-sanity-token"
   pnpm tsx scripts/seed-age-ranges.ts
   ```

4. **Start development servers**:
   ```bash
   # Start Sanity Studio (CMS backend)
   pnpm dev
   
   # In a separate terminal, start Next.js frontend
   cd frontend
   pnpm dev
   ```

5. **Access applications**:
   - Sanity Studio: `http://localhost:3333`
   - Frontend: `http://localhost:3000`

### Verification

After setup, verify the installation:

```bash
# Run TypeScript compilation check
pnpm tsc --noEmit

# Run ESLint checks
pnpm lint

# Test Sanity connection
pnpm tsx scripts/extract-youtube-ids.ts --dry-run
```

### Installation

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd curatekids
   pnpm install
   ```

2. **Seed age range categories**:
   ```bash
   export SANITY_TOKEN="your-sanity-token"
   pnpm tsx scripts/seed-age-ranges.ts
   ```

3. **Start development**:
   ```bash
   pnpm dev
   ```

4. **Access Studio**: `http://localhost:3333`

## Quick Start

### Adding Videos

1. Navigate to Videos → Create new document
2. Paste YouTube URL (auto-extracts ID)
3. Select category (leaf nodes only)
4. Set status to "Published"
5. Save (publishedAt auto-set)

### Managing Categories

1. Age ranges are pre-seeded and protected
2. Create subcategories under age ranges
3. Use sortOrder for custom positioning
4. Deletion blocked if has children/videos

### Creating Ads (Admins Only)

1. Choose position (header/footer/sidebar/inline/floating)
2. Configure content (HTML or image)
3. Set priority and targeting
4. Link affiliate partner (optional)

## Architecture

### Technology Stack

- **CMS**: Sanity Studio 5.2.0
- **Language**: TypeScript 5.8+
- **Framework**: React 19.1

### Schema Structure

- **Category**: Hierarchical age-based organization
- **Video**: YouTube videos with metadata
- **User**: Role-based access (admin/editor)
- **AdPlacement**: Dynamic ad system
- **AffiliatePartner**: Partner tracking
- **ActivityLog**: Analytics logging

## Quick Start

### Adding Videos

1. Navigate to Videos → Create new document
2. Paste YouTube URL (auto-extracts ID)
3. Select category (leaf nodes only)
4. Set status to "Published"
5. Save (publishedAt auto-set)

### Managing Categories

1. Age ranges are pre-seeded and protected
2. Create subcategories under age ranges
3. Use sortOrder for custom positioning
4. Deletion blocked if has children/videos

### Creating Ads (Admins Only)

1. Choose position (header/footer/sidebar/inline/floating)
2. Configure content (HTML or image)
3. Set priority and targeting
4. Link affiliate partner (optional)

## Documentation

- Full specification: `/specs/001-youth-cms/spec.md`
- Data model: `/specs/001-youth-cms/data-model.md`
- Technical research: `/specs/001-youth-cms/research.md`
- Task breakdown: `/specs/001-youth-cms/tasks.md`

## Support

For issues or questions, review the `/specs/001-youth-cms/` documentation.

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-10
