import { baseConfig } from '../../eslint.config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['**/__babel_fixtures__/**/*', 'index.js'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.ts'],
        },
      },
      globals: {
        exports: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
]
