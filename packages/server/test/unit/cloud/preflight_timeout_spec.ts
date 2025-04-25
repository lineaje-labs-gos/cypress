import { expect } from 'chai'
import { noProxyPreflightTimeout } from '../../../lib/cloud/api/preflight_timeout'

describe('noProxyPreflightTimeout', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = process.env
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns default timeout when no environment variable is set', () => {
    delete process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT
    expect(noProxyPreflightTimeout()).to.equal(5000) // Default is 5000ms
  })

  it('returns value from environment variable when set', () => {
    process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = '10000'
    expect(noProxyPreflightTimeout()).to.equal(10000)
  })

  it('returns default timeout when environment variable is not a number', () => {
    process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = 'not-a-number'
    expect(noProxyPreflightTimeout()).to.equal(5000)
  })

  it('returns default timeout when error occurs parsing environment variable', () => {
    // Mock Number to throw an error when called
    const originalNumber = global.Number

    // @ts-ignore - intentionally mocking to throw for test
    global.Number = function () {
      throw new Error('test error')
    }

    try {
      expect(noProxyPreflightTimeout()).to.equal(5000)
    } finally {
      // Restore original Number
      global.Number = originalNumber
    }
  })

  it('handles empty string in environment variable', () => {
    process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = ''
    expect(noProxyPreflightTimeout()).to.equal(5000)
  })

  it('handles negative values in environment variable', () => {
    process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = '-1000'
    expect(noProxyPreflightTimeout()).to.equal(-1000)
  })

  it('handles zero value in environment variable', () => {
    process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = '0'
    expect(noProxyPreflightTimeout()).to.equal(0)
  })

  it('handles very large timeout values', () => {
    process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT = '3600000' // 1 hour
    expect(noProxyPreflightTimeout()).to.equal(3600000)
  })
})
