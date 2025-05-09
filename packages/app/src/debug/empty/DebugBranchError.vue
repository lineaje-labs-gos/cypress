<template>
  <DebugEmptyView
    :title="t('debugPage.emptyStates.noRunsFoundForBranch')"
    :description="t('debugPage.emptyStates.noRunsForBranchMessage')"
    :icon="IconWrapper"
    :utm="utm"
    help-link-href="https://on.cypress.io/git-info"
  />
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import { useI18n } from '@cy/i18n'
import { IconTechnologyCommandLineError } from '@cypress-design/vue-icon'
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { h } from 'vue'

const { t } = useI18n()

const utm = {
  utm_campaign: 'No Runs Found',
}

const IconWrapper: FunctionalComponent<SVGAttributes> = (props) => {
  return h(IconTechnologyCommandLineError, { ...props })
}
</script>
