import { baseConfig } from '../../eslint.config'
import globals from 'globals'
import * as graphql from '@graphql-eslint/eslint-plugin'

export default [
  ...baseConfig,
  {
    ignores: ['**/generated/**/*'],
  },
  {
    files: ['index.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    files: ['script/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.vue', '**/*.jsx'],
    
  }
]
