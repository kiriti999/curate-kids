import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'complexity': ['error', 5],
      'max-depth': ['error', 3],
      'max-lines-per-function': ['warn', {max: 50, skipBlankLines: true, skipComments: true}],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'types/payload.ts'],
  },
]
