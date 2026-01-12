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
