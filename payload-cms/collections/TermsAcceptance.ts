/**
 * TermsAcceptance Collection Schema
 * 
 * Stores customer acceptance of Terms & Conditions before purchase.
 * Required for legal compliance and audit trail.
 */

import type { CollectionConfig } from 'payload'

export const TermsAcceptance: CollectionConfig = {
    slug: 'terms-acceptances',

    admin: {
        useAsTitle: 'email',
        defaultColumns: ['email', 'name', 'plan', 'acceptedAt', 'ipAddress'],
        description: 'Customer Terms & Conditions acceptance records',
    },

    // Access control - read-only through admin, created via API
    access: {
        read: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'superadmin',
        create: () => true, // Allow API creation
        update: () => false, // Immutable - no updates allowed
        delete: ({ req }) => req.user?.role === 'superadmin', // Only superadmins can delete
    },

    fields: [
        // Customer name
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: {
                description: 'Customer full name',
            },
        },

        // Customer email
        {
            name: 'email',
            type: 'email',
            required: true,
            admin: {
                description: 'Customer email address',
            },
        },

        // Plan selected
        {
            name: 'plan',
            type: 'select',
            required: true,
            options: [
                { label: 'Starter', value: 'starter' },
                { label: 'Pro', value: 'pro' },
                { label: 'Enterprise', value: 'enterprise' },
            ],
            admin: {
                description: 'Selected pricing plan',
            },
        },

        // Terms version accepted
        {
            name: 'termsVersion',
            type: 'text',
            required: true,
            defaultValue: '1.0',
            admin: {
                description: 'Version of terms accepted',
            },
        },

        // Acceptance timestamp
        {
            name: 'acceptedAt',
            type: 'date',
            required: true,
            admin: {
                description: 'When terms were accepted',
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        },

        // IP address for audit
        {
            name: 'ipAddress',
            type: 'text',
            admin: {
                description: 'IP address at time of acceptance',
            },
        },

        // User agent for audit
        {
            name: 'userAgent',
            type: 'text',
            admin: {
                description: 'Browser user agent at time of acceptance',
            },
        },

        // Privacy policy accepted
        {
            name: 'privacyPolicyAccepted',
            type: 'checkbox',
            required: true,
            admin: {
                description: 'Privacy policy was also accepted',
            },
        },

        // Custom domain interest
        {
            name: 'customDomainInterest',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Customer expressed interest in custom domain add-on',
            },
        },
    ],

    // Timestamps
    timestamps: true,
}
