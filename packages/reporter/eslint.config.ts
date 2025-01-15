import { baseConfig } from '../../eslint.config'

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['index.ts', 'eslint.config.ts', 'cypress.config.ts', 'webpack.config.ts'],
        },
      },
    },
  },
]
