import { init, loadRemote } from '@module-federation/runtime'
import { CyPromptDriverDefaultShape } from './prompt-driver-types'

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
    async prompt (message: string) {
      if (!Cypress.config('experimentalCyPrompt')) {
        // TODO: what do we want to do here?
        throw new Error('cy.prompt() is not enabled. Please enable it by setting `experimentalCyPrompt: true` in your Cypress config.')
      }

      try {
        let cloud = initializedCyPrompt

        if (!cloud) {
          cloud = await initializeCloudCyPrompt(Cypress)
        }

        return await cloud.cyPrompt(Cypress, message)
      } catch (error) {
        // TODO: handle this better
        throw new Error('CyPromptDriver not found')
      }
    },
  })
}
