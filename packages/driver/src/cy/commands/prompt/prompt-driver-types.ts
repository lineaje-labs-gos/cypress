export interface CyPromptDriverDefaultShape {
  cyPrompt: (Cypress: any, text: string) => Promise<void>
}
