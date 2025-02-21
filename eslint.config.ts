import js from '@eslint/js'
import ts, { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
// @ts-expect-error - this package has no type defs
import cy from 'eslint-plugin-cypress/flat'
// @ts-expect error - this package has no type defs
import mocha from 'eslint-plugin-mocha'
import Globals from 'globals'
import vue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'
import * as graphql from '@graphql-eslint/eslint-plugin'
import react from 'eslint-plugin-react'
import eslintPluginImportX from 'eslint-plugin-import-x'

export const globals = Globals
/**
 * defaultConfig should be imported by other packages that define their own eslint.config.ts
 * tsLanguageOptions may be shared, but is probably unnecessary
 * the default config exported from this file applies to
 *   - ./scripts/*
 *
 * This can be simplified if ./scripts is converted to a monorepo package in /tooling
 */

/**
 * Add vueConfig instead of typescript config when using Vue
 */

/**
 * These override default rules to conform to the prevelant style in the repo.
 * Some are disabled or set to warn because they are not applied consistently
 * throughout the repo.
 */
const styleOverrides: InfiniteDepthConfigWithExtends[] = [
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
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: [
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
          next: '*',
        },
        {
          blankLine: 'any',
          prev: [
            'const',
            'let',
            'var',
            'import',
            'cjs-import',
          ],
          next: [
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
]

/**
 * Rules that are gold standard, but have many violations. They are aspirational.
 * When working on conformation process, override to warn or error one at a time
 * in the package's eslint config that you're working on. Once there are no more
 * errors for an entry, it can be removed - the default recommended configs will
 * apply.
 */
const baseOverrides: InfiniteDepthConfigWithExtends[] = [
  {
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
      'mocha/no-nested-tests': 'off',

      'cypress/no-unnecessary-waiting': 'off',
      'cypress/unsafe-to-chain-command': 'off',
      'cypress/no-async-tests': 'off',
      'cypress/no-assigning-return-values': 'off',

      // some import-x rules are off rather than warn, because they can be a little bit noisy in stdout
      'import-x/namespace': 'off', // sometimes we import modules as namespaces when we don't intend to, e.g. `import * as sinon from 'sinon'`
      'import-x/no-unresolved': 'off', // import-x has trouble resolving some things, like css from .vue
      'import-x/no-named-as-default-member': 'off', // e.g., import foo from 'foo'; foo.bar(); will error when `bar` is a named export
      'import-x/default': 'off',
      'import-x/export': 'off',
      'import-x/no-extraneous-dependencies': 'warn',
    },
  },
]

const overrides = [
  ...styleOverrides,
  ...baseOverrides,
]

const baseConfig: InfiniteDepthConfigWithExtends[] = [
  js.configs.recommended,
  cy.configs.recommended,
  mocha.configs.flat.recommended,
  eslintPluginImportX.flatConfigs.recommended,

  stylistic.configs.customize({
    braceStyle: '1tbs',
    arrowParens: true,
  }),

  // common node files
  {
    files: ['vite.config.mjs', 'webpack.config.*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // common file patterns to ignore
  {
    ignores: [
      '.releaserc.js',
      'dist/**/*',
      '**/__snapshots__/**/*',
      'test/.mocharc.js',
    ],
  },

  // globals necessary for mixed js/ts
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        ...globals['shared-node-browser'],
        ...globals['es2020'], // this should be aligned with tsconfig "lib"
      },
    },
  },

  // cy, *sx, and vue files are always in browser
  {
    files: ['**/*.cy.{js,ts}', '**/*.{j,t}sx', '**/*.vue'],
    languageOptions: {
      globals: {
        ...globals['browser'],
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

const typescriptConfig = ts.config(
  ...ts.configs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  {
    rules: {
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
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [ts.configs.disableTypeChecked],
  },
)

const baseVueConfig = ts.config(
  ...vue.configs['flat/recommended'],
  {

    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/no-dupe-keys': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/no-useless-template-attributes': 'off',
    },
  },
)

export const vueConfig = ts.config(
  ...baseConfig,
  ...typescriptConfig,
  ...baseVueConfig,
  ...overrides,
)

/**
 * Use reactConfig when using react. Take care not to include both react and
 * vue configs in the same project - they conflict in weird ways.
 */

const baseReactConfig = ts.config(
  {
    ...react.configs.flat.recommended,
    files: ['**/*.{jsx,tsx}'],
    settings: {
      react: {
        version: '18',
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/no-string-refs': 'warn',
      'react/prop-types': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-target-blank': 'warn',
      'react/no-unknown-property': 'warn',
      'react/jsx-key': 'warn',
      'react/display-name': 'warn',
      // we use react 18+, so these rules do not apply
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },
)

export const reactConfig = ts.config(
  ...baseConfig,
  ...typescriptConfig,
  ...baseReactConfig,
  ...overrides,
)

export const combinedReactVueConfig = ts.config(
  ...baseConfig,
  ...typescriptConfig,
  ...baseVueConfig,
  ...baseReactConfig,
  ...overrides,
)

// some packages need to disable all of the react rules for a subset of files
export const disabledReactRules = {
  ...Object.keys(react.configs.flat.recommended?.rules || {}).reduce((rules, rule) => {
    return {
      ...rules,
      [rule]: 'off',
    }
  }, {}),
  'react/no-unknown-property': 'off',
}

export const defaultConfig = ts.config(
  ...baseConfig,
  ...typescriptConfig,
  ...overrides,
)
// applies to ./scripts - eslint tends to crash if this config is in the ./scripts dir?

export default ts.config(
  ...defaultConfig,
  ...typescriptConfig,
  ...overrides,
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
      parserOptions: {
        projectService: false,
      },
    },
  },
  {
    rules: {
      'no-console': 'off',
    },
  },
)
