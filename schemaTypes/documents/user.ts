import {defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons'

export default defineType({
  name: 'user',
  title: 'User',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100).error('Name is required and must be under 100 characters'),
      description: 'Full name of the user',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .email()
          .custom(async (email, context) => {
            if (!email) return true

            const {getClient, document} = context
            const client = getClient({apiVersion: '2024-01-01'})

            // Check for duplicate email (excluding current document)
            const duplicates = await client.fetch(
              `count(*[_type == "user" && email == $email && _id != $id])`,
              {email, id: document?._id || ''}
            )

            return duplicates > 0 ? 'A user with this email already exists' : true
          }),
      description: 'Email address (must be unique)',
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          {title: 'Admin', value: 'admin'},
          {title: 'Editor', value: 'editor'},
        ],
        layout: 'radio',
      },
      validation: (Rule) =>
        Rule.required()
          .custom((role, context) => {
            const {document} = context
            const currentRole = (document as any)?.role
            
            // Check if role is being changed (immutable after creation)
            if (document?._rev && currentRole && currentRole !== role) {
              return 'Role cannot be changed after user creation'
            }
            
            return true
          }),
      readOnly: ({document}) => !!document?._rev,
      description: 'User role (cannot be changed after creation)',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Inactive', value: 'inactive'},
        ],
        layout: 'radio',
      },
      initialValue: 'active',
      validation: (Rule) => Rule.required(),
      description: 'User account status',
    }),
    defineField({
      name: 'addedBy',
      title: 'Added By',
      type: 'reference',
      to: [{type: 'user'}],
      validation: (Rule) =>
        Rule.required()
          .custom(async (addedBy: any, context) => {
            if (!addedBy?._ref) return true

            const {getClient} = context
            const client = getClient({apiVersion: '2024-01-01'})

            // Verify that addedBy user is an admin
            const addedByUser = await client.fetch(
              `*[_id == $id][0]{ role }`,
              {id: addedBy._ref}
            )

            if (!addedByUser) return 'Referenced user not found'
            if (addedByUser.role !== 'admin') {
              return 'User must be added by an admin'
            }

            return true
          }),
      description: 'Admin who created this user account',
      readOnly: true,
    }),
    defineField({
      name: 'lastLoginAt',
      title: 'Last Login',
      type: 'datetime',
      readOnly: true,
      description: 'Timestamp of last login',
    }),
    defineField({
      name: 'loginCount',
      title: 'Login Count',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Total number of logins',
    }),
    defineField({
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 3,
      description: 'Internal notes about this user (not visible to user)',
    }),
    defineField({
      name: 'deactivatedAt',
      title: 'Deactivated At',
      type: 'datetime',
      readOnly: true,
      description: 'Timestamp when status changed to inactive',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      email: 'email',
      role: 'role',
      status: 'status',
    },
    prepare({title, email, role, status}) {
      const roleLabel = role === 'admin' ? '👑 Admin' : '✏️ Editor'
      const statusBadge = status === 'active' ? '✓' : '✗'
      
      return {
        title: `${statusBadge} ${title}`,
        subtitle: `${roleLabel} • ${email}`,
      }
    },
  },
  orderings: [
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
    {
      title: 'Role',
      name: 'roleAsc',
      by: [{field: 'role', direction: 'asc'}],
    },
  ],
})
