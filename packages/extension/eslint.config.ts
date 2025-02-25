import { defaultConfig } from '../../eslint.config'

export default [
  ...defaultConfig,
  {
    ignores: ['test/helpers/**/*'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './eslint.tsconfig.json',
      },
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        sinon: 'readonly',
        global: 'readonly',
        process: 'readonly',
      },
    },
  },
]
