import { baseConfig } from '../../eslint.config'

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        require: 'readonly',
      },
    },
  },
]
