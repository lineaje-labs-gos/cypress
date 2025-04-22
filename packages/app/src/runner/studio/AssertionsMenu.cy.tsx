import AssertionsMenu from './AssertionsMenu.vue'
import type { PossibleAssertions, AddAssertion } from './types'

describe('AssertionsMenu', () => {
  const mockJqueryElement = {
    prop: (prop: string) => 'div',
    jquery: '3.6.0',
    length: 1,
    add: () => mockJqueryElement,
    addBack: () => mockJqueryElement,
    toArray: () => [document.createElement('div')],
  } as unknown as JQuery<HTMLElement>

  const mockPossibleAssertions: PossibleAssertions = [
    {
      type: 'have text',
      options: [{ name: 'text', value: 'text' }],
    },
    {
      type: 'be visible',
      options: [],
    },
  ]

  let mockAddAssertion: AddAssertion
  let mockCloseMenu: () => void
  let defaultProps: any

  beforeEach(() => {
    mockAddAssertion = cy.stub()
    mockCloseMenu = cy.stub()

    defaultProps = {
      jqueryElement: mockJqueryElement,
      possibleAssertions: mockPossibleAssertions,
      addAssertion: mockAddAssertion,
      closeMenu: mockCloseMenu,
      highlightStyle: {
        top: '100px',
        left: '100px',
        width: '200px',
        height: '50px',
      },
    }

    cy.mount(AssertionsMenu, {
      propsData: defaultProps,
    })
  })

  it('renders the menu with correct title and tag', () => {
    cy.get('[data-cy="assertions-menu"]').should('be.visible')
    cy.get('[data-cy="assertions-menu-title"]').should('contain', 'Assert')
    cy.get('[data-cy="assertions-menu-subtitle"]').should('contain', 'Expect')
    cy.get('code').should('contain', '<div>')

    cy.percySnapshot('AssertionsMenu')
  })

  it('renders all possible assertions', () => {
    cy.get('[data-cy="assertions-menu-list"]').children().should('have.length', mockPossibleAssertions.length)
    mockPossibleAssertions.forEach((assertion) => {
      cy.get('[data-cy="assertions-menu-list"]').should('contain', assertion.type)
    })
  })

  it('calls closeMenu when close button is clicked', () => {
    cy.get('[data-cy="assertions-menu-close"]').click()
    cy.wrap(mockCloseMenu).should('have.been.called')
  })
})
