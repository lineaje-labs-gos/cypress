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

  // set up ts parser
  {
    files: ['**/*.{ts,js,jsx,vue}'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        projectService: true,
      },
      globals: {
        ...globals.node,
      },
    },
  },

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
      '@stylistic/jsx-tag-spacing': 'off',
      '@stylistic/jsx-function-call-newline': 'off',
      '@stylistic/jsx-wrap-multilines': 'off',
      '@stylistic/jsx-closing-tag-location': 'off',
      '@stylistic/jsx-first-prop-new-line': 'off',
      '@stylistic/jsx-closing-bracket-location': 'off',
      '@stylistic/jsx-one-expression-per-line': 'off',
      '@stylistic/jsx-max-props-per-line': 'off',
      '@stylistic/jsx-curly-brace-presence': 'off',
      '@stylistic/jsx-quotes': 'off',
    },
  },

  // overrides for basic recommended rules, and custom rules
  {
    rules: {
      'no-console': 'error',
      'no-restricted-properties': [
        'warn',
        {
          object: 'process',
          property: 'geteuid',
          message: 'process.geteuid() will throw on Windows. Do not use it unless you catch any potential errors.',
        },
        {
          object: 'os',
          property: 'userInfo',
          message: 'os.userInfo() will throw when there is not an `/etc/passwd` entry for the current user (like when running with --user 12345 in Docker). Do not use it unless you catch any potential errors.',
        },
      ],
      'no-restricted-syntax': [
        // esquery tool: https://estools.github.io/esquery/
        'warn',
        {
          // match sync FS methods except for `existsSync`
          // examples: fse.readFileSync, fs.readFileSync, this.ctx.fs.readFileSync...
          selector: `MemberExpression[object.name='fs'][property.name=/^[A-z]+Sync$/]:not(MemberExpression[property.name='existsSync']), MemberExpression[property.name=/^[A-z]+Sync$/]:not(MemberExpression[property.name='existsSync']):has(MemberExpression[property.name='fs'])`,
          message: 'Synchronous fs calls should not be used in Cypress. Use an async API instead.',
        },
      ],
      'padding-line-between-statements': [
        'error',
        {
          'blankLine': 'always',
          'prev': '*',
          'next': 'return',
        },
        {
          'blankLine': 'always',
          'prev': [
            'const',
            'let',
            'var',
            'if',
            'while',
            'export',
            'cjs-export',
            'import',
            'cjs-import',
            'multiline-expression',
          ],
          'next': '*',
        },
        {
          'blankLine': 'any',
          'prev': [
            'const',
            'let',
            'var',
            'import',
            'cjs-import',
          ],
          'next': [
            'const',
            'let',
            'var',
            'import',
            'cjs-import',
          ],
        },
      ],
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
      'no-unsafe-optional-chaining': 'off',
      'prefer-spread': 'warn',

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
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',

      'vue/multi-word-component-names': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/no-dupe-keys': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/no-useless-template-attributes': 'off',

      'cypress/no-unnecessary-waiting': 'off',
      'cypress/unsafe-to-chain-command': 'off',
      'cypress/no-async-tests': 'off',
      'cypress/no-assigning-return-values': 'off',
    },
  },

  // conflicting mocha rules
  {
    rules: {
      'mocha/no-mocha-arrows': 'off',
      'mocha/no-setup-in-describe': 'off',
      'mocha/max-top-level-suites': 'off',
      'mocha/no-top-level-hooks': 'off',
      'mocha/no-identical-title': 'off',
      'mocha/consistent-spacing-between-blocks': 'off',
      'mocha/no-global-tests': 'off',
      'mocha/no-sibling-hooks': 'off',
      'mocha/no-skipped-tests': 'off',
      'mocha/no-exports': 'off',
      'mocha/no-async-describe': 'off',
      'mocha/no-return-and-callback': 'off',
      'mocha/no-pending-tests': 'off',
    },
  },

  // common file patterns to ignore
  {
    ignores: [
      '.releaserc.js',
      'dist/**/*',
      '**/__snapshots__/*',
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
      globals: {
        ...globals.node,
      },
    },
  },
)
