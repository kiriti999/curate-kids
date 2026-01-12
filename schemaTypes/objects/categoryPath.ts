import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'categoryPath',
  title: 'Category Path',
  type: 'object',
  fields: [
    defineField({
      name: 'fullPath',
      title: 'Full Path',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
      description: 'Complete category path from age range root to current category',
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: '0-2 years', value: '0-2'},
          {title: '2-4 years', value: '2-4'},
          {title: '5-7 years', value: '5-7'},
          {title: '8-9 years', value: '8-9'},
          {title: '10-15 years', value: '10-15'},
          {title: '16+ years', value: '16+'},
          {title: '18+ years', value: '18+'},
        ],
      },
    }),
  ],
})
