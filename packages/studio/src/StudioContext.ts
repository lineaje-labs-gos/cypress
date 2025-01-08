import { useStudioStore } from './studioStore'

export const StudioContext = window.UnifiedRunner.React.createContext(null)

export const useStudioContext = () => {
  return window.UnifiedRunner.React.useContext(StudioContext) as {
    studioStore: ReturnType<typeof useStudioStore>
  }
}
