import { defaultConfig } from '../../eslint.config'

export default [
  ...defaultConfig,
  {
    // Autofix on .scss.d.ts files seems to cause an outdated type declaration file
    // error from css-modules-typescript-loader due to a difference of whitespace.
    ignores: ['**/*.scss.d.ts'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['index.ts', 'eslint.config.ts', 'cypress.config.ts', 'webpack.config.ts'],
        },
      },
    },
  },
]
