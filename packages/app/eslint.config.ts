import { baseConfig } from '../../eslint.config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    files: ['**/*.{tsx,jsx,vue,ts,js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['vite.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
