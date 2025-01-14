import { baseConfig } from '../../eslint.config'
import ts from 'typescript-eslint'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  }
]