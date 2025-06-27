import _ from 'lodash'
import { computed, observable, makeObservable } from 'mobx'
import Runnable, { RunnableProps } from './runnable-model'
import type TestModel from '../test/test-model'
import type { TestProps } from '../test/test-model'
import type { TestState } from '@packages/types'

export interface SuiteProps extends RunnableProps {
  suites: Array<SuiteProps>
  tests: Array<TestProps>
}

export default class Suite extends Runnable {
  children: Array<TestModel | Suite> = []
  type = 'suite'

  constructor (props: SuiteProps, level: number) {
    super(props, level)

    makeObservable(this, {
      children: observable,
      state: computed,
      _testChildStates: computed,
      hasRetried: computed,
      _anyTestChildrenFailed: computed,
      _allTestChildrenPassedOrPending: computed,
      _allTestChildrenPending: computed,
      _anyTestChildrenRunning: computed,
    })
  }

  get state (): TestState {
    if (this._anyTestChildrenRunning) {
      return 'active'
    }

    if (this._anyTestChildrenFailed) {
      return 'failed'
    }

    if (this._allTestChildrenPending) {
      return 'pending'
    }

    if (this._allTestChildrenPassedOrPending) {
      return 'passed'
    }

    return 'processing'
  }

  get _testChildStates () {
    /**
     * since we're displaying a collapsible for each suite whether it's a nested suite or not,
     * we only want to consider the test children of the current suite and not the state of any suite children
     */
    const testChildren = this.children.filter((child) => child.type === 'test')

    return _.map(testChildren, 'state')
  }

  get hasRetried (): boolean {
    return _.some(this.children, (v) => v.hasRetried)
  }

  get _anyTestChildrenRunning () {
    return _.some(this._testChildStates, (state) => {
      return state === 'active'
    })
  }

  get _anyTestChildrenFailed () {
    return _.some(this._testChildStates, (state) => {
      return state === 'failed'
    })
  }

  get _allTestChildrenPassedOrPending () {
    return !this._testChildStates.length || _.every(this._testChildStates, (state) => {
      return state === 'passed' || state === 'pending'
    })
  }

  get _allTestChildrenPending () {
    return !!this._testChildStates.length
            && _.every(this._testChildStates, (state) => {
              return state === 'pending'
            })
  }
}
