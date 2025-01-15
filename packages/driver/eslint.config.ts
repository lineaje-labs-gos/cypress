import { baseConfig } from '../../eslint.config'
import globals from 'globals'

export default [
  ...baseConfig,
  {
    ignores: ['cypress/fixtures/**/*', 'src/config/jquery.scrollto.ts'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['index.d.ts', 'cypress/e2e/e2e/origin/dependencies.cy.jsx', 'src/cypress/setter_getter.d.ts'],
        },
      },
    },
  },
]
