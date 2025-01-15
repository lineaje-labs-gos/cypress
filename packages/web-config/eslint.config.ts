import { baseConfig } from '../../eslint.config'

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['node-register.js'],
        },
      },
    },
  },
]
