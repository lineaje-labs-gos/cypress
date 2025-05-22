import { init, loadRemote } from '@module-federation/runtime'
import type{ CyPromptDriverDefaultShape } from './prompt-driver-types'

interface CyPromptDriver { default: CyPromptDriverDefaultShape }

let initializedCyPrompt: CyPromptDriverDefaultShape | null = null
const initializeCloudCyPrompt = async (Cypress: Cypress.Cypress): Promise<CyPromptDriverDefaultShape> => {
  const { success } = await Cypress.backend('wait:for:cy:prompt:ready')

  if (!success) {
    throw new Error('CyPromptDriver not found')
  }

  init({
    remotes: [{
      alias: 'cy-prompt',
      type: 'module',
      name: 'cy-prompt',
      entryGlobalName: 'cy-prompt',
      entry: '/__cypress-cy-prompt/cy-prompt.js',
      shareScope: 'default',
    }],
    name: 'driver',
  })

  const module = await loadRemote<CyPromptDriver>('cy-prompt')

  if (!module?.default) {
    throw new Error('CyPromptDriver not found')
  }

  initializedCyPrompt = module.default

  return module.default
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    prompt (message: string) {
      if (!Cypress.config('experimentalPromptCommand')) {
        // TODO: what do we want to do here?
        throw new Error('cy.prompt() is not enabled. Please enable it by setting `experimentalPromptCommand: true` in your Cypress config.')
      }

      const getCloud = async () => {
        try {
          let cloud = initializedCyPrompt

          if (!cloud) {
            cloud = await initializeCloudCyPrompt(Cypress)
          }

          return cloud
        } catch (error) {
          // TODO: handle this better
          // eslint-disable-next-line no-console
          console.error('Error in cy.prompt()', error)
          throw new Error('CyPromptDriver not found')
        }
      }

      return cy.wrap(getCloud(), { log: false }).then((cloud) => {
        return cloud.cyPrompt(Cypress, message)
      })
    },
  })
}
