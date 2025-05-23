// Note: This file is owned by the cloud delivered
// cy prompt bundle. It is downloaded and copied here.
// It should not be modified directly here.

/// <reference types="cypress" />

export interface CypressInternal extends Cypress.Cypress {
  promptBackend: (eventName: string, ...args: any[]) => Promise<any>
}

export interface CyPromptOptions {
  Cypress: CypressInternal
  text: string | string[]
  options?: object
  promptCmd: unknown
  cy: Cypress.cy
}

export interface CyPromptDriverDefaultShape {
  cyPrompt: (opts: CyPromptOptions) => Cypress.Chainable<null>
}
