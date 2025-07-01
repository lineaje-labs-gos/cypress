// @ts-check
// this module is responsible for loading the plugins file
// and running the exported function to register event handlers
// and executing any tasks that the plugin registers

import debugLib from 'debug'
import Promise from 'bluebird'
import _ from 'lodash'
import errors from '@packages/errors'
import webpackPreprocessor from '@cypress/webpack-batteries-included-preprocessor'

import preprocessor from './preprocessor.mjs'
import devServer from './dev-server.mjs'
import resolve from '../../util/resolve.mjs'
import browserLaunch from './browser_launch.mjs'
import util from '../util.js'
import validateEvent from './validate_event.mjs'
import crossOrigin from './cross_origin.mjs'

const debug = debugLib(`cypress:lifecycle:child:RunPlugins:${process.pid}`)

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

export class RunPlugins {
  constructor (ipc, projectRoot, requiredFile) {
    this.ipc = ipc
    /**
     * @type {string}
     */
    this.projectRoot = projectRoot
    /**
     * @type {string}
     */
    this.requiredFile = requiredFile
    this.eventIdCount = 0
    this.registrations = []
    /**
     * @type {Record<string, {event: string, handler: Function}>}
     */
    this.registeredEventsById = {}
    this.registeredEventsByName = {}
  }

  /**
   * This is the only publicly-used method of this class
   *
   * @param {Object} config
   * @param {Function} setupNodeEventsFn
   */
  runSetupNodeEvents (config, setupNodeEventsFn) {
    debug('project root:', this.projectRoot)
    if (!this.projectRoot) {
      throw new Error('Unexpected: projectRoot should be a string')
    }

    debug('passing config %o', config)

    this.ipc.on('execute:plugins', (event, ids, args) => {
      this.execute(event, ids, args)
    })

    return this.load(config, setupNodeEventsFn)
  }

  load (initialConfig, setupNodeEvents) {
    debug('Loading the RunPlugins')

    // we track the register calls and then send them all at once
    // to the parent process
    const registerChildEvent = (event, handler) => {
      const { isValid, userEvents, error } = validateEvent(event, handler, initialConfig)

      if (!isValid) {
        const err = userEvents
          ? errors.getError('SETUP_NODE_EVENTS_INVALID_EVENT_NAME_ERROR', this.requiredFile, event, userEvents, error)
          : errors.getError('CONFIG_FILE_SETUP_NODE_EVENTS_ERROR', this.requiredFile, initialConfig.testingType, error)

        this.ipc.send('setupTestingType:error', util.serializeError(err))

        return
      }

      if (event === 'task') {
        const existingEventId = this.registeredEventsByName[event]

        if (existingEventId) {
          handler = this.taskMerge(this.registeredEventsById[existingEventId].handler, handler)
          this.registeredEventsById[existingEventId] = { event, handler }
          debug('extend task events with id', existingEventId)

          return
        }
      }

      const eventId = this.eventIdCount++

      this.registeredEventsById[eventId] = { event, handler }
      this.registeredEventsByName[event] = eventId

      debug('register event', event, 'with id', eventId)

      this.registrations.push({
        event,
        eventId,
      })
    }

    // events used for parent/child communication
    registerChildEvent('_get:task:body', () => {})
    registerChildEvent('_get:task:keys', () => {})
    registerChildEvent('_process:cross:origin:callback', crossOrigin.processCallback)

    return Promise
    .try(() => {
      debug('Calling setupNodeEvents')

      return setupNodeEvents(registerChildEvent, initialConfig)
    })
    .tap(() => {
      if (!this.registeredEventsByName['file:preprocessor']) {
        debug('register default preprocessor')
        registerChildEvent('file:preprocessor', this._getDefaultPreprocessor(initialConfig))
      } else {
        const handler = this.registeredEventsById[this.registeredEventsByName['file:preprocessor']].handler

        this.ipc.send('file:preprocessor:overridden', { handlerText: handler.toString() })
      }
    })
    .then((modifiedCfg) => {
      debug('plugins file successfully loaded')

      this.ipc.send('setupTestingType:reply', {
        setupConfig: modifiedCfg,
        registrations: this.registrations,
        requires: util.nonNodeRequires(),
      })
    })
    .catch((err) => {
      debug('plugins file errored:', err && err.stack)
      this.ipc.send('setupTestingType:error', util.serializeError(errors.getError(
        'CONFIG_FILE_SETUP_NODE_EVENTS_ERROR',
        this.requiredFile,
        initialConfig.testingType,
        err,
      )))
    })
  }

  execute (event, ids, args = []) {
    debug(`execute plugin event: ${event} (%o)`, ids)

    switch (event) {
      case 'dev-server:start':
        return devServer.wrap(this.ipc, this.invoke, ids, args)
      case 'file:preprocessor':
        return preprocessor.wrap(this.ipc, this.invoke, ids, args)
      case 'before:run':
      case 'before:spec':
      case 'after:run':
      case 'after:spec':
      case 'after:screenshot':
      case '_process:cross:origin:callback':
        return util.wrapChildPromise(this.ipc, this.invoke, ids, args)
      case 'task':
        return this.taskExecute(ids, args)
      case '_get:task:keys':
        return this.taskGetKeys(ids)
      case '_get:task:body':
        return this.taskGetBody(ids, args)
      case 'before:browser:launch':
        return browserLaunch.wrapBefore(this.ipc, this.invoke, ids, args)
      case 'after:browser:launch':
        return util.wrapChildPromise(this.ipc, this.invoke, ids, args)
      default:
        debug('unexpected execute message:', event, args)

        return
    }
  }

  invoke = (eventId, args = []) => {
    const event = this.registeredEventsById[eventId]

    return event.handler(...args)
  }

  wrapChildPromise (invoke, ids, args = []) {
    return Promise.try(() => {
      return invoke(ids.eventId, args)
    })
    .then((value) => {
      // undefined is coerced into null when sent over ipc, but we need
      // to differentiate between them for 'task' event
      if (value === undefined) {
        value = UNDEFINED_SERIALIZED
      }

      return this.ipc.send(`promise:fulfilled:${ids.invocationId}`, null, value)
    }).catch((err) => {
      return this.ipc.send(`promise:fulfilled:${ids.invocationId}`, util.serializeError(err))
    })
  }

  taskGetBody (ids, args) {
    const [event] = args
    const taskEvent = _.find(this.registeredEventsById, { event: 'task' })
    const invoke = () => {
      const fn = taskEvent && taskEvent.handler[event]

      return _.isFunction(fn) ? fn.toString() : ''
    }

    util.wrapChildPromise(this.ipc, invoke, ids)
  }

  taskGetKeys (ids) {
    const taskEvent = _.find(this.registeredEventsById, { event: 'task' })
    const invoke = () => _.keys(taskEvent ? taskEvent.handler : {})

    util.wrapChildPromise(this.ipc, invoke, ids)
  }

  taskMerge (target, events) {
    const duplicates = _.intersection(_.keys(target), _.keys(events))

    if (duplicates.length) {
      errors.warning('DUPLICATE_TASK_KEY', duplicates)
    }

    return _.extend(target, events)
  }

  taskExecute (ids, args) {
    const task = args[0]
    let arg = args[1]

    // ipc converts undefined to null.
    // we're restoring it.
    if (arg && arg.__cypress_task_no_argument__) {
      arg = undefined
    }

    const invoke = (eventId, args = []) => {
      const handler = _.get(this.registeredEventsById, `${eventId}.handler.${task}`)

      if (_.isFunction(handler)) {
        return handler(...args)
      }

      return '__cypress_unhandled__'
    }

    util.wrapChildPromise(this.ipc, invoke, ids, [arg])
  }

  _getDefaultPreprocessor (config) {
    const tsPath = resolve.typescript(config.projectRoot)
    const options = {
      ...tsPath && { typescript: tsPath },
    }

    debug('creating webpack batteries included preprocessor with options %o', options)

    return webpackPreprocessor(options)
  }
}
