<template>
  <DebugEmptyView
    :title="t('debugPage.emptyStates.gitRepositoryNotDetected')"
    :description="t('debugPage.emptyStates.ensureGitSetupCorrectly')"
    :icon="icon"
  />
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import { useI18n } from '@cy/i18n'
import { IconTechnologyCommandLineError } from '@cypress-design/vue-icon'
import type { FunctionalComponent, SVGAttributes } from 'vue'

const { t } = useI18n()

const icon = IconTechnologyCommandLineError as unknown as FunctionalComponent<SVGAttributes>
</script>
