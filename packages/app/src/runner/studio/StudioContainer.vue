<template>
  <div
    id="studio-runner-container"
    ref="container"
  />
</template>

<script lang="ts" setup>
import { ref, watchPostEffect } from 'vue'
import { useUnifiedRunner } from '../../runner/unifiedRunner'
import { useAutStore } from '../../store'
import { useEventManager } from '../useEventManager'
import { useRouter } from 'vue-router'
import { getEventManager, getAutIframeModel } from '..'

const container = ref(null)
const { initialized } = useUnifiedRunner()
const autStore = useAutStore()
const router = useRouter()

watchPostEffect(() => {
  if (initialized.value && container.value) {
    const testId = router.currentRoute.value.query.testId as string | undefined

    window.Studio.mountStudio(container.value, {
      viewportDimensions: autStore.viewportDimensions,
      specRunnerHeaderHeight: autStore.specRunnerHeaderHeight,
      useEventManager,
      getEventManager,
      testId,
      cancel: () => {
        const fileFromCurrentUrl = router.currentRoute.value.query.file as string | undefined

        router.push({ path: '/specs/runner', query: { file: fileFromCurrentUrl } })
      },
      getAutIframeDocument: () => {
        return getAutIframeModel().$iframe?.prop('contentDocument')
      },
    })
  }
})
</script>
