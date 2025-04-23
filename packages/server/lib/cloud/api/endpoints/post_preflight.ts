import axios from 'axios'
import { isArray, isBoolean, isString, isObject } from 'lodash'
import type { HttpAgent, HttpsAgent } from '@packages/network/lib/agent'

export interface PreflightWarning {
  message: string
}

export interface PreflightState {
  encrypt: boolean
  apiUrl: string
  warnings?: PreflightWarning[]
}

export interface PreflightRequestBody {
  projectId: string
  projectRoot: string
  ciBuildId: string
  browser: Record<string, any>
  testingType: 'e2e' | 'component'
  parallel: boolean
}

export interface PreflightOptions {
  apiUrl: string
  attempt?: number
  httpAgent?: HttpAgent
  httpsAgent?: HttpsAgent
  timeout?: number
}

function isValidPreflightState (state: unknown): state is PreflightState {
  if (!isObject(state)) return false

  const s = state as Record<string, unknown>

  return isBoolean(s.encrypt) &&
    isString(s.apiUrl) &&
    (!s.warnings || (isArray(s.warnings) && s.warnings.every((warning) => {
      return isObject(warning) && isString((warning as Record<string, unknown>).message)
    })))
}

export async function postPreflight (body: PreflightRequestBody, options: PreflightOptions): Promise<PreflightState> {
  const instance = axios.create({
    baseURL: options.apiUrl,
    httpAgent: options.httpAgent,
    httpsAgent: options.httpsAgent,
  })

  const response = await instance.post('/preflight', body, {
    headers: {
      'x-route-version': '1',
      'x-cypress-request-attempt': options.attempt?.toString() ?? '1',
    },
    timeout: options.timeout,
  })

  if (!isValidPreflightState(response.data)) {
    throw new TypeError('Invalid preflight state received from server')
  }

  return response.data
}
