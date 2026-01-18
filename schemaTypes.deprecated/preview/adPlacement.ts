import {defineType} from 'sanity'

export const adPlacementPreview = defineType({
  name: 'adPlacementPreview',
  title: 'Ad Placement Preview',
  type: 'object',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'position',
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
      position: 'position',
      status: 'status',
    },
    prepare({name, position, status}) {
      const statusBadge = status === 'active' ? '✓ Active' : status === 'scheduled' ? '🕒 Scheduled' : '✗ Inactive'
      const positionLabel = position ? position.charAt(0).toUpperCase() + position.slice(1) : ''
      
      return {
        title: name,
        subtitle: `${positionLabel} • ${statusBadge}`,
      }
    },
  },
})
