import {defineType} from 'sanity'

export const activityLogPreview = defineType({
  name: 'activityLogPreview',
  title: 'Activity Log Preview',
  type: 'object',
  fields: [
    {
      name: 'actionType',
      type: 'string',
    },
    {
      name: 'timestamp',
      type: 'datetime',
    },
  ],
  preview: {
    select: {
      actionType: 'actionType',
      timestamp: 'timestamp',
    },
    prepare({actionType, timestamp}) {
      const date = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time'
      
      return {
        title: actionType || 'Unknown Action',
        subtitle: date,
      }
    },
  },
})
