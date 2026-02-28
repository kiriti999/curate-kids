/**
 * PayloadCMS Configuration
 *
 * Main configuration file for PayloadCMS backend.
 * Defines database connection, admin UI, collections, and server settings.
 */

import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ActivityLog } from "./payload-cms/collections/ActivityLog";
import { AdPlacement } from "./payload-cms/collections/AdPlacement";
import { AffiliatePartner } from "./payload-cms/collections/AffiliatePartner";
import { Category } from "./payload-cms/collections/Category";
import { Media } from "./payload-cms/collections/Media";
import { Organization } from "./payload-cms/collections/Organization";
import { TermsAcceptance } from "./payload-cms/collections/TermsAcceptance";
import { User } from "./payload-cms/collections/User";
// Import collections
import { Video } from "./payload-cms/collections/Video";

export default buildConfig({
  // Secret key for JWT and encryption
  secret: process.env.PAYLOAD_SECRET || "fallback-key-please-set-env-var",

  // Routes configuration
  routes: {
    admin: "/admin",
    api: "/api",
  },

  // Admin panel configuration
  admin: {
    user: "users",
    meta: {
      titleSuffix: "- CuratedReels CMS",
    },
  },

  // Rich text editor
  editor: lexicalEditor(),

  // Email configuration for verification and password reset
  ...(process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
      email: nodemailerAdapter({
        defaultFromAddress:
          process.env.SMTP_FROM_EMAIL || "noreply@curatedreels.com",
        defaultFromName: process.env.SMTP_FROM_NAME || "CuratedReels",
        transportOptions: {
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      }),
    }
    : {}),

  // Collections
  collections: [
    User,
    Organization,
    Video,
    Category,
    ActivityLog,
    AdPlacement,
    AffiliatePartner,
    Media,
    TermsAcceptance,
  ],

  // TypeScript type generation
  typescript: {
    outputFile: path.resolve(__dirname, "types/payload.ts"),
  },

  // Database configuration
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || "mongodb://localhost:27017/curatedreels",
  }),

  // Create default admin on first init if no admin users exist
  onInit: async (payload) => {
    try {
      console.log("[PayloadCMS] onInit hook started");

      // Check if any admin/superadmin users exist (not just any user)
      const adminUsers = await payload.find({
        collection: "users",
        where: {
          or: [
            { role: { equals: "admin" } },
            { role: { equals: "superadmin" } },
          ],
        },
        limit: 1,
      });

      console.log(`[PayloadCMS] Found ${adminUsers.docs.length} admin users`);

      if (adminUsers.docs.length === 0) {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@curatedreels.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
        const adminName = process.env.ADMIN_NAME || "Admin User";

        console.log(`[PayloadCMS] Creating admin user: ${adminEmail}`);

        const user = await payload.create({
          collection: "users",
          data: {
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: "superadmin",
            status: "active",
          },
          draft: false,
        });

        console.log(
          `[PayloadCMS] ✅ Admin user created: ${user.email} (ID: ${user.id})`,
        );
        payload.logger.info(`✅ Default admin user created: ${adminEmail}`);
        payload.logger.warn(
          "⚠️  IMPORTANT: Change the default password immediately!",
        );
      } else {
        console.log(
          "[PayloadCMS] Admin user already exists, skipping creation",
        );
      }
    } catch (error) {
      console.error("[PayloadCMS] ❌ Error in onInit hook:", error);
      // Don't throw - let the app start even if this fails
    }
  },

  // CORS configuration for frontend access
  cors: [
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001",
    process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",
    "http://localhost:4002",
  ],
});
