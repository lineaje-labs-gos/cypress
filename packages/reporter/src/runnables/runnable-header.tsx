import { observer } from 'mobx-react'
import React, { ReactElement } from 'react'

import type { StatsStore } from '../header/stats-store'
import { formatDuration, getFilenameParts } from '../lib/util'
import FileNameOpener from '../lib/file-name-opener'
import { RunnablesStore } from './runnables-store'
import { DebugDismiss } from '../header/DebugDismiss'

const renderRunnableHeader = (children: ReactElement) => <div className="runnable-header" data-cy="runnable-header">{children}</div>

interface RunnableHeaderProps {
  spec: Cypress.Cypress['spec']
  statsStore: StatsStore
  runnablesStore: RunnablesStore
}

const RunnableHeader: React.FC<RunnableHeaderProps> = observer(({ spec, statsStore, runnablesStore }) => {
  const relativeSpecPath = spec.relative

  if (spec.relative === '__all') {
    if (spec.specFilter) {
      return renderRunnableHeader(
        <span><span>Specs matching "{spec.specFilter}"</span></span>,
      )
    }

    return renderRunnableHeader(
      <span><span>All Specs</span></span>,
    )
  }

  const displayFileName = () => {
    const specParts = getFilenameParts(spec.name)

    return (
      <>
        <strong>{specParts[0]}</strong>{specParts[1]}
      </>
    )
  }

  const fileDetails = {
    absoluteFile: spec.absolute,
    column: 0,
    displayFile: displayFileName(),
    line: 0,
    originalFile: relativeSpecPath,
    relativeFile: relativeSpecPath,
  }

  return renderRunnableHeader(
    <>
      <FileNameOpener fileDetails={fileDetails} />
      {runnablesStore.testFilter && runnablesStore.totalTests > 0 && <DebugDismiss matched={runnablesStore.totalTests} total={runnablesStore.totalUnfilteredTests} />}
      {Boolean(statsStore.duration) && (
        <span className='duration' data-cy="spec-duration">{formatDuration(statsStore.duration)}</span>
      )}
    </>,
  )
})

RunnableHeader.displayName = 'RunnableHeader'

export default RunnableHeader
