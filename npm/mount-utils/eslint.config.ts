import { baseConfig } from '../../eslint.config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['dist/**/*', '**/*.d.ts']
  }
]