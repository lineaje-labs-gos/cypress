import js from '@eslint/js'
import ts, { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
import cy from 'eslint-plugin-cypress/flat'
import mocha from 'eslint-plugin-mocha'
import globals from 'globals'
import path from 'path'
import vue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'

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
  ...vue.configs['flat/recommended'],
  stylistic.configs.customize({
    'braceStyle': '1tbs',
    'arrowParens': true,
  }),

  // overrides for stylistic rules
  {
    rules: {
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/multiline-ternary': 'off',
      // the following rules are very inconsistent across the codebase.
      // enabling them, even with customized options, may result in large diffs.
      '@stylistic/indent': 'off', // ['warn', 2, { MemberExpression: 0 }],
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/max-statements-per-line': 'off',
      '@stylistic/quote-props': 'off',
      '@stylistic/spaced-comment': 'off',
      '@stylistic/no-extra-parens': 'off',
      '@stylistic/new-parens': 'off',
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/template-curly-spacing': 'off',
      '@stylistic/no-mixed-operators': 'off',
    },
  },

  // overrides for basic recommended rules
  {
    rules: {
      'no-console': 'error',
    },
  },

  {
    // rules that are gold standard, but have many violations
    // these are off while developing eslint, but will be set to warn
    rules: {
      'no-useless-escape': 'off',
      'prefer-const': 'off',
      'prefer-rest-params': 'off',
      'no-prototype-builtins': 'off',
      'no-global-assign': 'off',
      'no-unsafe-finally': 'off',
      'no-async-promise-executor': 'off',

      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',

      'vue/multi-word-component-names': 'off',
      'vue/html-closing-bracket-spacing': 'off',

      'cypress/no-unnecessary-waiting': 'off',
      'cypress/unsafe-to-chain-command': 'off',
      'cypress/no-async-tests': 'off',
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
      'mocha/no-sibling-hooks': 'off',
      'mocha/no-skipped-tests': 'off',
      'mocha/no-exports': 'off',
      'mocha/no-async-describe': 'off',
    },
  },

  // common file patterns to ignore
  {
    ignores: [
      '.releaserc.js',
      'dist/**/*',
    ],
  },

  // globals necessary for mixed js/ts
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
      },
    },
  },

  {
    files: ['webpack.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
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
      '.releaserc.js',
      'dist/**',
    ],
  },
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: path.join(__dirname, './ts'),
      },
      globals: {
        ...globals.node,
      },
    },
  },
)
