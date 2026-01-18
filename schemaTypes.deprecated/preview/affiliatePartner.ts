import {defineType} from 'sanity'

export const affiliatePartnerPreview = defineType({
  name: 'affiliatePartnerPreview',
  title: 'Affiliate Partner Preview',
  type: 'object',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'status',
      type: 'string',
    },
    {
      name: 'conversionRate',
      type: 'number',
    },
  ],
  preview: {
    select: {
      name: 'name',
      status: 'status',
      conversionRate: 'conversionRate',
    },
    prepare({name, status, conversionRate}) {
      const statusBadge = status === 'active' ? '✓ Active' : status === 'pending' ? '🕒 Pending' : '✗ Inactive'
      const ctrDisplay = conversionRate ? ` • ${conversionRate.toFixed(2)}% CTR` : ''
      
      return {
        title: name,
        subtitle: `${statusBadge}${ctrDisplay}`,
      }
    },
  },
})
