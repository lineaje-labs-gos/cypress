import { baseConfig } from '../../eslint.config'

export default [
  ...baseConfig,
  {
    ignores: ['__snapshot-html__/**/*'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.ts', 'index.js'],
        },
      },
    },
  },
]
