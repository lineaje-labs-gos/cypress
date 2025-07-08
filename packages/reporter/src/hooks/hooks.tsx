import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { useMemo } from 'react'
import appState, { AppState } from '../lib/app-state'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import type HookModel from './hook-model'
import type { HookName } from './hook-model'
import ArrowRightIcon from '@packages/frontend-shared/src/assets/icons/arrow-right_x16.svg'
import { OpenFileInIDEButton } from '../OpenFileInIDEButton'

export interface HookHeaderProps {
  model: HookModel
  number?: number
}

const HookHeader = ({ model, number }: HookHeaderProps) => (
  <span className='hook-name' data-cy={`hook-name-${model.hookName}`}>
    {model.hookName} {number && `(${number})`}
    {model.failed && <span className='hook-failed-message'> (failed)</span>}
  </span>
)

const StudioNoCommands = () => (
  <li className='command command-name-get command-state-pending command-type-parent studio-prompt'>
    <span>
      <div className='command-wrapper'>
        <div className='command-wrapper-text'>
          <span className='command-message'>
            <span className='command-message-text'>
              Interact with your site to add test commands. Right click to add assertions.
            </span>
          </span>
          <span className='command-controls'>
            <ArrowRightIcon />
          </span>
        </div>
      </div>
    </span>
  </li>
)

export interface HookProps {
  model: HookModel
  showNumber: boolean
  scrollIntoView: Function
}

const Hook: React.FC<HookProps> = observer(({ model, showNumber, scrollIntoView }: HookProps) => {
  // Memoize the mapped commands to prevent unnecessary re-renders
  const commandsElements = useMemo(() => {
    return model.commands.map((command) => (
      <Command key={command.id} model={command} aliasesWithDuplicates={model.aliasesWithDuplicates} scrollIntoView={scrollIntoView} />
    ))
  }, [model.commands, model.aliasesWithDuplicates, scrollIntoView])

  return (
    <li className={cs('hook-item', { 'hook-failed': model.failed, 'hook-studio': model.isStudio })}>
      <Collapsible
        header={
          <>
            <HookHeader model={model} number={showNumber ? model.hookNumber : undefined} />
            {model.invocationDetails && Cypress.testingType !== 'component' && <OpenFileInIDEButton fileDetails={model.invocationDetails} className='hook-open-in-ide' />}
          </>
        }
        headerClass='hook-header'
        isOpen
      >
        <ul className='commands-container'>
          {commandsElements}
          {model.showStudioPrompt && <StudioNoCommands />}
        </ul>
      </Collapsible>
    </li>
  )
})

Hook.displayName = 'Hook'

export interface HooksModel {
  hooks: HookModel[]
  hookCount: { [name in HookName]: number }
  state: string
}

export interface HooksProps {
  state?: AppState
  model: HooksModel
  scrollIntoView: Function
}

const Hooks: React.FC<HooksProps> = observer(({ state = appState, model, scrollIntoView }: HooksProps) => {
  // Memoize the mapped hooks to prevent unnecessary re-renders
  const hooksElements = useMemo(() => {
    return model.hooks.map((hook) => {
      if (hook.commands.length || (hook.isStudio && state.studioActive && model.state === 'passed')) {
        return <Hook key={hook.hookId} model={hook} scrollIntoView={scrollIntoView} showNumber={model.hookCount[hook.hookName] > 1} />
      }

      return null
    })
  }, [model.hooks, model.hookCount, model.state, state.studioActive, scrollIntoView])

  return (
    <ul className='hooks-container'>
      {hooksElements}
    </ul>
  )
})

Hooks.displayName = 'Hooks'

export { Hook, HookHeader }

export default Hooks
