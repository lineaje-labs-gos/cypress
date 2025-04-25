import DebugProxy from '@cypress/debugging-proxy'
import systemTests from '../lib/system-tests'
import {
  createRoutes,
  setupStubbedServer,
  setupPrimaryAlternateStubbedServer as setupPreliminaryAlternateStubbedServer,
  encryptBody,
} from '../lib/serverStub'
import { test as apiUrls } from '@packages/server/config/app.json'

describe('recording through proxy', () => {
  let proxy: DebugProxy

  const expectedPaths = [
    'runs',
    'runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
    'instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
    'instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/results',
    'instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/artifacts',
    'instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/stdout',
    'runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
  ]
  const preliminaryHost = apiUrls.preliminary_url
  const primaryHost = apiUrls.primary_url
  const preliminaryPort = Number(new URL(apiUrls.preliminary_url).port)
  const primaryPort = Number(new URL(apiUrls.primary_url).port)

  function expectedUrls (host: typeof preliminaryHost | typeof primaryHost) {
    return expectedPaths.map((path) => `${host}${path}`)
  }

  beforeEach(async () => {
    proxy = new DebugProxy({
      host: 'localhost',
      keepRequests: true,
    })

    await proxy.start(3128)

    process.env.DISABLE_API_RETRIES = 'true'
    process.env.HTTP_PROXY = 'http://localhost:3128'
    process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS = 'http://localhost:3128'
    process.env.NO_PROXY = '<-loopback>'
  })

  afterEach(async () => {
    await proxy.stop()
  })

  describe('when the initial preflight is not proxied and returns the preliminary host on preflight', () => {
    setupStubbedServer(createRoutes({
      sendPreflight: {
        method: 'post',
        url: '/preflight',
        res: async (req, res) => {
          const preflightResponse = { encrypt: true, apiUrl: preliminaryHost }

          return res.json(await encryptBody(req, res, preflightResponse))
        },
      },
    }))

    it('sends all api requests to the preliminary host', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        expectedExitCode: 0,
        record: true,
      })

      const proxiedUrls = proxy.getRequests().map(({ url }) => url)

      expect(proxiedUrls).not.to.include(`${preliminaryHost}/preflight`)
      expect(proxiedUrls).to.include.members(expectedUrls(preliminaryHost))
    })
  })

  describe('when the preliminary preflight is not proxied, and returns the primary host', () => {
    setupPreliminaryAlternateStubbedServer([{
      routes: {
        sendPreflight: {
          method: 'post',
          url: '/preflight',
          res: async (req, res) => {
            const preflightResponse = { encrypt: true, apiUrl: primaryHost }

            return res.json(await encryptBody(req, res, preflightResponse))
          },
        },
      },
      port: 1234,
    }, {
      routes: createRoutes(),
      port: 4321,
    }])

    it('makes subsequent requests to the primary host', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        expectedExitCode: 0,
        record: true,
      })

      const proxiedUrls = proxy.getRequests().map(({ url }) => url)

      expect(proxiedUrls).not.to.include(`${preliminaryHost}/preflight`)

      expect(proxy.getRequests().map(({ url }) => url)).to.include.members(expectedUrls(primaryHost))
    })
  })

  describe('when the preliminary preflight is not proxied and fails, a preflight is sent to the primary api host via the proxy.', () => {
    let preliminaryHostPreflightCalled = false

    setupPreliminaryAlternateStubbedServer(
      [
        {
          routes: {
            sendPreflight: {
              method: 'post',
              url: '/preflight',
              res: async (req, res) => {
                preliminaryHostPreflightCalled = true

                return res.status(500).send('Server Error')
              },
            },
          },
          port: preliminaryPort,
        },
        {
          routes: createRoutes(),
          port: primaryPort,
        },
      ],
    )

    beforeEach(() => {
      preliminaryHostPreflightCalled = false
    })

    it('makes all subsequent requests to the primary host through the proxy', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        expectedExitCode: 0,
        record: true,
      })

      expect(preliminaryHostPreflightCalled).to.be.true

      const proxiedUrls = proxy.getRequests().map(({ url }) => url)

      expect(proxiedUrls).not.to.include(`${preliminaryHost}/preflight`)
      expect(proxiedUrls).not.to.include.members(expectedUrls(preliminaryHost))
      expect(proxiedUrls).to.include.members(expectedUrls(primaryHost))
    })
  })
})
