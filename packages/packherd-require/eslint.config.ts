import { baseConfig } from '../../eslint.config'

export default [
  ...baseConfig,
  {
    ignores: ['test/.mocharc.js', 'test/fixtures/**/*'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.ts'],
        },
      },
    },
  },
]
