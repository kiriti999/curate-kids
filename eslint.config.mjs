import tsParser from '@typescript-eslint/parser'

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ['node_modules/**', '.next/**', 'frontend/**', 'template/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-unused-vars': 'warn',
    },
  },
]

export default eslintConfig