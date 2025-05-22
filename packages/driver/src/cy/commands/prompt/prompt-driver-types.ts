/// <reference types="cypress" />

export interface CypressInternal extends Cypress.Cypress {
  backend: (eventName: string, ...args: any[]) => Promise<any>
}

export interface CyPromptOptions {
  Cypress: CypressInternal
  text: string | string[]
  options?: object
  promptCmd: unknown
}

export interface CyPromptDriverDefaultShape {
  cyPrompt: (opts: CyPromptOptions) => Cypress.Chainable<null>
}
