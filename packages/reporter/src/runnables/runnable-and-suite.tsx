import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { MouseEvent, useCallback } from 'react'

import appState, { AppState } from '../lib/app-state'
import events, { Events } from '../lib/events'
import Test from '../test/test'
import Collapsible, { CollapsibleHeaderComponentProps } from '../collapsible/collapsible'

import type SuiteModel from './suite-model'
import type TestModel from '../test/test-model'

import { IconActionAddMedium, IconChevronDownMedium, IconObjectStackFailed, IconObjectStackPassed, IconObjectStackQueued, IconObjectStackRunning, IconObjectStackSkipped } from '@cypress-design/react-icon'
import Button from '@cypress-design/react-button'

interface SuiteProps {
  eventManager?: Events
  model: SuiteModel
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

const Suite: React.FC<SuiteProps> = observer(({ eventManager = events, model, studioEnabled, canSaveStudioLogs }: SuiteProps) => {
  const _launchStudio = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    eventManager.emit('studio:init:suite', model.id)
  }, [eventManager, model.id])

  const getHeaderIcon = useCallback((isHovered: boolean, isFocused: boolean) => {
    if (isHovered || isFocused) {
      return <IconChevronDownMedium className='header-collapsible-indicator' strokeColor='gray-700' />
    }

    switch (model.state) {
      case 'active':
        return <IconObjectStackRunning fillColor='gray-900' strokeColor='gray-500' />
      case 'passed':
        return <IconObjectStackPassed fillColor='gray-900' strokeColor='gray-500' secondaryStrokeColor='jade-400' />
      case 'failed':
        return <IconObjectStackFailed fillColor='gray-900' strokeColor='gray-500' secondaryStrokeColor='red-400' />
      case 'pending':
        return <IconObjectStackSkipped fillColor='gray-900' strokeColor='gray-500' />
      case 'processing':
        return <IconObjectStackQueued fillColor='gray-900' strokeColor='gray-500' />
      default:
        return <></>
    }
  }, [model.state])

  const HeaderComponent = ({ isHovered, isFocused }: CollapsibleHeaderComponentProps) => {
    return (
      <div className='runnable-and-suite-header' tabIndex={-1}>
        {getHeaderIcon(isHovered, isFocused)}
        <span className='runnable-title'>{model.title}</span>
        {(studioEnabled && !appState.studioActive && (isHovered || isFocused)) && (
          <Button size='20' onClick={_launchStudio} variant='outline-dark' className='launch-studio-button'>
            <IconActionAddMedium strokeColor='gray-500' />
            New Test
          </Button>
        )}
      </div>
    )
  }

  let runnablesList = <ul className='runnables'>
    {_.map(model.children, (runnable) => {
      return (<Runnable
        key={runnable.id}
        model={runnable}
        studioEnabled={studioEnabled}
        canSaveStudioLogs={canSaveStudioLogs}
      />)
    })}
  </ul>

  return (
    // we don't want to show the collapsible if there are no tests in the suite
    model.children && !model.children.some((c) => c.type === 'test') ? runnablesList : (
      <Collapsible
        HeaderComponent={HeaderComponent}
        headerClass='runnable-wrapper'
        headerStyle={{}}
        hideExpander
        contentClass='runnables-region'
        isOpen
      >
        {runnablesList}
      </Collapsible>
    )
  )
})

Suite.displayName = 'Suite'

export interface RunnableProps {
  appState?: AppState
  model: TestModel | SuiteModel
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

// NOTE: some of the driver tests dig into the React instance for this component
// in order to mess with its internal state. converting it to a functional
// component breaks that, so it needs to stay a Class-based component or
// else the driver tests need to be refactored to support it being functional
const Runnable: React.FC<RunnableProps> = observer(({ appState: appStateProps = appState, model, studioEnabled, canSaveStudioLogs }) => {
  return (
    <li
      className={cs(`${model.type} runnable runnable-${model.state}`, {
        'runnable-retried': model.hasRetried,
        'runnable-studio': appStateProps.studioActive,
      })}
      data-model-state={model.state}
    >
      {model.type === 'test'
        ? <Test model={model as TestModel} studioEnabled={studioEnabled} canSaveStudioLogs={canSaveStudioLogs} />
        : <Suite model={model as SuiteModel}
          studioEnabled={studioEnabled}
          canSaveStudioLogs={canSaveStudioLogs}
        />}
    </li>
  )
})

Runnable.displayName = 'Runnable'

export { Suite }

export default Runnable
