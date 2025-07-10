exports['e2e uncaught errors / failing1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_synchronous_before_tests_parsed.js)                              │
  │ Searched:   cypress/e2e/uncaught_synchronous_before_tests_parsed.js                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  uncaught_synchronous_before_tests_parsed.js                                     (1 of 1)
WebKit was launched, but the experimental feature was not enabled. Please add \`experimentalWebKitSupport: true\` to your config file to launch WebKit.
Error: WebKit was launched, but the experimental feature was not enabled. Please add \`experimentalWebKitSupport: true\` to your config file to launch WebKit.
      [stack trace lines]


`

exports['e2e uncaught errors / failing2'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_synchronous_during_hook.cy.js)                                   │
  │ Searched:   cypress/e2e/uncaught_synchronous_during_hook.cy.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  uncaught_synchronous_during_hook.cy.js                                          (1 of 1)
WebKit was launched, but the experimental feature was not enabled. Please add \`experimentalWebKitSupport: true\` to your config file to launch WebKit.
Error: WebKit was launched, but the experimental feature was not enabled. Please add \`experimentalWebKitSupport: true\` to your config file to launch WebKit.
      [stack trace lines]


`

exports['e2e uncaught errors / failing3'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_during_test.cy.js)                                               │
  │ Searched:   cypress/e2e/uncaught_during_test.cy.js                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  uncaught_during_test.cy.js                                                      (1 of 1)


  foo
    1) fails with setTimeout
    2) fails with setTimeout and done
    ✓ passes with fail handler after failing with setTimeout
    3) fails with async app code error
    ✓ passes with fail handler after failing with async app code error
    - fails with promise


  2 passing
  1 pending
  3 failing

  1) foo
       fails with setTimeout:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      [stack trace lines]

  2) foo
       fails with setTimeout and done:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      [stack trace lines]

  3) foo
       fails with async app code error:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > qax is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        6                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     uncaught_during_test.cy.js                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_during_test.cy.js/foo -- fails with se     (1280x720)
     tTimeout (failed).png                                                                          
  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_during_test.cy.js/foo -- fails with se     (1280x720)
     tTimeout and done (failed).png                                                                 
  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_during_test.cy.js/foo -- fails with as     (1280x720)
     ync app code error (failed).png                                                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  uncaught_during_test.cy.js               XX:XX        6        2        3        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        6        2        3        1        -  


`

exports['e2e uncaught errors / failing4'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_during_hook.cy.js)                                               │
  │ Searched:   cypress/e2e/uncaught_during_hook.cy.js                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  uncaught_during_hook.cy.js                                                      (1 of 1)
WebKit was launched, but the experimental feature was not enabled. Please add \`experimentalWebKitSupport: true\` to your config file to launch WebKit.
Error: WebKit was launched, but the experimental feature was not enabled. Please add \`experimentalWebKitSupport: true\` to your config file to launch WebKit.
      [stack trace lines]


`

exports['e2e uncaught errors / failing5'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (caught_async_sync_test.cy.js)                                             │
  │ Searched:   cypress/e2e/caught_async_sync_test.cy.js                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  caught_async_sync_test.cy.js                                                    (1 of 1)


  foo
    1) baz fails
    2) bar fails
    3) quux fails
    4) quux2 fails
    ✓ quux3 passes
    ✓ quux4 passes
    ✓ quux5 passes
    ✓ quux6 passes


  4 passing
  4 failing

  1) foo
       baz fails:
     ReferenceError: foo is not defined
      [stack trace lines]

  2) foo
       bar fails:
     ReferenceError: foo is not defined
      [stack trace lines]

  3) foo
       quux fails:
     ReferenceError: foo is not defined
      [stack trace lines]

  4) foo
       quux2 fails:
     ReferenceError: foo is not defined
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        8                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  4                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     caught_async_sync_test.cy.js                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/caught_async_sync_test.cy.js/foo -- baz fails (     (1280x720)
     failed).png                                                                                    
  -  /XXX/XXX/XXX/cypress/screenshots/caught_async_sync_test.cy.js/foo -- bar fails (     (1280x720)
     failed).png                                                                                    
  -  /XXX/XXX/XXX/cypress/screenshots/caught_async_sync_test.cy.js/foo -- quux fails      (1280x720)
     (failed).png                                                                                   
  -  /XXX/XXX/XXX/cypress/screenshots/caught_async_sync_test.cy.js/foo -- quux2 fails     (1280x720)
      (failed).png                                                                                  


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  caught_async_sync_test.cy.js             XX:XX        8        4        4        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        8        4        4        -        -  


`

exports['e2e uncaught errors / studio error filtering'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/e2e/cypress/e2e/errors/studio_error_filtered.cy.js

`
