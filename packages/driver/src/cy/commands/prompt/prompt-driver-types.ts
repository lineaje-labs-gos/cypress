export interface CypressInternal extends Cypress.Cypress {
  backend: (eventName: string, ...args: any[]) => Promise<any>
}

export interface CyPromptDriverDefaultShape {
  cyPrompt: (Cypress: CypressInternal, text: string) => Promise<void>
}
