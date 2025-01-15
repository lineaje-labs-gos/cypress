import { baseConfig } from '../../eslint.config'

export default [
  ...baseConfig,
  {
    ignores: ['src/generated/**/*', 'cypress/**/fixtures/**/*'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['cypress.config.ts', 'eslint.config.ts', 'vite.config.mjs', 'tailwind.config.cjs', 'postcss.config.js'],
        },
      },
      globals: {
        process: 'readonly',
      },
    },
  },
]
