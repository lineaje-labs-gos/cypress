describe('Status Codes', () => {
  it('Request Statuses', () => {
    // @see https://github.com/aaronpowell/httpstatus/issues/135
    cy.request('https://httpstatuses.maor.io/200')
    cy.request('https://httpstatuses.maor.io/304')

    cy.request({
      url: 'https://httpstatuses.maor.io/400',
      failOnStatusCode: false,
    })

    cy.request({
      url: 'https://httpstatuses.maor.io/502',
      failOnStatusCode: false,
    })

    cy.request({
      url: 'https://httpstatuses.maor.io/103',
      timeout: 2000,
    })
  })
})
