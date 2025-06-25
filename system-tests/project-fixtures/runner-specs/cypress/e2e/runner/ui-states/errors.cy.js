describe('Errors', () => {
  it('simple error with docs link', () => {
    cy.visit('cypress/fixtures/commandsActions.html')
    cy.get('div')
    .click()
  })

  it('long error', () => {
    // @see https://github.com/aaronpowell/httpstatus/issues/135
    cy.request('https://httpstatuses.maor.io/500')
  })
})
