import { asyncRetry, linearDelay } from '../../../util/async_retry'
import { isRetryableError } from '../../network/is_retryable_error'
import fetch from 'cross-fetch'
import os from 'os'
import { agent } from '@packages/network'

const pkg = require('@packages/root')
const routes = require('../../routes') as typeof import('../../routes')

interface PostCyPromptSessionOptions {
  projectId?: string
}

const _delay = linearDelay(500)

export const postCyPromptSession = async ({ projectId }: PostCyPromptSessionOptions) => {
  return await (asyncRetry(async () => {
    const response = await fetch(routes.apiRoutes.cyPromptSession(), {
      // @ts-expect-error - this is supported
      agent,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-os-name': os.platform(),
        'x-cypress-version': pkg.version,
      },
      body: JSON.stringify({ projectSlug: projectId, cyPromptMountVersion: 1 }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create cy-prompt session: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      cyPromptUrl: data.cyPromptUrl,
    }
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: isRetryableError,
  }))()
}
