/**
 * Playlist Collection Schema
 *
 * Ordered, shareable lists of videos. Videos are referenced, not copied, so a
 * video can belong to many playlists. Created from the website or the Telegram bot.
 */

import type { CollectionConfig } from "payload";
import { slugify } from "../../utils/slugify";

const isStaff = (user: any) =>
  user?.role === "superadmin" || user?.role === "admin";

export const Playlist: CollectionConfig = {
  slug: "playlists",

  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "owner", "organization", "isPublic", "updatedAt"],
    description: "Ordered playlists of videos",
  },

  access: {
    // Public playlists are readable by everyone; private ones by owner/org/staff
    read: ({ req }) => {
      const user = req.user as any;
      if (!user) return { isPublic: { equals: true } };
      if (isStaff(user)) return true;
      const or: any[] = [
        { isPublic: { equals: true } },
        { owner: { equals: user.id } },
      ];
      if (user.organization) {
        const orgId =
          typeof user.organization === "object"
            ? user.organization.id
            : user.organization;
        or.push({ organization: { equals: orgId } });
      }
      return { or };
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      const user = req.user as any;
      if (!user) return false;
      if (isStaff(user)) return true;
      return { owner: { equals: user.id } };
    },
    delete: ({ req }) => {
      const user = req.user as any;
      if (!user) return false;
      if (isStaff(user)) return true;
      return { owner: { equals: user.id } };
    },
  },

  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (!data) return data;
        if (data.title && !data.slug) {
          // Random suffix keeps slugs unique when titles collide
          data.slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 7)}`;
        }
        if (operation === "create" && !data.owner && req.user) {
          data.owner = req.user.id;
          if (!data.organization && (req.user as any).organization) {
            const org = (req.user as any).organization;
            data.organization = typeof org === "object" ? org.id : org;
          }
        }
        return data;
      },
    ],
  },

  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      maxLength: 120,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      maxLength: 140,
      admin: { position: "sidebar", description: "Auto-generated from title" },
    },
    {
      name: "description",
      type: "textarea",
      maxLength: 500,
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "organization",
      type: "relationship",
      relationTo: "organizations",
      admin: { position: "sidebar" },
    },
    {
      name: "isPublic",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Public playlists can be viewed by anyone with the link",
      },
    },
    {
      // Order of this array is the playback order
      name: "items",
      type: "array",
      labels: { singular: "Video", plural: "Videos" },
      fields: [
        {
          name: "video",
          type: "relationship",
          relationTo: "videos",
          required: true,
        },
      ],
    },
  ],

  timestamps: true,
};
