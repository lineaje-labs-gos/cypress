import js from '@eslint/js'
import ts, { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
import cy from 'eslint-plugin-cypress/flat'
import mocha from 'eslint-plugin-mocha'
import globals from 'globals'
import path from 'path'
import vue from 'eslint-plugin-vue'

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

      'vue/multi-word-component-names': 'off',
      'vue/html-closing-bracket-spacing': 'off',

      'cypress/no-unnecessary-waiting': 'off',
      'cypress/unsafe-to-chain-command': 'off',
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
    }
  },

  // common file patterns to ignore
  {
    ignores: [
      '.releaserc.js',
      'dist/**/*',
    ]
  },

  // globals necessary for mixed js/ts 
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
      }
    }
  },

  {
    files: ['webpack.config.js'],
    languageOptions: {
      globals: globals.node
    }
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
      '.releaserc.js',
      'dist/**'
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