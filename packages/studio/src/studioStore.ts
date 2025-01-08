import { StudioListeners } from './StudioListeners'

const initialState = {
  saveModalIsOpen: false,
  instructionModalIsOpen: false,
  logs: [],
  url: '',
  isLoading: false,
  isActive: false,
  isFailed: false,
  _hasStarted: false,
}

const studioReducer = (eventManager, studioListeners: StudioListeners) => {
  return (state, action) => {
    switch (action.type) {
      case 'SET_TEST_ID':
        studioListeners.testId = action.payload

        return {
          ...state,
          testId: action.payload,
        }
      case 'SET_SUITE_ID':
        return {
          ...state,
          suiteId: action.payload,
        }
      case 'CLEAR_RUNNABLE_IDS':
        return {
          ...state,
          testId: null,
          suiteId: null,
        }
      case 'OPEN_INSTRUCTION_MODAL':
        return {
          ...state,
          instructionModalIsOpen: true,
        }
      case 'CLOSE_INSTRUCTION_MODAL':
        return {
          ...state,
          instructionModalIsOpen: false,
        }
      case 'RESET':
        studioListeners.reset()

        return {
          ...state,
          isActive: false,
          isLoading: false,
          logs: studioListeners.logs,
          url: undefined,
          _hasStarted: false,
          isFailed: false,
        }
      case 'CANCEL':
        studioListeners.reset()

        return {
          ...state,
          isActive: false,
          isLoading: false,
          logs: studioListeners.logs,
          url: undefined,
          _hasStarted: false,
          isFailed: false,
          testId: null,
          suiteId: null,
        }
      case 'REMOVE_LOG': {
        studioListeners.removeLog(action.payload)

        return {
          ...state,
          logs: studioListeners.logs,
        }
      }
      case 'START_SAVE': {
        if (state.suiteId) {
          return {
            ...state,
            saveModalIsOpen: true,
          }
        }

        eventManager.emit('studio:save', {
          fileDetails: state.fileDetails,
          absoluteFile: state.absoluteFile,
          runnableTitle: state.runnableTitle,
          commands: state.logs,
          isSuite: !!state.suiteId,
          isRoot: state.suiteId === 'r1',
          testName: action.payload,
        })

        return {
          ...state,
          saveModalIsOpen: false,
          isActive: false,
          isLoading: false,
        }
      }
      case 'COPY_TO_CLIPBOARD': {
      // clipboard API is not supported without secure context
        if (window.isSecureContext && navigator.clipboard) {
          return navigator.clipboard.writeText(action.payload)
        }

        // fallback to creating invisible textarea
        // create the textarea in our document rather than this._body
        // as to not interfere with the app in the aut
        const textArea = document.createElement('textarea')

        textArea.value = action.payload
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'

        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        textArea.remove()

        return state
      }
      case 'SAVE_ERROR':
        return {
          ...state,
          isFailed: true,
          isLoading: false,
        }
      case 'START':
        studioListeners.reset()
        studioListeners.attachListeners(action.payload)

        return {
          ...state,
          isActive: true,
          isLoading: false,
          _hasStarted: true,
          logs: studioListeners.logs,
        }

      case 'CONTINUE':
        studioListeners.attachListeners(action.payload)

        return state
      case 'INITIALIZE': {
        const { studio } = action.payload.runState

        if (studio) {
          if (studio.testId) {
            studioListeners.testId = studio.testId
          }

          // if (studio.suiteId) {
          //   this.setSuiteId(studio.suiteId)
          // }

          // if (studio.url) {
          //   this.setUrl(studio.url)
          // }
        }

        const testId = state.testId || studioListeners.testId
        let absoluteFile = state.absoluteFile
        let isLoading = state.isLoading

        if (testId) { // || this.suiteId) {
          absoluteFile = action.payload.config.spec.absolute
          isLoading = true

          // if (this.suiteId) {
          //   getCypress().runner.setOnlySuiteId(this.suiteId)
          // } else if (this.testId) {
          if (testId) {
            eventManager.getCypress().runner.setOnlyTestId(testId)
          }
        }

        return {
          ...state,
          testId,
          absoluteFile,
          isLoading,
        }
      }
      case 'SET_INACTIVE':
        return {
          ...state,
          isActive: false,
        }
      case 'INTERCEPT_TEST': {
        const test = action.payload
        let testId = state.testId

        if (state.suiteId) {
          testId = test.id
        }

        let fileDetails = state.fileDetails
        let runnableTitle = state.runnableTitle

        if (testId) { // || this.suiteId) {
          if (test.invocationDetails) {
            fileDetails = test.invocationDetails
          }

          if (state.suiteId) {
            if (test.parent && test.parent.id !== 'r1') {
              runnableTitle = test.parent.title
            }
          } else {
            runnableTitle = test.title
          }
        }

        return {
          ...state,
          testId,
          fileDetails,
          runnableTitle,
        }
      }
      default:
        throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

export type StudioState = {
  testId: string | null
  suiteId: string | null
  instructionModalIsOpen: boolean
  saveModalIsOpen: boolean
  logs: Array<{ id: number, name: string, message: string }>
  url: string | undefined
  isLoading: boolean
  isActive: boolean
  isFailed: boolean
  _hasStarted: boolean
  setTestId: (testId: string) => void
  setSuiteId: (suiteId: string) => void
  clearRunnableIds: () => void
  openInstructionModal: () => void
  closeInstructionModal: () => void
  stop: () => void
  reset: () => void
  cancel: () => void
  removeLog: (id: number) => void
  startSave: (testName?: string) => void
  copyToClipboard: (commandsText) => void
  saveError: (err: Error) => void
  start: (body) => void
  continue: (body) => void
  initialize: (config, runState) => void
  setInactive: () => void
  interceptTest: (test) => void
}

export const useStudioStore: (eventManager, testId) => StudioState = (eventManager, testId) => {
  const actions = {
    setTestId: (testId) => dispatch({ type: 'SET_TEST_ID', payload: testId }),
    setSuiteId: (suiteId) => dispatch({ type: 'SET_SUITE_ID', payload: suiteId }),
    clearRunnableIds: () => dispatch({ type: 'CLEAR_RUNNABLE_IDS' }),
    openInstructionModal: () => dispatch({ type: 'OPEN_INSTRUCTION_MODAL' }),
    closeInstructionModal: () => dispatch({ type: 'CLOSE_INSTRUCTION_MODAL' }),
    reset: () => dispatch({ type: 'RESET' }),
    cancel: () => dispatch({ type: 'CANCEL' }),
    removeLog: (id) => dispatch({ type: 'REMOVE_LOG', payload: id }),
    startSave: (testName?: string) => dispatch({ type: 'START_SAVE', payload: testName }),
    copyToClipboard: (commandsText) => dispatch({ type: 'COPY_TO_CLIPBOARD', payload: commandsText }),
    saveError: (err) => dispatch({ type: 'SAVE_ERROR', payload: err }),
    start: (body) => dispatch({ type: 'START', payload: body }),
    continue: (body) => dispatch({ type: 'CONTINUE', payload: body }),
    initialize: (config, runState) => dispatch({ type: 'INITIALIZE', payload: { config, runState } }),
    setInactive: () => dispatch({ type: 'SET_INACTIVE' }),
    interceptTest: (test) => dispatch({ type: 'INTERCEPT_TEST', payload: test }),
  }
  const [state, dispatch] = window.UnifiedRunner.React.useReducer(studioReducer(eventManager, new StudioListeners(eventManager, testId)), {
    ...initialState,
    testId,
    logs: [],
  })

  return {
    ...state,
    ...actions,
  }
}
