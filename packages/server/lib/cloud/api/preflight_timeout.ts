const DEFAULT_PREFLIGHT_TIMEOUT = 5000

export function noProxyPreflightTimeout (): number {
  try {
    const timeoutFromEnv = Number(process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT)

    return (isNaN(timeoutFromEnv) || process.env.CYPRESS_INITIAL_PREFLIGHT_TIMEOUT === '') ? DEFAULT_PREFLIGHT_TIMEOUT : timeoutFromEnv
  } catch (e: unknown) {
    return DEFAULT_PREFLIGHT_TIMEOUT
  }
}
