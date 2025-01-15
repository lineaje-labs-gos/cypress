import { baseConfig } from '../../eslint.config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['**/fixtures/**/*'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './eslint.tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['test/**'],
    languageOptions: {
      globals: {
        sinon: 'readonly',
        nock: 'readonly',
        mockery: 'readonly',
        proxyquire: 'readonly',
        supertest: 'readonly',
      },
    },
  },
]
