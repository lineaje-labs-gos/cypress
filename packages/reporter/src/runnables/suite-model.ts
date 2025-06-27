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
  private _cachedTestChildStates: TestState[] | null = null
  private _cachedChildrenCount = 0
  private _cachedTestIds: string[] | null = null

  constructor (props: SuiteProps, level: number) {
    super(props, level)

    makeObservable(this, {
      children: observable,
      state: computed,
      _testChildStates: computed,
      hasRetried: computed,
      _anyTestChildrenRunning: computed,
      _anyTestChildrenFailed: computed,
      _allTestChildrenPassedOrPending: computed,
      _allTestChildrenPending: computed,
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

  private _shouldRecalculate (): boolean {
    if (this._cachedTestChildStates === null) {
      return true
    }

    const testChildren = this.children.filter((child) => child.type === 'test')

    // Check if the number of test children changed
    if (testChildren.length !== this._cachedChildrenCount) {
      return true
    }

    // Check if the test IDs changed (indicating different tests)
    const currentTestIds = testChildren.map((child) => child.id)

    if (!this._cachedTestIds || !_.isEqual(currentTestIds, this._cachedTestIds)) {
      return true
    }

    return false
  }

  get _testChildStates () {
    /**
    * without this caching, we'll recalculate the state of the suite on every render
    * and it will cause recalculate style performance issues in the browser
    */
    if (this._shouldRecalculate()) {
      /**
     * since we're displaying a collapsible for each suite whether it's a nested suite or not,
     * we only want to consider the test children of the current suite and not the state of any suite children
     */
      const testChildren = this.children.filter((child) => child.type === 'test')

      this._cachedTestChildStates = _.map(testChildren, 'state')
      this._cachedChildrenCount = testChildren.length
      this._cachedTestIds = testChildren.map((child) => child.id)
    }

    return this._cachedTestChildStates
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
    const states = this._testChildStates || []

    return !states.length || _.every(states, (state) => {
      return state === 'passed' || state === 'pending'
    })
  }

  get _allTestChildrenPending () {
    const states = this._testChildStates || []

    return !!states.length
            && _.every(states, (state) => {
              return state === 'pending'
            })
  }
}
