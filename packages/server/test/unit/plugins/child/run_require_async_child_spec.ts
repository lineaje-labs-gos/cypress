/* eslint-disable @typescript-eslint/no-this-alias, @typescript-eslint/unbound-method, mocha/no-synchronous-tests */
import '../../../spec_helper'
import runRequireAsyncChild from '../../../../lib/plugins/child/run_require_async_child'

// Global declarations for test environment
declare const describe: any
declare const beforeEach: any
declare const afterEach: any
declare const it: any
declare const expect: any
declare const sinon: any
declare const mockery: any
declare const process: any

describe('lib/plugins/child/run_require_async_child', () => {
  beforeEach(function () {
    this.ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
      removeListener: sinon.spy(),
    }
  })

  afterEach(() => {
    mockery.deregisterMock('@cypress/webpack-batteries-included-preprocessor')
  })

  describe('errors', () => {
    beforeEach(function () {
      sinon.stub(process, 'on')

      this.err = {
        name: 'error name',
        message: 'error message',
      }

      return runRequireAsyncChild(this.ipc, 'cypress.config.js', 'proj-root')
    })

    it('sends the serialized error via ipc on process uncaughtException', function () {
      process.on.withArgs('uncaughtException').yield(this.err)

      expect(this.ipc.send).to.be.calledWith('childProcess:unhandledError', this.err)
    })

    it('sends the serialized error via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield(this.err)

      expect(this.ipc.send).to.be.calledWith('childProcess:unhandledError', this.err)
    })

    it('sends the serialized Bluebird error via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield({ reason: this.err })

      expect(this.ipc.send).to.be.calledWith('childProcess:unhandledError', this.err)
    })

    it('sends the serialized OpenSSL error via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield({ ...this.err, reason: 'reason' })

      expect(this.ipc.send).to.be.calledWith('childProcess:unhandledError', this.err)
    })
  })
})
