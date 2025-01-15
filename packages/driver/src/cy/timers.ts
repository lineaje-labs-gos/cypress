import type { ICypress } from '../cypress'

export const create = (Cypress: ICypress) => ({
  reset () {
    return Cypress.action('app:timers:reset')
  },

  pauseTimers (shouldPause) {
    return Cypress.action('app:timers:pause', shouldPause)
  },
})

export interface ITimer {
  pauseTimers: ReturnType<typeof create>['pauseTimers']
}
