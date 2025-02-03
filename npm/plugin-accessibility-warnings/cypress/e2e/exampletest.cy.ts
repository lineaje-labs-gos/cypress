describe('example to-do app', () => {
  beforeEach(() => {
    cy.visit('cypress/test.html')
  })

  it('clicks an inaccessible button', () => {
    cy.contains('Click Me!').click()
    cy.contains('output', 'The click happened')
  })

  it('clicks an inaccessible link', () => {
    cy.get('a').eq(0).click()
    cy.get('a').eq(1).click()
    cy.get('a').eq(2).click()
  })
})
