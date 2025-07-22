import baseConfig from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.spec.ts', '**/*.component.ts'],
    languageOptions: {
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
]
