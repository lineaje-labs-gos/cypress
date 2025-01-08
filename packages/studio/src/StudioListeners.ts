import { generateBothLogs, generateLog, stringifyActual } from './logs'
import { StudioAssertionsMenuManager } from './StudioAssertionsMenuManager'

const eventsWithValue = [
  'change',
  'keydown',
  'keyup',
]

const eventTypes = [
  'click',
  'change',
  'keydown',
  'keyup',
]

const internalMouseEvents = [
  'mousedown',
  'mouseover',
  'mouseout',
]

const tagNamesWithoutText = [
  'SELECT',
  'INPUT',
  'TEXTAREA',
]

const tagNamesWithValue = [
  'BUTTON',
  'INPUT',
  'METER',
  'LI',
  'OPTION',
  'PROGRESS',
  'TEXTAREA',
]

export class StudioListeners {
  private body
  private eventManager
  private isDisabled = false
  private currentId = 1
  logs: any[] = []
  testId: string
  previousMouseEvent: any

  constructor (eventManager, testId) {
    this.eventManager = eventManager
    this.testId = testId
  }

  disable = () => {
    this.isDisabled = true
  }

  enable = () => {
    this.isDisabled = false
  }

  reset = () => {
    this.logs = []
    this.currentId = 1
    this.removeListeners()
  }

  attachListeners = (body) => {
    if (this.isDisabled) {
      return
    }

    this.body = body

    for (const event of eventTypes) {
      this.body.addEventListener(event, this.recordEvent, {
        capture: true,
        passive: true,
      })
    }

    for (const event of internalMouseEvents) {
      this.body.addEventListener(event, this.recordMouseEvent, {
        capture: true,
        passive: true,
      })
    }

    this.body.addEventListener('contextmenu', this.openAssertionsMenu, {
      capture: true,
    })

    this.clearPreviousMouseEvent()
  }

  removeListeners = () => {
    if (!this.body) {
      return
    }

    for (const event of eventTypes) {
      this.body.removeEventListener(event, this.recordEvent, {
        capture: true,
      })
    }

    for (const event of internalMouseEvents) {
      this.body.removeEventListener(event, this.recordMouseEvent, {
        capture: true,
      })
    }

    this.body.removeEventListener('contextmenu', this.openAssertionsMenu, {
      capture: true,
    })

    this.clearPreviousMouseEvent()
  }

  removeLog = (id) => {
    const index = this.logs.findIndex((command) => command.id === id)
    const log = this.logs[index]

    this.logs = [...this.logs.slice(0, index), ...this.logs.slice(index + 1)]

    generateBothLogs({ log, hookId: `${this.testId}-studio`, testId: this.testId }).forEach((commandLog) => {
      this.eventManager.emit('reporter:log:remove', commandLog)
    })
  }

  private openAssertionsMenu (event) {
    if (!this.body) {
      throw Error('this._body was not defined')
    }

    event.preventDefault()
    event.stopPropagation()

    const el = event.target

    if (this.isAssertionsMenu(el)) {
      return
    }

    this.closeAssertionsMenu()

    StudioAssertionsMenuManager.instance.openStudioAssertionsMenu({
      el,
      body: window.UnifiedRunner.CypressJQuery(this.body),
      props: {
        possibleAssertions: this.generatePossibleAssertions(el),
        addAssertion: this.addAssertion,
        closeMenu: this.closeAssertionsMenu,
      },
    })
  }

  private generatePossibleAssertions (el) {
    const tagName = el.tagName

    const possibleAssertions: any[] = []

    if (!tagNamesWithoutText.includes(tagName)) {
      const text = el.textContent

      if (text) {
        possibleAssertions.push({
          type: 'have.text',
          options: [{
            value: text,
          }],
        })
      }
    }

    if (tagNamesWithValue.includes(tagName)) {
      const val = el.value

      if (val !== undefined && val !== '') {
        possibleAssertions.push({
          type: 'have.value',
          options: [{
            value: val,
          }],
        })
      }
    }

    const attributes = Array.from(el.attributes as ArrayLike<{ name: string, value: string }>).reduce<Array<{ name: string, value: string }>>((acc, { name, value }) => {
      if (name === 'value' || name === 'disabled') {
        return acc
      }

      if (name === 'class') {
        possibleAssertions.push({
          type: 'have.class',
          options: value.split(' ').map((value) => ({ value })),
        })

        return acc
      }

      if (name === 'id') {
        possibleAssertions.push({
          type: 'have.id',
          options: [{
            value,
          }],
        })

        return acc
      }

      if (name !== undefined && name !== '' && value !== undefined && value !== '') {
        return acc.concat({
          name,
          value,
        })
      }

      return acc
    }, [])

    if (attributes.length > 0) {
      possibleAssertions.push({
        type: 'have.attr',
        options: attributes,
      })
    }

    possibleAssertions.push({
      type: 'be.visible',
    })

    const isDisabled = el.disabled

    if (isDisabled !== undefined) {
      possibleAssertions.push({
        type: isDisabled ? 'be.disabled' : 'be.enabled',
      })
    }

    const isChecked = el.checked

    if (isChecked !== undefined) {
      possibleAssertions.push({
        type: isChecked ? 'be.checked' : 'not.be.checked',
      })
    }

    return possibleAssertions
  }

  private addAssertion (el, ...args) {
    const id = this.getId()
    const selector = this.eventManager.getCypress().SelectorPlayground.getSelector(window.UnifiedRunner.CypressJQuery(el))

    const log = {
      id,
      selector,
      name: 'should',
      message: args,
      isAssertion: true,
    }

    this.logs.push(log)

    const reporterLog = {
      id,
      selector,
      name: 'assert',
      message: this.generateAssertionMessage(el as HTMLElement, ...args),
    }

    generateBothLogs({ log: reporterLog, hookId: `${this.testId}-studio`, testId: this.testId }).forEach((commandLog) => {
      this.eventManager.emit('reporter:log:add', commandLog)
    })

    this.closeAssertionsMenu()
  }

  private generateAssertionMessage = (el, ...args) => {
    const elementString = stringifyActual(el)
    const assertionString = args[0].replace(/\./g, ' ')

    let message = `expected **${elementString}** to ${assertionString}`

    if (args[1]) {
      message = `${message} **${args[1]}**`
    }

    if (args[2]) {
      message = `${message} with the value **${args[2]}**`
    }

    return message
  }

  private recordEvent = (event) => {
    if (this.isDisabled || !this.trustEvent(event)) return

    const target = event.target

    if (this.isAssertionsMenu(target)) {
      return
    }

    this.closeAssertionsMenu()

    if (!this.shouldRecordEvent(event, target)) {
      return
    }

    const name = this.getName(event, target)
    const message = this.getMessage(event, target)

    if (name === 'change') {
      return
    }

    let selector: string | undefined = ''

    if (name === 'click' && this.matchPreviousMouseEvent(target)) {
      selector = this.previousMouseEvent?.selector
    } else {
      selector = this.eventManager.getCypress().SelectorPlayground.getSelector(window.UnifiedRunner.CypressJQuery(target))
    }

    this.clearPreviousMouseEvent()

    if (name === 'type' && !message) {
      return this.removeLastLogIfType(selector)
    }

    const updateOnly = this.updateLastLog(selector, name, message)

    if (updateOnly) {
      return
    }

    if (name === 'type') {
      this.addClearLog(selector)
    }

    this.addLog({
      selector,
      name,
      message,
    })
  }

  private removeLastLogIfType = (selector?: string) => {
    const lastLog = this.logs[this.logs.length - 1]

    if (lastLog.selector === selector && lastLog.name === 'type') {
      return this.removeLog(lastLog.id)
    }
  }

  private updateLog = (log) => {
    const { id, name, message } = log

    this.eventManager.emit('reporter:log:state:changed', generateLog({
      id: `s${id}`,
      hookId: `${this.testId}-studio`,
      name,
      message,
      type: 'child',
    }))
  }

  private getId = () => {
    return this.currentId++
  }

  private addLog = (log) => {
    log.id = this.getId()

    this.logs.push(log)

    generateBothLogs({ log, hookId: `${this.testId}-studio`, testId: this.testId }).forEach((commandLog) => {
      this.eventManager.emit('reporter:log:add', commandLog)
    })
  }

  private addClearLog = (selector) => {
    const lastLog = this.logs[this.logs.length - 1]

    if (lastLog && lastLog.name === 'clear' && lastLog.selector === selector) {
      return
    }

    this.addLog({
      selector,
      name: 'clear',
      message: undefined,
    })
  }

  private updateLastLog = (selector: string | undefined, name: string, message: unknown) => {
    const { length } = this.logs

    if (!length) {
      return false
    }

    const lastLog = this.logs[length - 1]

    const updateLog = (newName = name, newMessage = message) => {
      lastLog.message = newMessage
      lastLog.name = newName

      this.updateLog(lastLog)
    }

    if (selector === lastLog.selector) {
      if (name === 'type' && lastLog.name === 'type') {
        updateLog()

        return true
      }

      // Cypress automatically issues a .click before every type
      // so we can turn the extra click event into the .clear that comes before every type
      if (name === 'type' && lastLog.name === 'click') {
        updateLog('clear', undefined)

        // we return false since we still need to add the type log
        return false
      }
    }

    return false
  }

  private clearPreviousMouseEvent = () => {
    this.previousMouseEvent = undefined
  }

  private recordMouseEvent = (event) => {
    if (!this.trustEvent(event)) return

    const { type, target } = event

    if (type === 'mouseout') {
      return this.clearPreviousMouseEvent()
    }

    // we only replace the previous mouse event if the element is different
    // since we want to use the oldest possible selector
    if (!this.matchPreviousMouseEvent(target)) {
      this.previousMouseEvent = {
        element: target,
        selector: this.eventManager.getCypress().SelectorPlayground.getSelector(window.UnifiedRunner.CypressJQuery(target)),
      }
    }
  }

  private shouldRecordEvent = (event, target) => {
    const tagName = target.tagName

    // only want to record keystrokes within input elements
    if ((event.type === 'keydown' || event.type === 'keyup') && tagName !== 'INPUT') {
      return false
    }

    // we record all normal keys on keyup (rather than keydown) since the input value will be updated
    // we do not record enter on keyup since a form submission will have already been triggered
    if (event.type === 'keyup' && event.key === 'Enter') {
      return false
    }

    // we record enter on keydown since this happens before a form submission is triggered
    // all other keys are recorded on keyup
    if (event.type === 'keydown' && event.key !== 'Enter') {
      return false
    }

    // cy cannot click on a select
    if (tagName === 'SELECT' && event.type === 'click') {
      return false
    }

    // do not record clicks on option elements since this is handled with cy.select()
    if (tagName === 'OPTION') {
      return false
    }

    return true
  }

  private getName = (event, target) => {
    const tagName = target.tagName
    const { type } = event

    if (tagName === 'SELECT' && type === 'change') {
      return 'select'
    }

    if (type === 'keydown' || type === 'keyup') {
      return 'type'
    }

    if (type === 'click' && tagName === 'INPUT') {
      const inputType = target.type
      const checked = target.checked

      if (inputType === 'radio' || (inputType === 'checkbox' && checked)) {
        return 'check'
      }

      if (inputType === 'checkbox') {
        return 'uncheck'
      }
    }

    return type
  }

  private getMessage = (event, target) => {
    if (!eventsWithValue.includes(event.type)) {
      return undefined
    }

    let val = target.value

    if (event.type === 'keydown' || event.type === 'keyup') {
      val = val.replace(/{/g, '{{}')

      if (event.key === 'Enter') {
        val = `${val}{enter}`
      }
    }

    return val
  }

  private matchPreviousMouseEvent (target) {
    return this.previousMouseEvent && target === this.previousMouseEvent.element
  }

  private trustEvent = (event) => {
    // only capture events sent by the actual user
    // but disable the check if we're in a test
    return event.isTrusted || this.eventManager.getCypress().env('INTERNAL_E2E_TESTS') === 1
  }

  private isAssertionsMenu = (el) => {
    return el.classList.contains('__cypress-studio-assertions-menu')
  }

  private closeAssertionsMenu = () => {
    if (!this.body) {
      throw Error('this.body was not defined')
    }

    StudioAssertionsMenuManager.instance.closeStudioAssertionsMenu(this.body)
  }
}
