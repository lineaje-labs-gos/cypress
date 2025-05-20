import _ from 'lodash'
import stringifyStable from 'json-stable-stringify'

import $errUtils from '../../../cypress/error_utils'
import $utils from '../../../cypress/utils'
import logGroup from '../../logGroup'
import SessionsManager from './manager'
import {
  getConsoleProps,
  navigateAboutBlank,
  SESSION_STEPS,
  statusMap,
} from './utils'
import Debug from 'debug'

const debug = Debug('cypress:sessions')

/**
 * Session data should be cleared with spec browser launch.
 *
 * Rules for clearing session data:
 *  - if page reloads due to top navigation OR user hard reload, session data should NOT be cleared
 *  - if user relaunches the browser or launches a new spec, session data SHOULD be cleared
 *  - session data SHOULD be cleared between specs in run mode
 */
export default function (Commands, Cypress, cy) {
  debug('Initializing sessions manager')
  const sessionsManager = new SessionsManager(Cypress, cy)
  const sessions = sessionsManager.sessions

  Cypress.on('run:start', () => {
    debug('Run start - checking for active sessions')
    // @ts-ignore
    Object.values(Cypress.state('activeSessions') || {}).forEach((sessionData: Cypress.ServerSessionData) => {
      if (sessionData.cacheAcrossSpecs) {
        debug('Found cached session:', sessionData.id)
        sessionsManager.registeredSessions.set(sessionData.id, true)
      }
    })

    Cypress.on('test:before:after:run:async', (test, Cypress, { nextTestHasTestIsolationOn }: {nextTestHasTestIsolationOn?: boolean} = {}) => {
      debug('Test before:after:run - testIsolation:', nextTestHasTestIsolationOn)
      if (nextTestHasTestIsolationOn || nextTestHasTestIsolationOn === undefined) {
        return navigateAboutBlank({ inBetweenTestsAndNextTestHasTestIsolationOn: true })
      }

      return
    })

    Cypress.on('test:before:run:async', async () => {
      debug('Test before:run - testIsolation:', Cypress.config('testIsolation'))
      if (!Cypress.config('testIsolation')) {
        return
      }

      return sessions.clearCurrentSessionData()
      .then(() => {
        debug('Cleared current session data')

        return Cypress.backend('reset:rendered:html:origins')
      })
    })
  })

  Commands.addAll({
    session (id: string | object, setup: () => void, options: Cypress.SessionOptions = { cacheAcrossSpecs: false }) {
      debug('Session command called with id:', id)
      if (!id || !_.isString(id) && !_.isObject(id)) {
        $errUtils.throwErrByPath('sessions.session.wrongArgId')
      }

      // stringify deterministically if we were given an object
      id = _.isString(id) ? id : stringifyStable(id) as string
      debug('Normalized session id:', id)

      if (!setup || !_.isFunction(setup)) {
        $errUtils.throwErrByPath('sessions.session.wrongArgSetup')
      }

      // backup session command so we can set it as codeFrame location for errors later on
      const sessionCommand = cy.state('current')
      const withinSubjectChain = cy.state('withinSubjectChain')

      if (options) {
        debug('Validating session options:', options)
        if (!_.isObject(options)) {
          $errUtils.throwErrByPath('sessions.session.wrongArgOptions')
        }

        const validOpts = {
          'validate': 'function',
          'cacheAcrossSpecs': 'boolean',
        }

        Object.entries(options).forEach(([key, value]) => {
          const expectedType = validOpts[key]

          if (!expectedType) {
            $errUtils.throwErrByPath('sessions.session.wrongArgOptionUnexpected', { args: { key } })
          }

          const actualType = typeof value

          if (actualType !== expectedType) {
            $errUtils.throwErrByPath('sessions.session.wrongArgOptionInvalid', { args: { key, expected: expectedType, actual: actualType } })
          }
        })
      }

      let session: Cypress.SessionData = sessionsManager.getActiveSession(id as string)
      const isRegisteredSessionForSpec = sessionsManager.registeredSessions.has(id)

      debug('Session lookup - active:', !!session, 'registered:', isRegisteredSessionForSpec)

      if (session) {
        const hasUniqSetupDefinition = session.setup.toString().trim() !== setup.toString().trim()
        const hasUniqValidateDefinition = (!!session.validate !== !!options.validate) || (!!session.validate && !!options.validate && session.validate.toString().trim() !== options.validate.toString().trim())
        const hasUniqPersistence = session.cacheAcrossSpecs !== !!options.cacheAcrossSpecs

        debug('Session comparison:', {
          hasUniqSetupDefinition,
          hasUniqValidateDefinition,
          hasUniqPersistence,
        })

        if (isRegisteredSessionForSpec && (hasUniqSetupDefinition || hasUniqValidateDefinition || hasUniqPersistence)) {
          $errUtils.throwErrByPath('sessions.session.duplicateId', {
            args: {
              id,
              hasUniqSetupDefinition,
              hasUniqValidateDefinition,
              hasUniqPersistence,
            },
          })
        }

        if (session.cacheAcrossSpecs && _.isString(session.setup)) {
          session.setup = setup
        }

        if (session.cacheAcrossSpecs && session.validate && _.isString(session.validate)) {
          session.validate = options.validate
        }
      } else {
        if (isRegisteredSessionForSpec) {
          $errUtils.throwErrByPath('sessions.session.duplicateId', { args: { id } })
        }

        debug('Defining new session')
        session = sessionsManager.defineSession({
          id,
          setup,
          validate: options.validate,
          cacheAcrossSpecs: options.cacheAcrossSpecs,
        })
      }

      function setSessionLogStatus (status: string) {
        debug('Setting session log status:', status)
        _log.set({
          state: statusMap.commandState(status),
          sessionInfo: {
            id: session.id,
            isGlobalSession: session.cacheAcrossSpecs,
            status,
          },
        })
      }

      function createSession (existingSession, step: 'create' | 'recreate') {
        debug('Creating session:', { id: existingSession.id, step })
        logGroup(Cypress, {
          name: 'session',
          displayName: statusMap.stepName(step),
          message: '',
          type: 'system',
        }, (setupLogGroup) => {
          return cy.then(async () => {
            debug('Starting session setup')
            // Catch when a cypress command fails in the setup function to correctly update log status
            // before failing command and ending command queue.
            cy.state('onQueueFailed', (err, _queue) => {
              debug('Session setup failed:', err)
              if (!_.isObject(err)) {
                err = new Error(err)
              }

              setupLogGroup.set({
                state: 'failed',
                consoleProps: () => {
                  return {
                    Step: statusMap.stepName(step),
                    Error: err?.stack || err?.message,
                  }
                },
              })

              setSessionLogStatus('failed')

              $errUtils.modifyErrMsg(err, `\n\nThis error occurred while ${statusMap.inProgress(step)} the session. Because the session setup failed, we failed the test.`, _.add)

              return err
            })

            try {
              debug('Executing session setup function')

              return existingSession.setup()
            } finally {
              debug('Cleaning up after session setup')
              cy.breakSubjectLinksToCurrentChainer()
            }
          })
          .then(async () => {
            debug('Session setup completed, getting session data')
            cy.state('onQueueFailed', null)
            const data = await sessions.getCurrentSessionData()

            _.extend(existingSession, data)
            existingSession.hydrated = true

            _log.set({ consoleProps: () => getConsoleProps(existingSession) })
            setupLogGroup.set({
              consoleProps: () => {
                return {
                  Step: statusMap.stepName(step),
                  Message: 'The following is the collected session data after the session was successfully setup:',

                  ...getConsoleProps(existingSession),
                }
              },
            })

            return
          })
        })
      }

      async function restoreSession (testSession) {
        debug('Restoring session:', testSession.id)
        Cypress.log({
          name: 'session',
          displayName: 'Restore saved session',
          message: '',
          type: 'system',
          consoleProps: () => {
            return {
              Step: 'Restore saved session',
              ...getConsoleProps(testSession),
            }
          },
        })

        _log.set({ consoleProps: () => getConsoleProps(testSession) })

        return sessionsManager.setSessionData(testSession)
      }

      function validateSession (existingSession, step: keyof typeof SESSION_STEPS) {
        debug('Validating session:', { id: existingSession.id, step })
        const isValidSession = true

        if (!existingSession.validate) {
          debug('No validation function provided, skipping validation')

          return isValidSession
        }

        return logGroup(Cypress, {
          name: 'session',
          displayName: 'Validate session',
          message: '',
          type: 'system',
          consoleProps: () => {
            return {
              Step: 'Validate Session',
            }
          },
        }, (validateLog) => {
          return cy.then(async () => {
            debug('Starting session validation')
            const isValidSession = true
            let caughtCommandErr = false
            let _commandToRunAfterValidation

            const enhanceErr = (err) => {
              debug('Enhancing validation error:', err)
              Cypress.state('onQueueFailed', null)
              if (typeof err !== 'object') {
                err = new Error(err)
              }

              const userInvocationStack = $errUtils.getUserInvocationStack(err, Cypress.state)

              err = $errUtils.enhanceStack({
                err,
                userInvocationStack,
                projectRoot: Cypress.config('projectRoot'),
              })

              // show validation error and allow sessions workflow to recreate the session
              if (step === 'restore') {
                $errUtils.modifyErrMsg(err, `\n\nThis error occurred while validating the restored session. Because validation failed, we will try to recreate the session.`, _.add)

                // @ts-ignore
                err.isRecovered = true

                validateLog.set({
                  state: 'failed',
                  consoleProps: () => {
                    return {
                      Error: err.stack,
                    }
                  },
                  // explicitly set via .set() so we don't end the log group early
                  ...(!caughtCommandErr && { error: err }),
                })

                return err
              }

              setSessionLogStatus('failed')
              validateLog.set({
                state: 'failed',
                consoleProps: () => {
                  return {
                    Error: err.stack,
                  }
                },
                snapshot: true,
              })

              $errUtils.modifyErrMsg(err, `\n\nThis error occurred while validating the ${statusMap.complete(step)} session. Because validation failed immediately after ${statusMap.inProgress(step)} the session, we failed the test.`, _.add)

              return err
            }

            cy.state('onQueueFailed', (err, queue): Error => {
              debug('Queue failed during validation:', err)
              if (typeof err !== 'object') {
                err = new Error(err)
              }

              if (step === 'restore') {
                const commands = queue.get()
                // determine command queue index of _commandToRunAfterValidation's index
                let index = _.findIndex(commands, (command: any) => {
                  return (
                    _commandToRunAfterValidation
                    && command.attributes.chainerId === _commandToRunAfterValidation.chainerId
                  )
                })

                // skip all commands between this command which errored and _commandToRunAfterValidation
                for (let i = cy.queue.index; i < index; i++) {
                  commands[i].skip()
                }

                // restore within subject back to the original subject used when
                // the session command kicked off
                Cypress.state('withinSubjectChain', withinSubjectChain)

                // move to _commandToRunAfterValidation's index to ensure failures are
                // handled correctly if next index was not found, the error was caused by
                // a sync validation failure and _commandToRunAfterValidation is our next
                // cmd
                queue.index = index === -1 ? queue.index + 1 : index

                err.isRecovered = true

                caughtCommandErr = true
              }

              return enhanceErr(err)
            })

            let returnVal

            try {
              debug('Executing validation function')
              returnVal = existingSession.validate.call(cy.state('ctx'))
            } catch (err) {
              debug('Validation function threw error:', err)
              err.onFail = (err) => {
                validateLog.set({
                  error: err,
                  state: 'failed',
                })
              }

              throw err
            }

            _commandToRunAfterValidation = cy.then(async () => {
              debug('Validation function completed')
              Cypress.state('onQueueFailed', null)

              if (caughtCommandErr) {
                return !isValidSession
              }

              const failValidation = (err) => {
                debug('Validation failed:', err)
                if (step === SESSION_STEPS.restore) {
                  enhanceErr(err)

                  // move to recreate session flow
                  return !isValidSession
                }

                err.onFail = (err) => {
                  validateLog.error(err)
                }

                throw enhanceErr(err)
              }

              // when the validate function returns a promise, ensure it does not return false or throw an error
              if ($utils.isPromiseLike(returnVal)) {
                debug('Validation returned promise, waiting for resolution')

                return returnVal
                .then((val) => {
                  debug('Validation promise resolved:', val)
                  if (val === false) {
                    // set current command to cy.session for more accurate codeFrame
                    cy.state('current', sessionCommand)

                    throw $errUtils.errByPath('sessions.validate_callback_false', { reason: 'promise resolved false' })
                  }

                  return isValidSession
                })
                .catch((err) => {
                  debug('Validation promise rejected:', err)
                  if (!(err instanceof Error)) {
                    // set current command to cy.session for more accurate codeFrame
                    cy.state('current', sessionCommand)
                    err = $errUtils.errByPath('sessions.validate_callback_false', { reason: `promise rejected with ${String(err)}` })
                  }

                  return failValidation(err)
                })
              }

              if (returnVal === undefined || Cypress.isCy(returnVal)) {
                const yielded = cy.state('current').get('prev')?.attributes?.subject

                if (yielded === false) {
                  debug('Validation yielded false')
                  // set current command to cy.session for more accurate codeframe
                  cy.state('current', sessionCommand)

                  return failValidation($errUtils.errByPath('sessions.validate_callback_false', { reason: 'callback yielded false' }))
                }
              }

              // collect all session data again that may have been updated during the validation check
              debug('Collecting updated session data')
              const data = await sessions.getCurrentSessionData()

              _.extend(existingSession, data)
              validateLog.set({
                consoleProps: () => {
                  return {
                    Step: 'Validate Session',
                    Message: 'The following is the collected session data after the session was successfully validated:',
                    ...getConsoleProps(existingSession),
                  }
                },
              })

              return isValidSession
            })

            return _commandToRunAfterValidation
          })
        })
      }
      /**
       * Creates session flow:
       *   1. create session
       *   2. validate session
       */
      const createSessionWorkflow = (existingSession, step: 'create' | 'recreate') => {
        debug('Starting create session workflow:', { id: existingSession.id, step })

        return cy.then(async () => {
          setSessionLogStatus(statusMap.inProgress(step))

          debug('Navigating to about:blank')
          await navigateAboutBlank()
          debug('Clearing current session data')
          await sessions.clearCurrentSessionData()

          return cy.whenStable(() => createSession(existingSession, step))
        })
        .then(() => validateSession(existingSession, step))
        .then(async (isValidSession: boolean) => {
          debug('Session workflow completed:', { isValidSession })
          if (!isValidSession) {
            return 'failed'
          }

          sessionsManager.registeredSessions.set(existingSession.id, true)
          await sessionsManager.saveSessionData(existingSession)

          return statusMap.complete(step)
        })
      }

      /**
       * Restore session flow:
       *   1. restore session
       *   2. validate session
       *   3. if validation fails, catch error and recreate session
       */
      const restoreSessionWorkflow = (existingSession: Cypress.SessionData) => {
        debug('Starting restore session workflow:', existingSession.id)

        return cy.then(async () => {
          setSessionLogStatus(statusMap.inProgress(SESSION_STEPS.restore))
          debug('Navigating to about:blank')
          await navigateAboutBlank()
          debug('Clearing current session data')
          await sessions.clearCurrentSessionData()

          return restoreSession(existingSession)
        })
        .then(() => validateSession(existingSession, SESSION_STEPS.restore))
        .then((isValidSession: boolean) => {
          debug('Restore validation result:', isValidSession)
          if (!isValidSession) {
            debug('Validation failed, recreating session')

            return createSessionWorkflow(existingSession, SESSION_STEPS.recreate)
          }

          return statusMap.complete(SESSION_STEPS.restore)
        })
      }

      /**
       * Session command rules:
       *   If session does not exists or was no previously saved to the server, create session
       *      1. run create session flow
       *      2. clear page
       *
       *   If session exists or has been saved to the server, restore session
       *      1. run restore session flow
       *      2. clear page
       */
      let _log
      const groupDetails = {
        message: `${session.id.length > 50 ? `${session.id.substring(0, 47)}...` : session.id}`,
      }

      return logGroup(Cypress, groupDetails, (log) => {
        return cy.then(async () => {
          debug('Starting session command execution')
          _log = log

          if (!session.hydrated) {
            debug('Session not hydrated, checking server for stored session')
            const serverStoredSession = await sessions.getSession(session.id).catch(_.noop)

            // we have a saved session on the server and setup matches
            if (serverStoredSession && serverStoredSession.setup === session.setup.toString()) {
              debug('Found matching server stored session')
              _.extend(session, _.omit(serverStoredSession, 'setup', 'validate'))
              session.hydrated = true
            } else {
              debug('No matching server session found, creating new session')

              return createSessionWorkflow(session, SESSION_STEPS.create)
            }
          }

          debug('Restoring existing session')

          return restoreSessionWorkflow(session)
        }).then((status: 'created' | 'restored' | 'recreated' | 'failed') => {
          debug('Session command completed with status:', status)

          return navigateAboutBlank()
          .then(() => {
            setSessionLogStatus(status)
          })
        })
      })
    },
  })

  Cypress.session = sessions
}
