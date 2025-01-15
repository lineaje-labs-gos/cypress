import { baseConfig } from '../../eslint.config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['index.js'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['script/worker-shim.js'],
        },
      },
    },
  },
  {
    files: ['script/worker-shim.js'],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

  },
]
