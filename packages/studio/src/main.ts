import { StudioContainer } from './StudioContainer'

declare global {
  interface Window {
    UnifiedRunner: {
      React: any
      ReactDOM: any
      CypressJQuery: any
    }
  }
}

const mountStudio = (element: Element, props) => {
  const studioContainer = window.UnifiedRunner.React.createElement(StudioContainer, props)

  window.UnifiedRunner.ReactDOM.render(studioContainer, element)
}

const eventManagerEventOverrides = {
}

export const Studio = {
  mountStudio,
  eventManagerEventOverrides,
}
