import React from 'react'
import { StudioContext } from './StudioContext'
import { Studio } from './Studio'
import { useStudioStore } from './studioStore'

interface StudioContainerProps {
  useEventManager: (testId: string | undefined) => any
  getEventManager: () => any
  testId: string | undefined
  specRunnerHeaderHeight: number
  viewportDimensions: {
    width: number
    height: number
  }
}

export const StudioContainer: React.FC<StudioContainerProps> = (props) => {
  const studioStore = useStudioStore(props.getEventManager(), props.testId)

  return (
    <StudioContext.Provider value={{ studioStore }}>
      <Studio {...props} />
    </StudioContext.Provider>
  ) as React.ReactElement
}
