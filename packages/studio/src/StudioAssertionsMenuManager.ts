const getStudioAssertionsMenuDom = (body) => {
  return getOrCreateHelperDom({
    body,
    className: '__cypress-studio-assertions-menu',
    css: '', //`${AssertionsMenu.styles}\n${AssertionType.styles}\n${AssertionOptions.styles}`,
  })
}

const getOrCreateHelperDom = ({ body, className, css }) => {
  let containers = body.querySelectorAll(`.${className}`)

  if (containers.length > 0) {
    const shadowRoot = containers[0].shadowRoot

    return {
      container: containers[0],
      vueContainer: shadowRoot.querySelector('.vue-container'),
    }
  }

  // Create container element

  const container = document.createElement('div')

  container.classList.add(className)

  container.style.position = 'static'

  body.appendChild(container)

  // Create react-container element

  const shadowRoot = container.attachShadow({ mode: 'open' })

  const vueContainer = document.createElement('div')

  vueContainer.classList.add('vue-container')

  shadowRoot.appendChild(vueContainer)

  // Prepend style element

  const style = document.createElement('style')

  style.innerHTML = css.toString()

  shadowRoot.prepend(style)

  return {
    container,
    vueContainer,
    shadowRoot,
  }
}

export class StudioAssertionsMenuManager {
  static instance = new StudioAssertionsMenuManager()

  openStudioAssertionsMenu = ({ el, body, props }) => {
    // const { vueContainer } = getStudioAssertionsMenuDom(body)

    // vueContainerListeners(vueContainer)

    // const selectorHighlightStyles = getSelectorHighlightStyles([el])[0]

    // mountAssertionsMenu(vueContainer, el, props.possibleAssertions, props.addAssertion, props.closeMenu, selectorHighlightStyles)
  }

  closeStudioAssertionsMenu = (body) => {
    const { container } = getStudioAssertionsMenuDom(body)

    this.unmountAssertionsMenu()
    container.remove()
  }

  mountAssertionsMenu = (
    container: Element,
    jqueryElement: any,
    possibleAssertions: any[],
    addAssertion: any,
    closeMenu: any,
    highlightStyle: any,
  ) => {
    // app = createApp(AssertionsMenu, {
    //   jqueryElement,
    //   possibleAssertions,
    //   addAssertion,
    //   closeMenu,
    //   highlightStyle,
    // })

    // app.mount(container)
  }

  unmountAssertionsMenu = () => {
    // if (app) {
    //   app.unmount()
    //   app = null
    // }
  }
}
