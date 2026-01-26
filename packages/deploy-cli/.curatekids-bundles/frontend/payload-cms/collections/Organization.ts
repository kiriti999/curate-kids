/**
 * Organization Collection Schema
 * 
 * Represents a Telegram group as an organization.
 * Each group owner becomes an admin of their organization.
 * Members of the group become contributors.
 */

import { CollectionConfig } from 'payload'
import { afterDeleteOrganizationHook } from '../hooks/organizationHooks'

export const Organization: CollectionConfig = {
    slug: 'organizations',

    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'ageRange', 'owner', 'memberCount', 'createdAt'],
        description: 'Telegram groups as organizations',
    },

    access: {
        // Allow anyone to read organizations (needed for user creation dropdown)
        // For more restrictive access, you could check if the request is from admin UI
        read: ({ req }) => {
            // No user - allow read for dropdowns during registration
            if (!req.user) return true

            const user = req.user as any
            if (user.role === 'superadmin' || user.role === 'admin') return true

            // Regular users can only see their organization
            return {
                id: {
                    equals: user.organization,
                },
            }
        },
        // Only superadmins can create organizations (bot creates via API)
        create: ({ req }) => {
            // Allow API access (for bot) or superadmin
            if (!req.user) return true // API access
            const user = req.user as any
            return user.role === 'superadmin'
        },
        // Admins can update their organization settings
        update: ({ req }) => {
            if (!req.user) return false
            const user = req.user as any
            if (user.role === 'superadmin') return true

            return {
                id: {
                    equals: user.organization,
                },
            }
        },
        // Only superadmins can delete organizations
        delete: ({ req }) => (req.user as any)?.role === 'superadmin',
    },

    fields: [
        // Organization name (from Telegram group title)
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: {
                description: 'Organization name (from Telegram group title)',
            },
        },

        // Telegram Group ID
        {
            name: 'telegramGroupId',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'Telegram group/chat ID',
            },
        },

        // Age range for this organization's content
        // @deprecated - Age ranges are now selected per video, not per organization
        // This field is kept for backward compatibility and display purposes only
        {
            name: 'ageRange',
            type: 'select',
            required: false, // No longer required - age ranges are per-video
            options: [
                // Empty/Not Set (for new organizations)
                { label: 'Not Set (Age range selected per video)', value: '' },
                // Legacy options
                { label: '0-2 Years', value: '0-2' },
                { label: '3-5 Years', value: '3-5' },
                { label: '6-8 Years', value: '6-8' },
                { label: '9-12 Years', value: '9-12' },
                { label: '13+ Years', value: '13+' },
                // New options (for reference)
                { label: '1-2 Years', value: '1-2' },
                { label: '2-3 Years', value: '2-3' },
                { label: '3-4 Years', value: '3-4' },
                { label: '4-5 Years', value: '4-5' },
                { label: '5-8 Years', value: '5-8' },
                { label: '12-15 Years', value: '12-15' },
                { label: '16-18 Years', value: '16-18' },
                { label: '18+ Years', value: '18+' },
            ],
            admin: {
                description: '[Deprecated] Age ranges are now selected per video. This field is optional.',
            },
        },

        // Organization owner (group creator)
        {
            name: 'owner',
            type: 'relationship',
            relationTo: 'users',
            required: false, // Set when owner links account
            admin: {
                description: 'Organization owner (Telegram group creator)',
            },
        },

        // Owner's Telegram ID (stored before linking)
        {
            name: 'ownerTelegramId',
            type: 'text',
            admin: {
                description: 'Owner Telegram ID (before account linking)',
            },
        },

        // Organization settings
        {
            name: 'settings',
            type: 'group',
            fields: [
                {
                    name: 'requireLinking',
                    type: 'checkbox',
                    defaultValue: true,
                    admin: {
                        description: 'Require members to link accounts before submitting',
                    },
                },
                {
                    name: 'autoApproveVideos',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: {
                        description: 'Auto-approve videos from linked members',
                    },
                },
                {
                    name: 'allowDirectUploads',
                    type: 'checkbox',
                    defaultValue: true,
                    admin: {
                        description: 'Allow direct video file uploads (via Cloudinary)',
                    },
                },
            ],
        },

        // Member count (denormalized for display)
        {
            name: 'memberCount',
            type: 'number',
            defaultValue: 0,
            admin: {
                readOnly: true,
                description: 'Number of linked members',
            },
        },

        // Video count (denormalized for display)
        {
            name: 'videoCount',
            type: 'number',
            defaultValue: 0,
            admin: {
                readOnly: true,
                description: 'Number of videos submitted',
            },
        },

        // Registration link token (for owner registration)
        {
            name: 'registrationToken',
            type: 'text',
            admin: {
                hidden: true,
                description: 'One-time token for owner registration',
            },
        },

        // Token expiry
        {
            name: 'registrationTokenExpiry',
            type: 'date',
            admin: {
                hidden: true,
            },
        },
    ],

    hooks: {
        // Unlink users when organization is deleted
        afterDelete: [afterDeleteOrganizationHook],
    },

    timestamps: true,
}
