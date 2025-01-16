import { baseConfig } from '../../eslint.config'
import globals from 'globals'
import react from 'eslint-plugin-react'

export default [
  ...baseConfig,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.ts']
        }
      }
    }
  },

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

  // {cy,spec}.tsx files in the src/ dir are component tests,
  // and since the components that are being rendered are vue
  // components and not react components, react rules do not apply.
  {
    files: ['src/**/*.{spec,cy}.tsx'],
    rules: {
      ...Object.keys(react.configs.flat.recommended.rules).reduce((rules, rule) => {
        return {
          ...rules,
          [rule]: 'off',
        }
      }, {}),
      'react/no-unknown-property': 'off',
    },
  },
]
