import { expect } from 'chai'
const { sinon, nock } = require('../../../../spec_helper')
import axios from 'axios'
import { postPreflight } from '../../../../../lib/cloud/api/endpoints/post_preflight'
import { HttpAgent, HttpsAgent } from '@packages/network/lib/agent'

describe('postPreflight', () => {
  let axiosCreateStub: sinon.SinonStub
  let postStub: sinon.SinonStub
  let httpAgent: sinon.SinonStubbedInstance<HttpAgent>
  let httpsAgent: sinon.SinonStubbedInstance<HttpsAgent>

  const apiUrl = 'https://api.cypress.test'
  const body = {
    projectId: '123',
    projectRoot: '/some/path',
    ciBuildId: 'abc',
    browser: {},
    testingType: 'e2e' as const,
    parallel: true,
  }

  beforeEach(() => {
    httpAgent = sinon.createStubInstance(HttpAgent)
    httpsAgent = sinon.createStubInstance(HttpsAgent)

    const axiosInstance = {
      post: sinon.stub(),
    }

    postStub = axiosInstance.post
    axiosCreateStub = sinon.stub(axios, 'create').returns(axiosInstance)
  })

  afterEach(() => {
    axiosCreateStub.restore()
  })

  it('creates axios instance with correct configuration', async () => {
    const validResponse = {
      encrypt: true,
      apiUrl: 'https://api.cypress.test',
      warnings: [],
    }

    postStub.resolves({ data: validResponse })

    await postPreflight(body, {
      apiUrl,
      attempt: 1,
      httpAgent,
      httpsAgent,
    })

    expect(axiosCreateStub).to.have.been.calledWith({
      baseURL: apiUrl,
      httpAgent,
      httpsAgent,
    })
  })

  it('makes POST request with correct headers', async () => {
    const validResponse = {
      encrypt: true,
      apiUrl: 'https://api.cypress.test',
      warnings: [],
    }

    postStub.resolves({ data: validResponse })

    await postPreflight(body, {
      apiUrl,
      attempt: 2,
      httpAgent,
      httpsAgent,
    })

    expect(postStub).to.have.been.calledWith('/preflight', body, {
      headers: {
        'x-route-version': '1',
        'x-cypress-request-attempt': '2',
      },
      timeout: undefined,
    })
  })

  it('uses default attempt number when not provided', async () => {
    const validResponse = {
      encrypt: true,
      apiUrl: 'https://api.cypress.test',
      warnings: [],
    }

    postStub.resolves({ data: validResponse })

    await postPreflight(body, {
      apiUrl,
      httpAgent,
      httpsAgent,
    })

    expect(postStub).to.have.been.calledWith('/preflight', body, {
      headers: {
        'x-route-version': '1',
        'x-cypress-request-attempt': '1',
      },
      timeout: undefined,
    })
  })

  it('returns valid preflight state', async () => {
    const validResponse = {
      encrypt: true,
      apiUrl: 'https://api.cypress.test',
      warnings: [],
    }

    postStub.resolves({ data: validResponse })

    const result = await postPreflight(body, {
      apiUrl,
      attempt: 1,
      timeout: undefined,
    })

    expect(result).to.deep.equal(validResponse)
  })

  it('throws TypeError for invalid preflight state', async () => {
    const invalidResponse = {
      encrypt: true,
      // missing apiUrl
    }

    postStub.resolves({ data: invalidResponse })

    await expect(postPreflight(body, {
      apiUrl,
      attempt: 1,
    })).to.be.rejectedWith(TypeError, 'Invalid preflight state received from server')
  })

  it('throws TypeError for invalid warnings', async () => {
    const invalidResponse = {
      encrypt: true,
      apiUrl: 'https://api.cypress.test',
      warnings: 'not an array', // invalid warnings type
    }

    postStub.resolves({ data: invalidResponse })

    await expect(postPreflight(body, {
      apiUrl,
      attempt: 1,
    })).to.be.rejectedWith(TypeError, 'Invalid preflight state received from server')
  })

  it('propagates axios errors', async () => {
    const error = new Error('network error')

    postStub.rejects(error)

    await expect(postPreflight(body, {
      apiUrl,
      attempt: 1,
    })).to.be.rejectedWith(error)
  })
})

describe('postPreflight integration', () => {
  const apiUrl = 'https://api.cypress.test'
  const body = {
    projectId: '123',
    projectRoot: '/some/path',
    ciBuildId: 'abc',
    browser: {},
    testingType: 'e2e' as const,
    parallel: true,
  }

  beforeEach(() => {
    nock.cleanAll()
  })

  it('makes actual HTTP request with correct headers', async () => {
    const validResponse = {
      encrypt: true,
      apiUrl: 'https://api.cypress.test',
      warnings: [],
    }

    const scope = nock(apiUrl)
    .post('/preflight', body)
    .matchHeader('x-route-version', '1')
    .matchHeader('x-cypress-request-attempt', '2')
    .reply(200, validResponse)

    const result = await postPreflight(body, {
      apiUrl,
      attempt: 2,
    })

    expect(result).to.deep.equal(validResponse)
    expect(scope.isDone()).to.be.true
  })

  it('handles server errors', async () => {
    const scope = nock(apiUrl)
    .post('/preflight', body)
    .reply(500, { error: 'Internal Server Error' })

    await expect(postPreflight(body, {
      apiUrl,
      attempt: 1,
    })).to.be.rejectedWith('Request failed with status code 500')

    expect(scope.isDone()).to.be.true
  })

  it('handles network errors', async () => {
    const scope = nock(apiUrl)
    .post('/preflight', body)
    .replyWithError('ECONNREFUSED')

    await expect(postPreflight(body, {
      apiUrl,
      attempt: 1,
    })).to.be.rejectedWith('ECONNREFUSED')

    expect(scope.isDone()).to.be.true
  })

  it('handles timeout errors', async () => {
    const scope = nock(apiUrl)
    .post('/preflight', body)
    .delayConnection(1000) // Simulate timeout
    .reply(200, {
      encrypt: true,
      apiUrl: 'https://api.cypress.test',
      warnings: [],
    })

    await expect(postPreflight(body, {
      apiUrl,
      attempt: 1,
      timeout: 1000,
    })).to.be.rejectedWith('timeout')

    expect(scope.isDone()).to.be.true
  })
})
