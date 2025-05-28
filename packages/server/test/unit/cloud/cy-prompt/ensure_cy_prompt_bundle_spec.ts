import path from 'path'
import os from 'os'
import { proxyquire, sinon } from '../../../spec_helper'

describe('ensureCyPromptBundle', () => {
  let ensureCyPromptBundle: typeof import('../../../../lib/cloud/cy-prompt/ensure_cy_prompt_bundle').ensureCyPromptBundle
  let tmpdir: string = '/tmp'
  let rmStub: sinon.SinonStub = sinon.stub()
  let ensureStub: sinon.SinonStub = sinon.stub()
  let copyStub: sinon.SinonStub = sinon.stub()
  let readFileStub: sinon.SinonStub = sinon.stub()
  let extractStub: sinon.SinonStub = sinon.stub()
  let getCyPromptBundleStub: sinon.SinonStub = sinon.stub()

  beforeEach(() => {
    rmStub = sinon.stub()
    ensureStub = sinon.stub()
    copyStub = sinon.stub()
    readFileStub = sinon.stub()
    extractStub = sinon.stub()
    getCyPromptBundleStub = sinon.stub()

    ensureCyPromptBundle = (proxyquire('../lib/cloud/cy-prompt/ensure_cy_prompt_bundle', {
      os: {
        tmpdir: () => tmpdir,
        platform: () => 'linux',
      },
      'fs-extra': {
        remove: rmStub.resolves(),
        ensureDir: ensureStub.resolves(),
        copy: copyStub.resolves(),
        readFile: readFileStub.resolves('console.log("cy-prompt script")'),
      },
      tar: {
        extract: extractStub.resolves(),
      },
      '../api/cy-prompt/get_cy_prompt_bundle': {
        getCyPromptBundle: getCyPromptBundleStub.resolves(),
      },
    })).ensureCyPromptBundle
  })

  describe('CYPRESS_LOCAL_CY_PROMPT_PATH not set', () => {
    beforeEach(() => {
      delete process.env.CYPRESS_LOCAL_CY_PROMPT_PATH
    })

    it('should ensure the cy prompt bundle', async () => {
      const cyPromptPath = path.join(os.tmpdir(), 'cypress', 'cy-prompt', '123')
      const bundlePath = path.join(cyPromptPath, 'bundle.tar')

      await ensureCyPromptBundle({
        cyPromptPath,
        cyPromptUrl: 'https://cypress.io/cy-prompt',
        projectId: '123',
        bundlePath,
      })

      expect(rmStub).to.be.calledWith(cyPromptPath)
      expect(ensureStub).to.be.calledWith(cyPromptPath)
      expect(getCyPromptBundleStub).to.be.calledWith({
        cyPromptUrl: 'https://cypress.io/cy-prompt',
        projectId: '123',
        bundlePath,
      })

      expect(extractStub).to.be.calledWith({
        file: bundlePath,
        cwd: cyPromptPath,
      })
    })
  })

  describe('CYPRESS_LOCAL_CY_PROMPT_PATH set', () => {
    beforeEach(() => {
      process.env.CYPRESS_LOCAL_CY_PROMPT_PATH = '/path/to/cy-prompt'
    })

    afterEach(() => {
      delete process.env.CYPRESS_LOCAL_CY_PROMPT_PATH
    })

    it('should ensure the cy prompt bundle', async () => {
      const cyPromptPath = path.join(os.tmpdir(), 'cypress', 'cy-prompt', '123')
      const bundlePath = path.join(cyPromptPath, 'bundle.tar')

      await ensureCyPromptBundle({
        cyPromptPath,
        cyPromptUrl: 'https://cypress.io/cy-prompt',
        projectId: '123',
        bundlePath,
      })

      expect(rmStub).to.be.calledWith(cyPromptPath)
      expect(ensureStub).to.be.calledWith(cyPromptPath)
      expect(copyStub).to.be.calledWith('/path/to/cy-prompt/driver', path.join(cyPromptPath, 'driver'))
      expect(copyStub).to.be.calledWith('/path/to/cy-prompt/server', path.join(cyPromptPath, 'server'))
    })
  })
})
