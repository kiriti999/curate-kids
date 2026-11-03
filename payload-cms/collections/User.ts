/**
 * User Collection Schema
 * 
 * Admin and editor user accounts with role-based access control.
 * Used for PayloadCMS admin authentication.
 */

import { CollectionConfig } from 'payload'
import { isOrgAdmin, isPlatformAdmin, relationId } from '../../utils/access'
import { USER_ROLES, USER_STATUSES } from '../../config/constants'
import { beforeChangeUserHook, afterLoginUserHook } from '../hooks/userHooks'

function userScope(user: any) {
  if (!user) return false
  if (isPlatformAdmin(user)) return true
  const or: Record<string, unknown>[] = [{ id: { equals: user.id } }]
  if (isOrgAdmin(user)) or.push({ organization: { equals: relationId(user.organization) } })
  return { or }
}

// Only platform admins may change privileges; org admins and users can't promote anyone
const platformAdminOnly = {
  update: ({ req }: { req: { user?: any } }) => isPlatformAdmin(req.user),
}

export const User: CollectionConfig = {
  slug: 'users',

  auth: {
    // Forgot password
    forgotPassword: {
      generateEmailHTML: ({ token, user }) => {
        const resetURL = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`
        return `
          <h1>Reset Your Password</h1>
          <p>Hi ${user.name || 'there'},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetURL}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${resetURL}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `
      },
      generateEmailSubject: () => 'Reset your CuratedReels password',
    },
    tokenExpiration: 86400, // 24 hours
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'status', 'emailVerified', 'lastLoginAt'],
    description: 'Admin, editor, and viewer user accounts',
  },

  // Access control
  access: {
    // Platform admins see everyone; org admins their organization's members; others only themselves
    read: ({ req }) => userScope(req.user),
    // Only admins can create users (no public signup)
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'superadmin',
    update: ({ req }) => userScope(req.user),
    delete: ({ req }) => (isPlatformAdmin(req.user) || isOrgAdmin(req.user) ? userScope(req.user) : false),
  },

  fields: [
    // Full name
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'User\'s full name',
      },
    },

    // Role (now includes organization-specific roles)
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'contributor',
      access: platformAdminOnly,
      options: [
        { label: 'Super Admin', value: 'superadmin' },
        { label: 'Admin (Org Owner)', value: 'admin' },
        { label: 'Contributor', value: 'contributor' },
        { label: 'Viewer', value: 'viewer' },
      ],
      admin: {
        description: 'User role - admin can manage org, contributors can post videos',
      },
    },

    // Organization (multi-tenant)
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      access: platformAdminOnly,
      admin: {
        description: 'Organization this user belongs to',
        position: 'sidebar',
      },
    },

    // Telegram ID (for linking)
    {
      name: 'telegramId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Linked Telegram user ID',
        position: 'sidebar',
      },
    },

    // Telegram username
    {
      name: 'telegramUsername',
      type: 'text',
      admin: {
        description: 'Linked Telegram username (@handle)',
        position: 'sidebar',
      },
    },

    // Telegram first name
    {
      name: 'telegramFirstName',
      type: 'text',
      admin: {
        description: 'Telegram first name',
        position: 'sidebar',
      },
    },

    // When Telegram was linked
    {
      name: 'telegramLinkedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'When Telegram account was linked',
        position: 'sidebar',
      },
    },

    // Status
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      access: platformAdminOnly,
      options: [...USER_STATUSES],
      admin: {
        description: 'Account status',
      },
    },

    // Added by (admin who created this user)
    {
      name: 'addedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Admin who created this user account',
      },
    },

    // Last login timestamp
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Timestamp of last successful login',
      },
    },

    // Login count
    {
      name: 'loginCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total number of successful logins',
      },
    },

    // Video submission count
    {
      name: 'videoCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total videos submitted by this user',
      },
    },

    // Admin notes
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this user',
        position: 'sidebar',
      },
    },

    // Deactivated timestamp
    {
      name: 'deactivatedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Timestamp when user was deactivated',
        condition: (data) => data.status === 'inactive',
      },
    },
  ],

  // Hooks
  hooks: {
    // T024: Set addedBy, prevent role changes, set deactivatedAt timestamp
    beforeChange: [beforeChangeUserHook],

    // T025: Update lastLoginAt and loginCount on successful login
    afterLogin: [afterLoginUserHook],
  },

}
