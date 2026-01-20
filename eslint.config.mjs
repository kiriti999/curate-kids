import tsParser from '@typescript-eslint/parser'

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'frontend/**',
      'template/**',
      'scripts/**', // Exclude scripts from complexity checks
    ],
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
      // Constitution requirement: Maximum cyclomatic complexity of 5
      'complexity': ['error', 5],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-unused-vars': 'warn',
      // Constitution requirement: Maximum cyclomatic complexity of 5
      'complexity': ['error', 5],
    },
  },
]

export default eslintConfig