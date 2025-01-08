import { dfd } from '../injectBundle'

async function initialize () {
  await dfd.promise
}

export const StudioRunnerAPI = {
  initialize,
}
