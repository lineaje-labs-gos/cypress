import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

import type { TestState } from '@packages/types'
import WandIcon from '@packages/frontend-shared/src/assets/icons/object-magic-wand-dark-mode_x16.svg'
import { IconStatusFailedSimple, IconStatusPassedSimple, IconStatusQueuedOutline, IconStatusQueuedSimple, IconStatusRunningOutline, IconStatusRunningSimple, IconStatusSkippedOutline, IconStatusSkippedSimple } from '@cypress-design/react-icon'

interface Props extends React.HTMLProps<HTMLDivElement> {
  state: TestState
  isStudio?: boolean
  iconSize?: '8' | '12' | '16'
}

const StateIcon: React.FC<Props> = observer((props: Props) => {
  const { state, isStudio, ...rest } = props

  if (state === 'active') {
    return (
      props.iconSize === '8' ?
        <IconStatusRunningSimple size='8' fillColor='gray-700' strokeColor='indigo-400' /> :
        <IconStatusRunningOutline size={props.iconSize || '16'} fillColor='gray-700' strokeColor='indigo-400' />
    )
  }

  if (state === 'failed') {
    return (
      <IconStatusFailedSimple size={props.iconSize || '16'} strokeColor='red-400' />
    )
  }

  if (state === 'passed') {
    if (isStudio) {
      return (
        <WandIcon {...rest} className={cs('wand-icon', rest.className)} viewBox="0 0 16 16" width="12px" height="12px" />
      )
    }

    return (
      <IconStatusPassedSimple size={props.iconSize || '16'} strokeColor='jade-400' />
    )
  }

  // pending is really skipped
  if (state === 'pending') {
    return (
      props.iconSize === '8' ?
        <IconStatusSkippedSimple size='8' strokeColor='gray-700' /> :
        <IconStatusSkippedOutline size={props.iconSize || '16'} strokeColor='gray-700' />
    )
  }

  // processing is really queued
  if (state === 'processing') {
    return (
      props.iconSize === '8' ?
        <IconStatusQueuedSimple size='8' strokeColor='gray-700' /> :
        <IconStatusQueuedOutline
          size={props.iconSize || '16'}
          strokeColor="gray-700" />
    )
  }

  // TODO mabel i need to double check if it's this icon or the queued one
  return (
    props.iconSize === '8' ?
      <IconStatusQueuedSimple size='8' strokeColor='gray-700' /> :
      <IconStatusQueuedOutline
        size={props.iconSize || '16'}
        strokeColor="gray-700" />
  )
})

StateIcon.displayName = 'StateIcon'

export default StateIcon
