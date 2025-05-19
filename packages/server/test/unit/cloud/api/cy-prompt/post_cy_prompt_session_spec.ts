import { SystemError } from '../../../../../lib/cloud/network/system_error'
import { proxyquire } from '../../../../spec_helper'
import os from 'os'
import { agent } from '@packages/network'
import pkg from '@packages/root'

describe('postCyPromptSession', () => {
  let postCyPromptSession: typeof import('@packages/server/lib/cloud/api/cy-prompt/post_cy_prompt_session').postCyPromptSession
  let crossFetchStub: sinon.SinonStub = sinon.stub()

  beforeEach(() => {
    crossFetchStub.reset()
    postCyPromptSession = (proxyquire('@packages/server/lib/cloud/api/cy-prompt/post_cy_prompt_session', {
      'cross-fetch': crossFetchStub,
    }) as typeof import('@packages/server/lib/cloud/api/cy-prompt/post_cy_prompt_session')).postCyPromptSession
  })

  it('should post a cy-prompt session', async () => {
    crossFetchStub.resolves({
      ok: true,
      json: () => {
        return Promise.resolve({
          cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz',
        })
      },
    })

    const result = await postCyPromptSession({
      projectId: '12345',
    })

    expect(result).to.deep.equal({
      cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz',
    })

    expect(crossFetchStub).to.have.been.calledOnce
    expect(crossFetchStub).to.have.been.calledWith(
      'http://localhost:1234/cy-prompt/session',
      {
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'application/json',
          'x-os-name': os.platform(),
          'x-cypress-version': pkg.version,
        },
        body: JSON.stringify({ projectSlug: '12345', cyPromptMountVersion: 1 }),
      },
    )
  })

  it('should throw immediately if the response is not ok', async () => {
    crossFetchStub.resolves({
      ok: false,
      statusText: 'Some failure',
      json: () => {
        return Promise.resolve({
          error: 'Failed to create cy-prompt session',
        })
      },
    })

    await expect(postCyPromptSession({
      projectId: '12345',
    })).to.be.rejectedWith('Failed to create cy-prompt session: Some failure')

    expect(crossFetchStub).to.have.been.calledOnce
  })

  it('should throw an error if we receive a retryable error more than twice', async () => {
    crossFetchStub.rejects(new SystemError(new Error('Failed to create cy-prompt session'), 'http://localhost:1234/cy-prompt/session'))

    await expect(postCyPromptSession({
      projectId: '12345',
    })).to.be.rejected

    expect(crossFetchStub).to.have.been.calledThrice
  })
})
