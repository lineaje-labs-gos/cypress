describe('src/cy/commands/prompt', () => {
  it('errors when cy.prompt() is not enabled', () => {
    cy.visit('/fixtures/input_events.html')

    cy.prompt('Hello, world!').should('throw')
  })

  // TODO: add more tests when cy.prompt is deployed
})
