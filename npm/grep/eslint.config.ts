import { baseConfig } from '../../eslint.config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals['shared-node-browser'],
        require: 'readonly',
        module: 'readonly',
      },
    },
  },
  {
    files: ['expects/test-npm-module.js', 'src/plugin.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
]
