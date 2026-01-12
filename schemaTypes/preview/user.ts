import {defineType} from 'sanity'

export const userPreview = defineType({
  name: 'userPreview',
  title: 'User Preview',
  type: 'object',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'email',
      type: 'string',
    },
    {
      name: 'role',
      type: 'string',
    },
    {
      name: 'status',
      type: 'string',
    },
  ],
  preview: {
    select: {
      name: 'name',
      email: 'email',
      role: 'role',
      status: 'status',
    },
    prepare({name, email, role, status}) {
      const roleLabel = role === 'admin' ? '👑 Admin' : '✏️ Editor'
      const statusIcon = status === 'active' ? '✓' : '✗'
      
      return {
        title: `${statusIcon} ${name}`,
        subtitle: `${roleLabel} • ${email}`,
      }
    },
  },
})
