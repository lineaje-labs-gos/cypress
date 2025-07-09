/**
 container.clientHeight:
 - container visible area height ("viewport")
 - includes padding, but not margin or border
 container.scrollTop:
 - container scroll position:
 container.scrollHeight:
 - total container height (visible + not visible)
 element.clientHeight:
 - element height
 - includes padding, but not margin or border
 element.offsetTop:
 - element distance from top of container
*/

export type UserScrollCallback = () => void

const PADDING = 100
const SCROLL_THRESHOLD_MS = 50

export class Scroller {
  private _container: Element | null = null
  private _userScrollCount = 0
  private _countUserScrollsTimeout?: number
  private _userScrollThresholdMs = SCROLL_THRESHOLD_MS
  private _intersectionObserver: IntersectionObserver | null = null
  private _mutationObserver: MutationObserver | null = null
  private _elementVisibilityMap = new WeakMap<HTMLElement, boolean>()

  setContainer (container: Element, onUserScroll?: UserScrollCallback) {
    this._container = container

    this._userScrollCount = 0

    this._setupIntersectionObserver()
    this._setupMutationObserver()
    this._listenToScrolls(onUserScroll)
  }

  _listenToScrolls (onUserScroll?: UserScrollCallback) {
    if (!this._container) return

    this._container.addEventListener('scroll', () => {
      this._userScrollCount++

      if (this._userScrollCount <= 0) {
        // programmatic scroll
        return
      }

      // there can be false positives for user scrolls, so make sure we get 3
      // or more scroll events within 50ms to count it as a user intending to scroll
      if (this._userScrollCount >= 3) {
        if (onUserScroll) {
          onUserScroll()
        }

        clearTimeout(this._countUserScrollsTimeout)
        this._countUserScrollsTimeout = undefined
        this._userScrollCount = 0

        return
      }

      if (this._countUserScrollsTimeout) return

      this._countUserScrollsTimeout = window.setTimeout(() => {
        this._countUserScrollsTimeout = undefined
        this._userScrollCount = 0
      }, this._userScrollThresholdMs)
    })
  }

  private _setupIntersectionObserver () {
    if (!this._container || !(this._container instanceof Element)) return

    // Clean up existing observer
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect()
    }

    this._intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement
          // Consider fully visible if intersection ratio is 1.0 (completely visible)
          // with some tolerance for the padding
          const isFullyVisible = entry.isIntersecting && entry.intersectionRatio >= 0.95

          this._elementVisibilityMap.set(element, isFullyVisible)
        })
      },
      {
        root: this._container as Element,
        threshold: [0, 0.95, 1.0], // Track when element becomes 95% visible
        rootMargin: `-${PADDING}px 0px 0px 0px`, // Account for padding
      },
    )
  }

  private _setupMutationObserver () {
    if (!this._container || !(this._container instanceof Element)) return

    // Clean up existing observer
    if (this._mutationObserver) {
      this._mutationObserver.disconnect()
    }

    this._mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Watch for added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement

            // Observe the new element with intersection observer
            if (this._intersectionObserver) {
              this._intersectionObserver.observe(element)
            }

            // Also observe any child elements that might be scroll targets
            const childElements = element.querySelectorAll('*')

            childElements.forEach((child) => {
              if (this._intersectionObserver) {
                this._intersectionObserver.observe(child as HTMLElement)
              }
            })
          }
        })
      })
    })

    // Start observing the container for DOM changes
    this._mutationObserver.observe(this._container, {
      childList: true,
      subtree: true,
    })
  }

  scrollIntoView (element: HTMLElement) {
    if (!this._container) {
      throw new Error('A container must be set on the scroller with `scroller.setContainer(container)` before trying to scroll an element into view')
    }

    // Start observing the element if not already observed
    if (this._intersectionObserver && !this._elementVisibilityMap.has(element)) {
      this._intersectionObserver.observe(element)
    }

    // Check if element is already fully visible using cached intersection data
    if (this._elementVisibilityMap.get(element)) {
      return
    }

    // Fallback to manual calculation if intersection observer data not available
    // This happens when the element hasn't been observed yet or the observer isn't ready
    if (!this._elementVisibilityMap.has(element)) {
      // this check is less performant than the intersection observer
      if (this._isFullyVisible(element)) {
        return
      }
    }

    // aim to scroll just into view, so that the bottom of the element
    // is just above the bottom of the container
    let scrollTopGoal = this._aboveBottom(element)

    // can't have a negative scroll, so put it to the top
    if (scrollTopGoal < 0) {
      scrollTopGoal = 0
    }

    this._userScrollCount--
    this._container.scrollTop = scrollTopGoal
  }

  _isFullyVisible (element: HTMLElement) {
    if (!this._container) return false

    const elementOffsetTop = element.offsetTop
    const elementClientHeight = element.clientHeight
    const containerScrollTop = this._container.scrollTop
    const containerClientHeight = this._container.clientHeight

    return elementOffsetTop - containerScrollTop > 0
      && containerScrollTop > elementOffsetTop + elementClientHeight - containerClientHeight + PADDING
  }

  _aboveBottom (element: HTMLElement) {
    // add padding, since commands expanding and collapsing can mess with
    // the offset, causing the running command to be half cut off
    // https://github.com/cypress-io/cypress/issues/228

    const containerHeight = this._container ? this._container.clientHeight : 0

    return element.offsetTop + element.clientHeight - containerHeight + PADDING
  }

  getScrollTop () {
    return this._container ? this._container.scrollTop : 0
  }

  setScrollTop (scrollTop?: number | null) {
    if (this._container && scrollTop != null) {
      this._container.scrollTop = scrollTop
    }
  }

  scrollToEnd () {
    if (!this._container) return

    this.setScrollTop(this._container.scrollHeight - this._container.clientHeight)
  }

  // for testing purposes
  __reset () {
    this._container = null
    this._userScrollCount = 0
    clearTimeout(this._countUserScrollsTimeout)
    this._countUserScrollsTimeout = undefined
    this._userScrollThresholdMs = SCROLL_THRESHOLD_MS

    // Clean up observers
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect()
      this._intersectionObserver = null
    }

    if (this._mutationObserver) {
      this._mutationObserver.disconnect()
      this._mutationObserver = null
    }

    this._elementVisibilityMap = new WeakMap()
  }

  __setScrollThresholdMs (ms: number) {
    const isCypressInCypress = document.defaultView !== top

    // only allow this to be set in testing
    if (!isCypressInCypress) {
      return
    }

    this._userScrollThresholdMs = ms
  }
}

export default new Scroller()
