import studio from '@sanity/eslint-config-studio'

export default [
  ...studio,
  {
    rules: {
      'complexity': ['error', 5],
      'max-depth': ['error', 3],
      'max-lines-per-function': ['warn', {max: 50, skipBlankLines: true, skipComments: true}],
    },
  },
]
