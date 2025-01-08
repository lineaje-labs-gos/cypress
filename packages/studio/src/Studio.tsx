import React from 'react'
import { useStudioContext } from './StudioContext'

const useCallback = (fn, deps) => {
  return window.UnifiedRunner.React.useCallback(fn, deps)
}

const saveErrorMessage = (message) => {
  return `\
${message}\n\n\
Cypress was unable to save these commands to your spec file. \
You can use the copy button below to copy the commands to your clipboard. \
\n
Cypress Studio is still in beta and the team is working hard to \
resolve issues like this. To help us fix this issue more quickly, \
you can provide us with more information by clicking 'Learn more' below.`
}

export const Studio = (props) => {
  const { viewportDimensions, useEventManager, getEventManager, cancel, getAutIframeDocument } = props
  const eventManager = getEventManager()
  const { studioStore } = useStudioContext()

  window.UnifiedRunner.React.useEffect(() => {
    const eventManager = useEventManager(props.testId)

    eventManager.runSpec()
    eventManager.initializeRunnerLifecycleEvents()
  }, [])

  const scale = 1
  const runnerStyle: React.CSSProperties = {
    width: `${viewportDimensions.width}px`,
    height: `${viewportDimensions.height}px`,
    transform: `scale(${scale})`,
    position: 'absolute',
  }

  const removeCommandCallback = useCallback((commandId) => {
    studioStore.removeLog(commandId)
  }, [studioStore])

  const reporterStudioSaveCallback = useCallback(() => {
    studioStore.startSave()
  }, [studioStore])

  const copyToClipboardCallback = useCallback((cb) => {
    eventManager.ws.emit('studio:get:commands:text', studioStore.logs, (commandsText) => {
      studioStore.copyToClipboard(commandsText)
      cb()
    })
  }, [studioStore])

  const localStudioSaveCallback = useCallback((saveInfo) => {
    eventManager.ws.emit('studio:save', saveInfo, (err) => {
      if (err) {
        eventManager.reporterBus.emit('test:set:state',
          {
            id: studioStore.testId,
            err: {
              ...err,
              message: saveErrorMessage(err.message),
              docsUrl: 'https://on.cypress.io/studio-beta',
            },
          }, () => {})
      }
    })
  }, [studioStore])

  const runEndCallback = useCallback(() => {
    if (studioStore.isLoading) {
      const document = getAutIframeDocument()
      const body = document.querySelector('body')

      studioStore.start(body)
    }
  }, [studioStore])

  const pageLoadingCallback = useCallback((isLoading) => {
    if (isLoading) {
      return
    }

    if (studioStore.isActive) {
      const document = getAutIframeDocument()
      const body = document.querySelector('body')

      if (!body) {
        throw Error(`Cannot reattach Studio without the HTMLBodyElement for the app`)
      }

      studioStore.continue(body)
    }
  }, [studioStore])

  const studioInitializeCallback = useCallback(({
    runState,
    config,
  }) => {
    studioStore.initialize(config, runState)
  }, [studioStore])

  window.UnifiedRunner.React.useEffect(() => {
    eventManager.studioStore = studioStore

    eventManager.reporterBus.on('studio:cancel', cancel)
    eventManager.reporterBus.on('studio:remove:command', removeCommandCallback)
    eventManager.reporterBus.on('studio:save', reporterStudioSaveCallback)
    eventManager.reporterBus.on('studio:copy:to:clipboard', copyToClipboardCallback)
    eventManager.localBus.on('studio:copy:to:clipboard', copyToClipboardCallback)
    eventManager.localBus.on('studio:save', localStudioSaveCallback)
    eventManager.ws.on('watched:file:changed', cancel)
    eventManager.localBus.on('studio:cancel', cancel)
    eventManager.on('run:end', runEndCallback)
    eventManager.on('page:loading', pageLoadingCallback)
    eventManager.on('studio:initialize', studioInitializeCallback)

    return () => {
      eventManager.reporterBus.off('studio:cancel', cancel)
      eventManager.reporterBus.off('studio:remove:command', removeCommandCallback)
      eventManager.reporterBus.off('studio:save', reporterStudioSaveCallback)
      eventManager.reporterBus.off('studio:copy:to:clipboard', copyToClipboardCallback)
      eventManager.localBus.off('studio:copy:to:clipboard', copyToClipboardCallback)
      eventManager.localBus.off('studio:save', localStudioSaveCallback)
      eventManager.ws.off('watched:file:changed', cancel)
      eventManager.localBus.off('studio:cancel', cancel)
      eventManager.off('run:end', runEndCallback)
      eventManager.off('page:loading', pageLoadingCallback)
      eventManager.off('studio:initialize', studioInitializeCallback)
    }
  }, [removeCommandCallback, reporterStudioSaveCallback, copyToClipboardCallback, localStudioSaveCallback, cancel, runEndCallback, pageLoadingCallback, studioInitializeCallback])

  return (
    <div style={{ position: 'fixed', height: '100vh' }}>
      <div style={{ width: 'calc(-64px + 100vw)', display: 'flex', height: '100%' }}>
        <div style={{ width: '510px', display: 'block', height: '100%' }}>
          <div id="unified-reporter" style={{ position: 'relative', height: '100%' }}></div>
        </div>
        <div style={{ display: 'block', backgroundColor: 'rgb(225 227 237 / 1)' }}>
          <div id="unified-runner" style={runnerStyle}></div>
        </div>
      </div>
    </div>
  )
}
