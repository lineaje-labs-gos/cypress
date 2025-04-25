import { InternalAxiosRequestConfig, AxiosInstance, AxiosResponse, isAxiosError } from 'axios'
import { getApiUrl } from '../../routes'
import { postPreflight, PreflightRequestBody, PreflightOptions } from '../endpoints/post_preflight'
import { isArray, isObject } from 'lodash'
import { asyncRetry, exponentialBackoff } from '../../../util/async_retry'
import { noProxyPreflightTimeout } from '../preflight_timeout'
import Debug from 'debug'

const debug = Debug('cypress:server:cloud:api:axios_middleware:preflight')

interface PreflightWarning {
  message: string
}

interface PreflightState {
  encrypt: boolean
  apiUrl: string
  warnings?: PreflightWarning[]
}

declare module 'axios' {
  interface AxiosRequestConfig {
    requirePreflight?: boolean
    preflightState?: PreflightState
    appendPreflightWarnings?: boolean
  }
}

export class PreflightMiddleware {
  private projectAttributes: PreflightRequestBody | undefined
  constructor (private axios: AxiosInstance) {

  }

  setProjectAttributes (attributes: PreflightRequestBody) {
    this.projectAttributes = attributes
  }

  async requestInterceptor (cfg: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    if (!cfg.requirePreflight) {
      return cfg
    }

    if (cfg.requirePreflight && cfg.preflightState) {
      cfg.baseURL = cfg.preflightState.apiUrl

      return cfg
    }

    if (!this.projectAttributes) {
      debug('Preflight middleware skipping request because no project attributes are set')

      return cfg
    }

    const projectAttributes: PreflightRequestBody = this.projectAttributes

    try {
      const options: PreflightOptions = {
        apiUrl: getApiUrl().replace('api', 'api-proxy'),
        attempt: 1,
        timeout: noProxyPreflightTimeout(),
      }

      const preflightState = await postPreflight(projectAttributes, options)

      cfg.preflightState = preflightState
      this.axios.defaults.preflightState = preflightState
    } catch (e) {
      if (isAxiosError(e) && e.status === 412) {
        throw e
      }

      let attempt = 0
      const retryPreflight = asyncRetry(
        async () => {
          attempt++

          return postPreflight(projectAttributes, {
            apiUrl: getApiUrl(),
            httpAgent: this.axios.defaults.httpAgent,
            httpsAgent: this.axios.defaults.httpsAgent,
            attempt,
          })
        },
        {
          maxAttempts: 3, // Will make 3 total attempts (initial + 2 retries)
          retryDelay: exponentialBackoff({ factor: 1000, fuzz: 0.1 }), // Start with 1 second, double each time
          shouldRetry: (err) => {
            if (isAxiosError(err) && err.status === 412) {
              return false // Don't retry on 412 errors
            }

            return true
          },
        },
      )

      const preflightState = await retryPreflight()

      cfg.preflightState = preflightState
      this.axios.defaults.preflightState = preflightState
    }

    return cfg
  }

  responseInterceptor (res: AxiosResponse): AxiosResponse {
    if (res.config.appendPreflightWarnings && res.config.preflightState?.warnings) {
      if (isArray(res.data.warnings)) {
        res.data.warnings = (res.data.warnings as PreflightWarning[]).concat(res.config.preflightState?.warnings)
      } else if (isObject(res.data.warnings)) {
        res.data.warnings = [res.data.warnings as PreflightWarning, ...(res.config.preflightState.warnings as PreflightWarning[])]
      } else {
        res.data.warnings = res.config.preflightState?.warnings
      }
    }

    return res
  }
}
