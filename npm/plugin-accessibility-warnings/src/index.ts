// @ts-nocheck

const CYPRESS_INTERACTION_COMMANDS = [
  'blur',
  'check',
  'clear',
  'click',
  'dblclick',
  'focus',
  'rightclick',
  'select',
  'selectFile',
  'type',
  'uncheck',
] as string[]

const INTERACTIVE_ELEMENT_SELECTORS = [
  'a[href]',
  'a[href] *',
  'button',
  '*:has(button)', // allow clicking any element if a button inside the element exists, because the button can receive keyboard focus and emit clicks to the ancestor
  'button *', // selecting and clicking any element inside a button is fine because the click bubbles up to the button
  'input',
  'select',
  '[role=option]',
  '[role=option] *',
  'details',
  'label[for]',
  'label:has(input)', // this leaves some gaps but the idea is to find all the cases where it is OK (even if not optimal) to click on a label
  'label[for] *',
  'label:has(input) *',
  'body', // support clicking outside a modal or something - assumption is if you are clicking the body element, you have a good reason
]

CYPRESS_INTERACTION_COMMANDS.forEach((commandName) => {
  Cypress.Commands.overwrite(commandName, (originalFn, $el, options) => {
    const el = $el[0]

    if (options?.ignoreAccessibilityWarnings) {
      delete options.ignoreAccessibilityWarnings

      return originalFn($el, options)
    }

    if (!el.matches(INTERACTIVE_ELEMENT_SELECTORS.join())) {
      Cypress.log({
        $el,
        name: 'Accessibility warning',
        message: `⚠️ This element seems to be semantically incorrect for the "${commandName}" interaction.`,
      })

      el.setAttribute('cypress-accessibility-interactivity-warning', true)
      throw Error('suspicious element interaction')
    }

    return originalFn($el, options)
  })
})
