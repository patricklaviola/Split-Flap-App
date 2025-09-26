// @ts-check

import eslint from '@eslint/js'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  globalIgnores(['dist']),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['./src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['.*'],
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
]
