import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { addCrossOriginIframe, getAutIframeModel, getEventManager, UnifiedRunnerAPI } from '.'
import { useAutStore, useSpecStore } from '../store'
import { useStudioStore } from '../store/studio-store'
import { empty, getReporterElement, getRunnerElement } from './utils'
import { unmountReporter } from './reporter'

const debug = (...args: any[]) => {
  window.Cypress && Cypress.backend('log', 'cypress:runner:useEventManager:', ...args)
}

export function useEventManager () {
  debug('Initializing event manager')
  const eventManager = getEventManager()

  const autStore = useAutStore()
  const specStore = useSpecStore()
  const studioStore = useStudioStore()
  const router = useRouter()

  async function runSpec (isRerun: boolean = false) {
    debug('Running spec:', { isRerun, activeSpec: specStore.activeSpec })
    if (!specStore.activeSpec) {
      debug('Cannot run spec - no active spec found')
      throw Error(`Cannot run spec when specStore.active spec is null or undefined!`)
    }

    autStore.setScriptError(null)
    await UnifiedRunnerAPI.executeSpec(specStore.activeSpec, isRerun)
  }

  function initializeRunnerLifecycleEvents () {
    debug('Initializing runner lifecycle events')
    // these events do not use GraphQL
    eventManager.on('restart', async () => {
      debug('Received restart event')
      // If we get the event to restart but have already navigated away from the runner, don't execute the spec
      if (specStore.activeSpec) {
        const isRerun = true

        debug('Restarting spec:', specStore.activeSpec)
        await runSpec(isRerun)
      } else {
        debug('No active spec to restart')
      }
    })

    eventManager.on('script:error', (err) => {
      debug('Received script error:', err)
      autStore.setScriptError(err)
    })

    eventManager.on('visit:failed', (payload) => {
      debug('Visit failed:', payload)
      getAutIframeModel().showVisitFailure(payload)
    })

    eventManager.on('page:loading', (isLoading) => {
      debug('Page loading state changed:', isLoading)
      if (isLoading) {
        return
      }

      debug('Reattaching studio after page load')
      getAutIframeModel().reattachStudio()
    })

    eventManager.on('visit:blank', async ({ testIsolation }) => {
      debug('Visiting blank page:', { testIsolation })
      await getAutIframeModel().visitBlankPage(testIsolation)
    })

    eventManager.on('run:end', () => {
      debug('Run ended, checking studio state:', { isLoading: studioStore.isLoading })
      if (studioStore.isLoading) {
        debug('Starting studio after run end')
        getAutIframeModel().startStudio()
      }
    })

    eventManager.on('expect:origin', (origin) => {
      debug('Adding cross origin iframe for:', origin)
      addCrossOriginIframe(origin)
    })

    eventManager.on('testFilter:cloudDebug:dismiss', async () => {
      debug('Dismissing cloud debug test filter')
      const currentRoute = router.currentRoute.value

      const { mode, ...query } = currentRoute.query

      // Delete runId from query which will remove the test filter and trigger a rerun
      await router.replace({ ...currentRoute, query })
    })
  }

  const startSpecWatcher = () => {
    debug('Starting spec watcher')

    return watch(() => specStore.activeSpec, async () => {
      debug('Active spec changed:', specStore.activeSpec)
      if (specStore.activeSpec) {
        await runSpec()
      }
    }, { immediate: true, flush: 'post' })
  }

  function cleanupRunner () {
    debug('Cleaning up runner')
    // Clean up the AUT and Reporter every time we leave the route.
    empty(getRunnerElement())

    // TODO: UNIFY-1318 - this should be handled by whoever starts it, reporter?
    debug('Stopping unified runner shortcuts')
    window.UnifiedRunner.shortcuts.stop()
    const reporterElement = getReporterElement()

    if (reporterElement) {
      debug('Unmounting reporter')
      // reporter can be disabled by the user,
      // so sometimes will not exist to be cleaned up
      // NOTE: we do not use empty() on the reporter as it is written in react.
      // As of React 18, its better to call unmount on the root, which effectively does the same thing as empty().
      unmountReporter()
    } else {
      debug('No reporter element to unmount')
    }
  }

  return {
    initializeRunnerLifecycleEvents,
    runSpec,
    startSpecWatcher,
    cleanupRunner,
  }
}
