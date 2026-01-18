/**
 * User Collection Schema
 * 
 * Admin and editor user accounts with role-based access control.
 * Used for PayloadCMS admin authentication.
 * Migrated from Sanity CMS user document type.
 */

import { CollectionConfig } from 'payload'
import { USER_ROLES, USER_STATUSES } from '../../config/constants'
import { beforeChangeUserHook, afterLoginUserHook } from '../hooks/userHooks'

export const User: CollectionConfig = {
  slug: 'users',
  
  auth: true, // Enable authentication for this collection
  
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'status', 'lastLoginAt'],
    description: 'Admin and editor user accounts',
  },
  
  // Access control
  access: {
    // Users can read their own data and admins can read all
    read: ({ req }) => {
      if (req.user) {
        if (req.user.role === 'admin') {
          return true
        }
        return {
          id: {
            equals: req.user.id,
          },
        }
      }
      return false
    },
    // Only admins can create users
    create: ({ req }) => req.user?.role === 'admin',
    // Users can update their own data, admins can update all
    update: ({ req }) => {
      if (req.user) {
        if (req.user.role === 'admin') {
          return true
        }
        return {
          id: {
            equals: req.user.id,
          },
        }
      }
      return false
    },
    // Only admins can delete users
    delete: ({ req }) => req.user?.role === 'admin',
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
    
    // Role
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: USER_ROLES,
      admin: {
        description: 'User role (admin or editor) - cannot be changed after creation',
      },
      // Role immutability will be enforced by beforeChange hook
    },
    
    // Status
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: USER_STATUSES,
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
      // Will be auto-set by beforeChange hook
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
