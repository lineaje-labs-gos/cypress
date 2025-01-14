import { baseConfig } from '../../eslint.config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['__snapshots__/**/*', 'cypress/tests/e2e/compile-error.js', 'test/fixtures/syntax_error_spec.js']
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      }
    }
  }
]