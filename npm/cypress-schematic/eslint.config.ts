import { baseConfig } from '../../eslint.config'
import globals from 'globals'
import path from 'path'

export default [
  ...baseConfig,
  {
    ignores: ['src/**/*.{js,js.map,d.ts}', 'src/schematics/cypress/files/cypress/plugins/*.js', '**/*.spec.ts'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.ts', 'projects/sandbox/src/fake-component.component.ts'],
        },
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
  },
]
