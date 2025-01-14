import js from '@eslint/js'
import ts, { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
import cy from 'eslint-plugin-cypress/flat'
import mocha from 'eslint-plugin-mocha'
import type { Linter } from 'eslint'
import globals from 'globals'
import path from 'path'

/**
 * baseConfig should be imported by other packages that define their own eslint.config.ts
 * tsLanguageOptions may be shared, but is probably unnecessary
 * the default config exported from this file applies to
 *   - ./scripts/*
 */

export const baseConfig: InfiniteDepthConfigWithExtends[] = [
  js.configs.recommended, 
  ...ts.configs.recommended,
  cy.configs.recommended,
  mocha.configs.flat.recommended,
  {
    // rules that are gold standard, but have many violations
    // these are off while developing eslint, but will be set to warn
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'prefer-const': 'off',
      'prefer-rest-params': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-prototype-builtins': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-global-assign': 'off',
    },
  },

  // conflicting mocha rules
  {
    rules: {
      'mocha/no-mocha-arrows': 'off',
      'mocha/no-setup-in-describe': 'off', //warn
      'mocha/max-top-level-suites': 'off', // warn
      'mocha/no-top-level-hooks': 'off', //warn
      'mocha/no-identical-title': 'off', // warn
      'mocha/consistent-spacing-between-blocks': 'off',
      'mocha/no-global-tests': 'off',
    }
  },

  // common file patterns to ignore
  {
    ignores: [
      '.releaserc.js',
      'dist/**/*',
    ]
  }
]


export default ts.config(
  ...baseConfig,
  {
    ignores: [
      'npm/**/*',
      'packages/**/*',
      'system-tests/**/*',
      'tooling/**/*',
      'cli/**/*',
      '**/__snapshots__/**/*',
      '.nx/**/*',
      '.releaserc.js'
    ]
  },
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: path.join(__dirname, './ts')
      },
      globals: {
        ...globals.node,
      }
    }
  }
)