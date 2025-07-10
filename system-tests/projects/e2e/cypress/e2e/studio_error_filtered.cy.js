describe('studio error filtering', () => {
  // Custom error class that allows setting the stack
  class CustomError extends Error {
    constructor (message) {
      super(message)
      this.name = 'CustomError'
    }

    setStack (stack) {
      this.stack = stack

      return this
    }
  }

  it('should not display errors with __cypress-studio in stack', () => {
    // Create an error with __cypress-studio in the stack trace
    const error = new CustomError('Studio error that should be filtered')
    .setStack(`Error: Studio error that should be filtered
    at __cypress-studio/StudioPanelContentInner (http://localhost:3000/__cypress/runner/cypress_runner.js:123:45)
    at ReactErrorBoundary (http://localhost:3000/__cypress/runner/cypress_runner.js:456:78)
    at StudioPanelContent (http://localhost:3000/__cypress/runner/cypress_runner.js:789:12)
    at eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/studio_error_filtered.cy.js:5:16)`)

    // Throw the error - this should be filtered out and not cause the test to fail
    throw error
  })

  it('should still display regular errors', () => {
    // This error should be displayed normally
    throw new Error('Regular error that should be displayed')
  })

  it('should filter studio errors from application', () => {
    cy.visit('cypress/fixtures/studio_errors.html')

    // Trigger a studio error - this should be filtered out
    cy.get('.trigger-studio-error').click()

    // The test should not fail even though an error was thrown
    cy.get('.error-output').should('contain', 'Studio error that should be filtered')
  })

  it('should still display regular errors from application', () => {
    cy.visit('cypress/fixtures/studio_errors.html')

    // Trigger a regular error - this should be displayed
    cy.get('.trigger-regular-error').click()

    // The test should fail because this is a regular error
    cy.get('.error-output').should('contain', 'Regular error that should be displayed')
  })

  it('should filter async studio errors from application', () => {
    cy.visit('cypress/fixtures/studio_errors.html')

    // Trigger an async studio error - this should be filtered out
    cy.get('.trigger-studio-async-error').click()

    // Wait for the async error to occur
    cy.wait(200)

    // The test should not fail even though an error was thrown
    cy.get('.error-output').should('contain', 'Async studio error that should be filtered')
  })

  it('should handle unhandled promise rejections with studio stack', () => {
    cy.visit('cypress/fixtures/studio_errors.html')

    // Create a promise rejection with studio stack
    cy.window().then((win) => {
      const error = new CustomError('Studio promise rejection')
      .setStack(`Error: Studio promise rejection
    at __cypress-studio/StudioPanelContentInner (http://localhost:3000/__cypress/runner/cypress_runner.js:123:45)
    at Promise.reject (http://localhost:3000/__cypress/runner/cypress_runner.js:456:78)`)

      // This should be filtered out
      Promise.reject(error)
    })

    // Wait for the rejection to occur
    cy.wait(200)

    // The test should not fail
    cy.get('.error-output').should('contain', 'Studio promise rejection')
  })
})
