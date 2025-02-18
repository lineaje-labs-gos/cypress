import baseConfig from '@tooling/eslint-config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['test/.mocharc.js', 'test/fixtures/**/*'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './eslint.tsconfig.json',
      },
      globals: globals.node,
    },
  },
]
