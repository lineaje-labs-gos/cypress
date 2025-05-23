import { init, loadRemote } from '@module-federation/runtime'
import type { CyPromptDriverDefaultShape } from './prompt-driver-types'

interface CyPromptDriver { default: CyPromptDriverDefaultShape }

let initializedCyPrompt: CyPromptDriverDefaultShape | null = null
const initializeCloudCyPrompt = async (Cypress: Cypress.Cypress): Promise<CyPromptDriverDefaultShape> => {
  const { success } = await Cypress.promptBackend('wait:for:cy:prompt:ready')

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

const getCloud = async (Cypress: Cypress.Cypress): Promise<CyPromptDriverDefaultShape | Error> => {
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

    return new Error('CyPromptDriver not found')
  }
}

const isError = (value: unknown): value is Error => {
  return value instanceof Error
}

export default (Commands, Cypress, cy) => {
  if (Cypress.config('experimentalPromptCommand')) {
    const cloud = getCloud(Cypress)

    Commands.addAll({
      prompt (text: string | string[], options = {}) {
        const promptCmd = cy.state('current')

        return cy.wrap(cloud, { log: false }).then((cloudOrError) => {
          if (isError(cloudOrError)) {
            throw cloudOrError
          }

          return cloudOrError.cyPrompt({
            Cypress,
            text,
            options,
            promptCmd,
            cy,
          })
        })
      },
    })
  }
}
