import gracefulFs from 'graceful-fs'
import fs from 'fs'
import debugLib from 'debug'
import { pathToFileURL } from 'url'
import * as util from '../util'
import { RunPlugins } from './run_plugins'

gracefulFs.gracefulify(fs)

const debug = debugLib(`cypress:lifecycle:child:run_require_async_child:${process.pid}`)

interface IPC {
  send: (event: string, data?: any) => void
  on: (event: string, callback: (...args: any[]) => void) => void
}

/**
 * Executes and returns the passed `file` (usually `configFile`) file in the ipc `loadConfig` event
 * @param {*} ipc Inter Process Communication protocol
 * @param {*} file the file we are trying to load
 * @param {*} projectRoot the root of the typescript project (useful mainly for tsnode)
 * @returns
 */
function run (ipc: IPC, file: string, projectRoot: string) {
  debug('configFile:', file)
  debug('projectRoot:', projectRoot)
  if (!projectRoot) {
    throw new Error('Unexpected: projectRoot should be a string')
  }

  process.on('uncaughtException', (err) => {
    debug('uncaught exception:', util.serializeError(err))
    ipc.send('childProcess:unhandledError', util.serializeError(err))

    return false
  })

  process.on('unhandledRejection', (event: any) => {
    let err = event

    debug('unhandled rejection:', event)

    // Rejected Bluebird promises will return a reason object.
    // OpenSSL error returns a reason as user-friendly string.
    if (event && event.reason && typeof event.reason === 'object') {
      err = event.reason
    }

    ipc.send('childProcess:unhandledError', util.serializeError(err))

    return false
  })

  const isValidSetupNodeEvents = async (config: any, testingType: string) => {
    if (config[testingType] && config[testingType].setupNodeEvents && typeof config[testingType].setupNodeEvents !== 'function') {
      const errors = await import('@packages/errors')

      ipc.send('setupTestingType:error', util.serializeError(
        errors.getError('SETUP_NODE_EVENTS_IS_NOT_FUNCTION', file, testingType, config[testingType].setupNodeEvents),
      ))

      return false
    }

    return true
  }

  const getValidDevServer = async (config: any) => {
    const { devServer } = config

    if (devServer && typeof devServer === 'function') {
      return { devServer, objApi: false }
    }

    if (devServer && typeof devServer === 'object') {
      if (devServer.bundler === 'webpack') {
        const { devServer: webpackDevServer } = await import('@cypress/webpack-dev-server')

        return { devServer: webpackDevServer, objApi: true }
      }

      if (devServer.bundler === 'vite') {
        // tsx magic allows this import to work even though its a ESM module and we are in a CJS context
        const { devServer: viteDevServer } = await import('@cypress/vite-dev-server')

        return { devServer: viteDevServer, objApi: true }
      }
    }

    const errors = await import('@packages/errors')

    ipc.send('setupTestingType:error', util.serializeError(
      errors.getError('CONFIG_FILE_DEV_SERVER_IS_NOT_VALID', file, config),
    ))

    return false
  }

  // Config file loading of modules is tested within
  // system-tests/projects/config-cjs-and-esm/*
  const loadFile = async (file: string) => {
    try {
      debug('Loading file %s', file)

      return require(file)
    } catch (err: any) {
      if (!err.stack.includes('[ERR_REQUIRE_ESM]') && !err.stack.includes('SyntaxError: Cannot use import statement outside a module')) {
        throw err
      }
    }

    debug('User is loading an ESM config file')

    try {
      // We cannot replace the initial `require` with `await import` because
      // Certain modules cannot be dynamically imported.
      // pathToFileURL for windows interop: https://github.com/nodejs/node/issues/31710
      const fileURL = pathToFileURL(file).href

      debug(`importing esm file %s`, fileURL)

      return await import(fileURL)
    } catch (err) {
      debug('error loading file via native Node.js module loader %s', (err as Error).message)
      throw err
    }
  }

  ipc.on('loadConfig', async () => {
    try {
      debug('try loading', file)
      const configFileExport = await loadFile(file)

      debug('loaded config file', file)
      const result = configFileExport.default || configFileExport

      const replacer = (_key: string, val: any) => {
        return typeof val === 'function' ? `[Function ${val.name}]` : val
      }

      ipc.send('loadConfig:reply', { initialConfig: JSON.stringify(result, replacer), requires: util.nonNodeRequires() })

      let hasSetup = false

      ipc.on('setupTestingType', async (testingType: string, options: any) => {
        if (hasSetup) {
          throw new Error('Already Setup')
        }

        hasSetup = true

        debug(`setupTestingType %s %o`, testingType, options)

        const runPlugins = new RunPlugins(ipc, projectRoot, file)

        if (!(await isValidSetupNodeEvents(result, testingType))) {
          return
        }

        if (testingType === 'component') {
          const devServerInfo = await getValidDevServer(result.component || {})

          if (!devServerInfo) {
            return
          }

          const { devServer, objApi } = devServerInfo

          runPlugins.runSetupNodeEvents(options, (on: any, config: any) => {
            const setupNodeEvents = result.component && result.component.setupNodeEvents || ((on: any, config: any) => {})

            const onConfigNotFound = async (devServer: any, root: string, searchedFor: any) => {
              const errors = await import('@packages/errors')

              ipc.send('setupTestingType:error', util.serializeError(
                errors.getError('DEV_SERVER_CONFIG_FILE_NOT_FOUND', devServer, root, searchedFor),
              ))
            }

            on('dev-server:start', (devServerOpts: any) => {
              if (objApi) {
                const { specs, devServerEvents } = devServerOpts

                return devServer({
                  cypressConfig: config,
                  onConfigNotFound,
                  ...result.component.devServer,
                  specs,
                  devServerEvents,
                })
              }

              devServerOpts.cypressConfig = config

              return devServer(devServerOpts, result.component && result.component.devServerConfig)
            })

            return setupNodeEvents(on, config)
          })
        } else if (testingType === 'e2e') {
          const setupNodeEvents = result.e2e && result.e2e.setupNodeEvents || ((on: any, config: any) => {})

          runPlugins.runSetupNodeEvents(options, setupNodeEvents)
        } else {
          // Notify the plugins init that there's no plugins to resolve
          ipc.send('setupTestingType:reply', {
            requires: util.nonNodeRequires(),
          })
        }
      })

      debug('loaded config from %s %o', file, result)
    } catch (err: any) {
      // With tsx, errors now come in as TransformErrors instead of TSErrors (as they also include JavaScript errors).
      if (err.name === 'TransformError' || err.stack.includes('TransformError')) {
        const { compilerErrorLocation, originalMessage, message } = util.buildErrorLocationFromTransformError(err, projectRoot)

        err.compilerErrorLocation = compilerErrorLocation
        err.originalMessage = originalMessage
        err.message = message
      } else if (Array.isArray(err.errors)) {
        // The stack trace of the esbuild error, do not give to much information related with the user error,
        // we have the errors array which includes the users file and information related with the error
        const firstError = err.errors.filter((e: any) => Boolean(e.location))[0]

        if (firstError && firstError.location.file) {
          err.compilerErrorLocation = { filePath: firstError.location.file, line: Number(firstError.location.line), column: Number(firstError.location.column) }
        }
      }

      const errors = await import('@packages/errors')

      ipc.send('loadConfig:error', util.serializeError(
        errors.getError('CONFIG_FILE_REQUIRE_ERROR', file, err),
      ))
    }
  })

  ipc.send('ready')
}

export default run
