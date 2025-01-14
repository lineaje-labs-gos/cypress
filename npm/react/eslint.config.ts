import { baseConfig } from '../../eslint.config'
import globals from 'globals'
import react from 'eslint-plugin-react'

export default [
  ...baseConfig,
  react.configs.flat.recommended,
  {
    files: ['src/createMount.ts'],
    rules: {
      'cypress/no-unnecessary-waiting': 'warn',
    },
  },
  {
    rules: {
      'react/prop-types': 'warn',
    },
  },
]
