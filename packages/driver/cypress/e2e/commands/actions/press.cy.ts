describe('__placeholder__/commands/actions/press', () => {
  it('dispatches the tab keypress to the AUT', () => {
    if (Cypress.browser.family !== 'chromium') {
      return
    }

    cy.visit('/fixtures/input_events.html')
    cy.get('#focus').focus().then(() => {
      return Cypress.automation('key:press', { key: 'Tab' })
    })

    cy.get('#keyup').should('have.value', 'Tab')

    cy.get('#keydown').should('have.value', 'Tab')
  })
})
