import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'

class UrlNotYetAvailableError extends Error {
  constructor () {
    const message = 'URL is not yet available'

    super(message)
    this.name = 'UrlNotYetAvailableError'
  }
}

function getUrlFromAutomation (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
  const timeout = options.timeout ?? Cypress.config('defaultCommandTimeout') as number

  this.set('timeout', timeout)

  let fullUrlObj: any = null
  let automationPromise: Promise<void> | null = null
  // need to set a valid type on this
  let mostRecentError = new UrlNotYetAvailableError()

  const getUrlFromAutomation = () => {
    if (automationPromise) {
      return automationPromise
    }

    fullUrlObj = null

    automationPromise = Cypress.automation('get:aut:url', {})
    .timeout(timeout)
    .then((url) => {
      const fullUrlObject = new URL(url)

      fullUrlObj = {
        hash: fullUrlObject.hash,
        host: fullUrlObject.host,
        hostname: fullUrlObject.hostname,
        href: fullUrlObject.href,
        origin: fullUrlObject.origin,
        pathname: fullUrlObject.pathname,
        port: fullUrlObject.port,
        protocol: fullUrlObject.protocol,
        search: fullUrlObject.search,
        searchParams: fullUrlObject.searchParams,
      }
    })
    .catch((err) => {
      mostRecentError.name = err.name
      mostRecentError.message = err.message
    })
    .catch((err) => mostRecentError = err)
    // Pass or fail, we always clear the automationPromise, so future retries know there's no live request to the server.
    .finally(() => automationPromise = null)

    return automationPromise
  }

  this.set('onFail', (err, timedOut) => {
    // if we are actively retrying or the assertion failed, we want to retry
    if (err.name === 'UrlNotYetAvailableError' || err.name === 'AssertionError') {
      // tslint:disable-next-line no-floating-promises
      getUrlFromAutomation()
    } else {
      throw err
    }
  })

  return () => {
    if (fullUrlObj) {
      return fullUrlObj
    }

    // tslint:disable-next-line no-floating-promises
    getUrlFromAutomation()

    throw mostRecentError
  }
}

export default (Commands, Cypress, cy) => {
  Commands.addQuery('url', function url (options: Partial<Cypress.UrlOptions> = {}) {
    Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

    // Since webkit doesn't have an automation client and doesn't support cy.origin(), we need to use the legacy method to get the url
    if (Cypress.isBrowser('webkit')) {
      // Make sure the url command can communicate with the AUT.
      // otherwise, it yields an empty string
      Cypress.ensure.commandCanCommunicateWithAUT(cy)
      this.set('timeout', options.timeout)

      return () => {
        const href = cy.getRemoteLocation('href')

        return options.decode ? decodeURI(href) : href
      }
    }

    const fn = getUrlFromAutomation.bind(this)(options)

    return () => {
      const fullUrlObj = fn()

      if (fullUrlObj) {
        const href = fullUrlObj.href

        return options.decode ? decodeURI(href) : href
      }
    }
  })

  Commands.addQuery('hash', function url (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

    // Since webkit doesn't have an automation client and doesn't support cy.origin(), we need to use the legacy method to get the hash
    if (Cypress.isBrowser('webkit')) {
    // Make sure the hash command can communicate with the AUT.
      Cypress.ensure.commandCanCommunicateWithAUT(cy)
      this.set('timeout', options.timeout)

      Cypress.log({ message: '', hidden: options.log === false, timeout: options.timeout })

      return () => cy.getRemoteLocation('hash')
    }

    const fn = getUrlFromAutomation.bind(this)(options)

    return () => {
      const fullUrlObj = fn()

      if (fullUrlObj) {
        return fullUrlObj.hash
      }
    }
  })

  Commands.addQuery('location', function location (key, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    // normalize arguments allowing key + options to be undefined
    // key can represent the options

    // Make sure the location command can communicate with the AUT.
    // otherwise the command just yields 'null' and the reason may be unclear to the user.
    if (_.isObject(key)) {
      options = key
    }

    Cypress.log({
      message: _.isString(key) ? key : '',
      hidden: options.log === false,
      timeout: options.timeout,
    })

    // Since webkit doesn't have an automation client and doesn't support cy.origin(), we need to use the legacy method to get the location
    if (Cypress.isBrowser('webkit')) {
      // normalize arguments allowing key + options to be undefined
      // key can represent the options

      // Make sure the location command can communicate with the AUT.
      // otherwise the command just yields 'null' and the reason may be unclear to the user.
      Cypress.ensure.commandCanCommunicateWithAUT(cy)

      this.set('timeout', options.timeout)
    }

    const fn = Cypress.isBrowser('webkit') ? cy.getRemoteLocation() : getUrlFromAutomation.bind(this)(options)

    return () => {
      const location = fn()

      if (location === '') {
        // maybe the page's domain is "invisible" to us
        // and we cannot get the location. Return null
        // so the command keeps retrying, maybe there is
        // a redirect that puts us on the domain we can access
        return null
      }

      return _.isString(key)
        // use existential here because we only want to throw
        // on null or undefined values (and not empty strings)
        ? location[key] ?? $errUtils.throwErrByPath('location.invalid_key', { args: { key } })
        : location
    }
  })
}
