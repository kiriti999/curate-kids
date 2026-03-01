/**
 * Video Collection Schema
 *
 * Stores video content from YouTube with metadata, categorization, and engagement metrics.
 * Migrated from Sanity CMS video document type.
 */

import type { CollectionConfig } from "payload";
import {
  PAYLOAD_CONFIG,
  VIDEO_AGE_RANGE_OPTIONS,
  VIDEO_CATEGORY_OPTIONS,
} from "../../config/constants";
import {
  afterReadVideoHook,
  beforeChangeVideoHook,
  beforeValidateVideoHook,
} from "../hooks/videoHooks";

export const Video: CollectionConfig = {
  slug: "videos",

  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "ageRange", "viewCount", "createdAt"],
    description: "YouTube videos with metadata and engagement tracking",
  },

  // Access control
  access: {
    read: () => true, // Public read access for frontend
    create: ({ req }) => !!req.user, // Authenticated users only
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },

  fields: [
    // Title
    {
      name: "title",
      type: "text",
      required: true,
      maxLength: 200,
      admin: {
        description: "Video title displayed to users",
      },
    },

    // Slug (URL-safe identifier)
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      maxLength: 96,
      admin: {
        position: "sidebar",
        description: "URL-safe identifier (auto-generated from title)",
      },
      // Note: Auto-generation will be handled by beforeValidate hook
    },

    // Video source (url = YouTube/link-based, telegram = direct upload to Cloudinary)
    {
      name: "source",
      type: "select",
      defaultValue: "url",
      options: [
        { label: "URL (YouTube/Link)", value: "url" },
        { label: "Telegram Upload", value: "telegram" },
      ],
      admin: {
        description: "How the video was added",
        position: "sidebar",
      },
    },

    // YouTube URL
    {
      name: "youtubeUrl",
      type: "text",
      required: false,
      admin: {
        description:
          "Full YouTube URL (e.g., https://www.youtube.com/watch?v=...)",
        condition: (data) => !data.source || data.source === "url",
      },
      validate: (value: string | null | undefined, { data }: any) => {
        // Not required for telegram uploads
        if (data?.source === "telegram") return true;
        if (!value) return "YouTube URL is required for URL-based videos";
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/;
        if (!youtubeRegex.test(value)) {
          return "Please enter a valid YouTube URL";
        }
        return true;
      },
    },

    // YouTube ID (auto-extracted from URL)
    {
      name: "youtubeId",
      type: "text",
      required: false,
      maxLength: 11,
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Auto-extracted YouTube video ID (11 characters)",
      },
    },

    // Cloudinary URL (for Telegram-uploaded videos)
    {
      name: "cloudinaryUrl",
      type: "text",
      admin: {
        description: "Cloudinary video URL (auto-populated for Telegram uploads)",
        condition: (data) => data.source === "telegram",
      },
    },

    // Cloudinary public ID
    {
      name: "cloudinaryId",
      type: "text",
      admin: {
        description: "Cloudinary public ID (auto-populated for Telegram uploads)",
        condition: (data) => data.source === "telegram",
        position: "sidebar",
      },
    },

    // Thumbnail URL (for Cloudinary videos)
    {
      name: "thumbnailUrl",
      type: "text",
      admin: {
        description: "Thumbnail image URL (auto-generated for Cloudinary uploads)",
        condition: (data) => data.source === "telegram",
      },
    },

    // Video duration (in seconds)
    {
      name: "duration",
      type: "number",
      admin: {
        description: "Video duration in seconds",
        position: "sidebar",
      },
    },

    // Category (select from predefined options)
    {
      name: "category",
      type: "select",
      required: true,
      options: VIDEO_CATEGORY_OPTIONS.map((opt) => ({
        label: opt.title,
        value: opt.value,
      })),
      admin: {
        description: "Video category",
      },
    },

    // Age Range
    {
      name: "ageRange",
      type: "select",
      required: true,
      options: VIDEO_AGE_RANGE_OPTIONS.map((opt) => ({
        label: opt.title,
        value: opt.value,
      })),
      admin: {
        description: "Target age range for this video",
      },
    },

    // Tags
    {
      name: "tags",
      type: "array",
      maxRows: PAYLOAD_CONFIG.MAX_TAGS,
      admin: {
        description: `Searchable tags (max ${PAYLOAD_CONFIG.MAX_TAGS})`,
      },
      fields: [
        {
          name: "tag",
          type: "text",
          required: true,
        },
      ],
    },

    // Admin notes
    {
      name: "notes",
      type: "textarea",
      admin: {
        description: "Internal notes (not displayed publicly)",
        position: "sidebar",
      },
    },

    // View count (calculated from ActivityLog)
    {
      name: "viewCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Total views (aggregated from activity logs)",
      },
    },

    // Last viewed timestamp
    {
      name: "lastViewedAt",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Timestamp of last view event",
      },
    },

    // Organization (multi-tenant)
    {
      name: "organization",
      type: "relationship",
      relationTo: "organizations",
      required: true,
      admin: {
        description: "Organization this video belongs to",
        position: "sidebar",
      },
    },

    // Submitted by (user who posted via Telegram)
    {
      name: "submittedBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        description: "User who submitted this video",
        position: "sidebar",
      },
    },

    // Submitter Telegram ID (before user links account)
    {
      name: "submitterTelegramId",
      type: "text",
      admin: {
        description: "Telegram ID of submitter (before account linking)",
        position: "sidebar",
      },
    },

    // Submitter Telegram username
    {
      name: "submitterTelegramUsername",
      type: "text",
      admin: {
        description: "Telegram username of submitter",
        position: "sidebar",
      },
    },

    // Approval status
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: {
        description: "Approval status of the video",
      },
    },

    // Approved by
    {
      name: "approvedBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        description: "Admin who approved this video",
        position: "sidebar",
        condition: (data) => data.status === "approved",
      },
    },

    // Approved at timestamp
    {
      name: "approvedAt",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "When the video was approved",
        condition: (data) => data.status === "approved",
      },
    },

    // Rejection reason
    {
      name: "rejectionReason",
      type: "textarea",
      admin: {
        description: "Reason for rejection",
        position: "sidebar",
        condition: (data) => data.status === "rejected",
      },
    },
  ],

  // Hooks
  hooks: {
    // T019: Extract YouTube ID and generate slug before validation
    beforeValidate: [beforeValidateVideoHook],

    // Prevent duplicate videos per category + ageRange
    beforeChange: [beforeChangeVideoHook],

    // T020: Calculate viewCount from ActivityLog (implemented for future use)
    afterRead: [afterReadVideoHook],
  },
};
