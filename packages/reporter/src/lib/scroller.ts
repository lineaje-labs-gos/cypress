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
  private _elementCache = new WeakMap<HTMLElement, { offsetTop: number, clientHeight: number }>()
  private _cacheTimeout?: number

  setContainer (container: Element, onUserScroll?: UserScrollCallback) {
    this._container = container

    this._userScrollCount = 0

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

  private _getElementMeasurements (element: HTMLElement) {
    const cached = this._elementCache.get(element)

    if (cached) {
      return cached
    }

    const measurements = {
      offsetTop: element.offsetTop,
      clientHeight: element.clientHeight,
    }

    this._elementCache.set(element, measurements)

    // Clear cache periodically to prevent memory leaks
    if (!this._cacheTimeout) {
      this._cacheTimeout = window.setTimeout(() => {
        this._elementCache = new WeakMap()
        this._cacheTimeout = undefined
      }, 5000) // Clear cache every 5 seconds
    }

    return measurements
  }

  scrollIntoView (element: HTMLElement) {
    if (!this._container) {
      throw new Error('A container must be set on the scroller with `scroller.setContainer(container)` before trying to scroll an element into view')
    }

    // Cache DOM measurements to avoid multiple reads
    const containerScrollTop = this._container.scrollTop
    const elementMeasurements = this._getElementMeasurements(element)
    const containerClientHeight = this._container.clientHeight

    // Check if fully visible using cached values
    if (this._isFullyVisibleWithCache(elementMeasurements, containerScrollTop, containerClientHeight)) {
      return
    }

    // Use RAF for smooth scrolling
    requestAnimationFrame(() => {
      // Re-measure in case element changed during RAF
      const currentMeasurements = this._getElementMeasurements(element)
      const currentContainerScrollTop = this._container!.scrollTop
      const currentContainerClientHeight = this._container!.clientHeight

      // Re-check visibility in case it changed
      if (this._isFullyVisibleWithCache(currentMeasurements, currentContainerScrollTop, currentContainerClientHeight)) {
        return
      }

      // Calculate scroll goal using cached values
      const scrollTopGoal = Math.max(0, currentMeasurements.offsetTop + currentMeasurements.clientHeight - currentContainerClientHeight + PADDING)

      this._userScrollCount--
      this._container!.scrollTop = scrollTopGoal
    })
  }

  private _isFullyVisibleWithCache (elementMeasurements: { offsetTop: number, clientHeight: number }, containerScrollTop: number, containerClientHeight: number) {
    return elementMeasurements.offsetTop - containerScrollTop > 0
           && elementMeasurements.offsetTop + elementMeasurements.clientHeight - containerScrollTop < containerClientHeight - PADDING
  }

  _isFullyVisible (element: HTMLElement) {
    if (!this._container) return false

    const containerScrollTop = this._container.scrollTop
    const elementOffsetTop = element.offsetTop
    const elementClientHeight = element.clientHeight
    const containerClientHeight = this._container.clientHeight

    return elementOffsetTop - containerScrollTop > 0
           && containerScrollTop > elementOffsetTop + elementClientHeight - containerClientHeight + PADDING
  }

  _aboveBottom (element: HTMLElement) {
    // add padding, since commands expanding and collapsing can mess with
    // the offset, causing the running command to be half cut off
    // https://github.com/cypress-io/cypress/issues/228

    if (!this._container) return 0

    const containerClientHeight = this._container.clientHeight
    const elementOffsetTop = element.offsetTop
    const elementClientHeight = element.clientHeight

    return elementOffsetTop + elementClientHeight - containerClientHeight + PADDING
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
