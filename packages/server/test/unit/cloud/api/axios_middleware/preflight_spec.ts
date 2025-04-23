const { sinon } = require('../../../../spec_helper')

import type { SinonStubbedInstance, SinonStub } from 'sinon'
import { expect } from 'chai'

import { PreflightMiddleware } from '../../../../../lib/cloud/api/axios_middleware/preflight'
import axios, { Axios, AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosDefaults, HeadersDefaults, AxiosHeaderValue, AxiosResponse } from 'axios'
import * as preflightEndpoint from '../../../../../lib/cloud/api/endpoints/post_preflight'
import * as routes from '../../../../../lib/cloud/routes'
import { HttpAgent, HttpsAgent } from '@packages/network/lib/agent'
import * as asyncRetryModule from '../../../../../lib/util/async_retry'

describe('PreflightMiddleware', () => {
  const apiUrl = 'https://api.cypress.test'
  const apiProxyUrl = 'https://api-proxy.cypress.test'
  const preflightResponseApiUrl = 'https://preflight.cypress.test'

  const preflightResponse: Awaited<ReturnType<typeof postPreflightStub>> = {
    apiUrl: preflightResponseApiUrl,
    encrypt: true,
    warnings: [],
  }

  const projectAttributes: Parameters<typeof preflightEndpoint.postPreflight>[0] = {
    projectId: '123',
    projectRoot: '/some/path',
    ciBuildId: 'abc',
    browser: {},
    testingType: 'e2e',
    parallel: true,
  }

  let axiosInstance: SinonStubbedInstance<AxiosInstance>
  let postPreflightStub: SinonStub<Parameters<typeof preflightEndpoint.postPreflight>, ReturnType<typeof preflightEndpoint.postPreflight>>
  let axiosCreateStub: SinonStub<Parameters<typeof axios.create>, ReturnType<typeof axios.create>>
  let getApiUrlStub: SinonStub<Parameters<typeof routes.getApiUrl>, ReturnType<typeof routes.getApiUrl>>
  let requestConfig: Partial<InternalAxiosRequestConfig>
  let preflightMiddleware: PreflightMiddleware

  let stubbedHttpAgent: SinonStubbedInstance<HttpAgent>
  let stubbedHttpsAgent: SinonStubbedInstance<HttpsAgent>

  beforeEach(() => {
    // the differences between Axios and AxiosInstance are negligible for the purposes of this test
    axiosInstance = sinon.createStubInstance(Axios) as SinonStubbedInstance<AxiosInstance>
    postPreflightStub = sinon.stub(preflightEndpoint, 'postPreflight')
    axiosCreateStub = sinon.stub(axios, 'create').returns(axiosInstance)
    getApiUrlStub = sinon.stub(routes, 'getApiUrl').returns(apiUrl)
    requestConfig = {
    }

    stubbedHttpAgent = sinon.createStubInstance(HttpAgent)
    stubbedHttpsAgent = sinon.createStubInstance(HttpsAgent)

    axiosInstance.defaults = {
      httpAgent: stubbedHttpAgent,
      httpsAgent: stubbedHttpsAgent,
    } as Omit<AxiosDefaults<any>, 'headers'> & { headers: HeadersDefaults & { [key: string]: AxiosHeaderValue } }

    preflightMiddleware = new PreflightMiddleware(axiosInstance)
  })

  afterEach(() => {
    postPreflightStub.restore()
    axiosCreateStub.restore()
    getApiUrlStub.restore()
  })

  describe('.requestInterceptor', () => {
    let asyncRetryStub: SinonStub<Parameters<typeof asyncRetryModule.asyncRetry>, ReturnType<typeof asyncRetryModule.asyncRetry>>

    beforeEach(() => {
      asyncRetryStub = sinon.stub(asyncRetryModule, 'asyncRetry')
      asyncRetryStub.callsFake((fn) => fn)
    })

    afterEach(() => {
      sinon.restore()
    })

    describe('when requirePreflight=true on the request config', () => {
      beforeEach(() => {
        requestConfig.requirePreflight = true
      })

      describe('and there is no saved preflight state', () => {
        beforeEach(() => {
          axiosInstance.defaults.preflightState = undefined
        })

        describe('and there are project attributes configured', () => {
          beforeEach(() => {
            preflightMiddleware.setProjectAttributes(projectAttributes)
          })

          describe('when api-proxy with no agents succeeds', () => {
            beforeEach(() => {
              postPreflightStub.withArgs(projectAttributes, { apiUrl: apiProxyUrl, attempt: 1 }).resolves(preflightResponse)
            })

            it('caches the preflight response on the axios instance', async () => {
              await preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig)
              expect(axiosInstance.defaults).not.to.be.undefined
              expect(axiosInstance.defaults.preflightState).not.to.be.undefined

              for (const [k, v] of Object.entries(preflightResponse)) {
                expect(axiosInstance.defaults.preflightState[k]).to.eq(v)
              }
            })
          })

          describe('when api-proxy with no agents fails', () => {
            let err: SinonStubbedInstance<AxiosError>

            beforeEach(() => {
              err = sinon.createStubInstance(AxiosError)
            })

            describe('with 412', () => {
              beforeEach(() => {
                err.status = 412
                postPreflightStub.rejects(err)
              })

              it('throws', async () => {
                await expect(
                  preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig),
                ).to.eventually.be.rejectedWith(err)
              })
            })

            describe('for any other reason', () => {
              beforeEach(() => {
                err.status = 404
                postPreflightStub.withArgs(projectAttributes, {
                  apiUrl: apiProxyUrl,
                  attempt: 1,
                }).rejects(err)
              })

              describe('retries the fallback preflight request', () => {
                it('uses asyncRetry with correct options', async () => {
                  await preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig)

                  const [, opts] = asyncRetryStub.firstCall.args

                  expect(opts.maxAttempts).to.equal(3)
                  expect(opts.retryDelay).to.be.a('function')
                  expect(opts.shouldRetry).to.be.a('function')
                })
              })

              describe('when api & agents request succeeds', () => {
                beforeEach(() => {
                  postPreflightStub.withArgs(projectAttributes, {
                    apiUrl,
                    httpAgent: stubbedHttpAgent,
                    httpsAgent: stubbedHttpsAgent,
                    attempt: 1,
                  }).resolves(preflightResponse)
                })

                it('sets the preflight state to the response', async () => {
                  const cfg = await preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig)

                  if (!cfg.preflightState) {
                    throw new Error('preflight state should be defined')
                  }

                  for (const [k, v] of Object.entries(preflightResponse)) {
                    expect(axiosInstance.defaults.preflightState[k]).to.eq(v)

                    expect(cfg.preflightState[k]).to.eq(v)
                  }
                })
              })

              describe('when api & agents request fails', () => {
                let err500: sinon.SinonStubbedInstance<AxiosError>

                beforeEach(() => {
                  err500 = sinon.createStubInstance(AxiosError)
                  err500.status = 500

                  postPreflightStub.rejects(err500)
                })

                it('throws', async () => {
                  await expect(
                    preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig),
                  ).to.eventually.be.rejectedWith(err500)
                })
              })
            })
          })

          describe('when api-proxy with no agents succeeds', () => {
            beforeEach(() => {
              postPreflightStub.withArgs(projectAttributes, {
                apiUrl: apiUrl.replace('api', 'api-proxy'),
                attempt: 1,
              }).resolves(preflightResponse)
            })

            it('sets the preflight state to the response', async () => {
              const cfg = await preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig)

              for (const [k, v] of Object.entries(preflightResponse)) {
                expect(axiosInstance.defaults.preflightState[k]).to.eq(v)
                if (!cfg.preflightState) {
                  throw new Error('preflight state should be defined')
                }

                expect(cfg.preflightState[k]).to.eq(v)
              }
            })
          })
        })
      })

      describe('and there is a saved preflight state on the internal axios request config', () => {
        beforeEach(() => {
          axiosInstance.defaults.preflightState = requestConfig.preflightState = preflightResponse
        })

        it('does not send any preflight requests', async () => {
          await preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig)
          expect(postPreflightStub).not.to.be.called
        })

        it('sets the apiUrl on the outgoing request', async () => {
          const cfg = await preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig)

          expect(cfg.baseURL).to.equal(preflightResponseApiUrl)
        })
      })
    })

    describe('when requirePreflight=false on the request config', () => {
      beforeEach(() => {
        requestConfig.requirePreflight = false
      })

      it('does not send any preflight requests', async () => {
        await preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig)
        expect(postPreflightStub).not.to.be.called
      })

      it('does not modify the request config', async () => {
        const cfg = await preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig)

        expect(cfg).to.deep.equal(requestConfig)
      })
    })

    describe('error handling', () => {
      beforeEach(() => {
        requestConfig.requirePreflight = true
        preflightMiddleware.setProjectAttributes(projectAttributes)
      })

      describe('when postPreflight throws a non-AxiosError', () => {
        beforeEach(() => {
          postPreflightStub.rejects(new Error('network error'))
        })

        it('propagates the error', async () => {
          await expect(
            preflightMiddleware.requestInterceptor(requestConfig as InternalAxiosRequestConfig),
          ).to.eventually.be.rejectedWith('network error')
        })
      })
    })
  })

  describe('.responseInterceptor', () => {
    let response: AxiosResponse

    const preflightWarning = { message: 'preflight warning' }
    const mainRequestWarning = { message: 'main request warning' }

    beforeEach(() => {
      response = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      }
    })

    describe('when there were warnings on the preflight response', () => {
      beforeEach(() => {
        response.config.preflightState = {
          ...preflightResponse,
          warnings: [preflightWarning],
        }
      })

      describe('when axios is configured to append warnings from the preflight response to the response', () => {
        beforeEach(() => {
          response.config.appendPreflightWarnings = true
        })

        describe('and there are warnings on the incoming response', () => {
          beforeEach(() => {
            response.data.warnings = [mainRequestWarning]
          })

          it('appends the warnings from the preflight response to the incoming response warnings', () => {
            const interceptedResponse = preflightMiddleware.responseInterceptor(response)

            expect(interceptedResponse.data.warnings).to.be.an('array')
            expect(interceptedResponse.data.warnings).to.have.length(2)
            expect(interceptedResponse.data.warnings).to.contain(preflightWarning)
            expect(interceptedResponse.data.warnings).to.contain(mainRequestWarning)
          })
        })

        describe('and the incoming response warnings are undefined', () => {
          beforeEach(() => {
            response.data.warnings = undefined
          })

          it('adds the preflight warnings to the incoming response', () => {
            const interceptedResponse = preflightMiddleware.responseInterceptor(response)

            expect(interceptedResponse.data.warnings).to.be.an('array')
            expect(interceptedResponse.data.warnings).to.have.length(1)
            expect(interceptedResponse.data.warnings).to.contain(preflightWarning)
          })
        })
      })

      describe('when the request is not configured to append warnings from the preflight response to the response', () => {
        beforeEach(() => {
          response.config.appendPreflightWarnings = false
        })

        it('does not add the preflight warnings to the incoming response', () => {
          const interceptedResponse = preflightMiddleware.responseInterceptor(response)

          expect(interceptedResponse.data.warnings).to.deep.equal(response.data.warnings)
        })
      })
    })
  })
})
