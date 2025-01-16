import { baseConfig } from '../../eslint.config'
import globals from 'globals'
import react from 'eslint-plugin-react'

export default [
  ...baseConfig,
  {
    ignores: ['**/generated/**/*'],
  },
  {
    files: ['index.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    files: ['script/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // cy tsx files in the src/ dir are component tests,
  // and since the components that are being rendered are vue
  // components and not react components, react rules do not apply.
  {
    files: ['src/**/*.cy.{j,t}sx'],
    rules: {
      ...Object.keys(react.configs.flat.recommended.rules).reduce((rules, rule) => {
        return {
          ...rules,
          [rule]: 'off',
        }
      }, {}),
    },
  },
]
