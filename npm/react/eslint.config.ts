import { baseConfig } from '../../eslint.config'
import globals from 'globals'
import react from 'eslint-plugin-react'

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['babel.config.js', 'cypress.config.js', 'eslint.config.ts', 'rollup.config.mjs', 'vite.config.ts'],
        },
      },
    },
  },
  {
    rules: {
      'react/prop-types': 'warn',
      'react/display-name': 'warn',
      'no-console': 'warn',
    },
  },
]
