<template>
  <Dialog
    :open="modelValue"
    class="inset-0 z-10 fixed overflow-y-auto"
    variant="bare"
    :initial-focus="container"
    @close="closeModal()"
  >
    <div class="flex min-h-screen items-center justify-center">
      >
      <slot
        name="overlay"
        :classes="'fixed inset-0'"
      >
        <DialogOverlay class="bg-gray-800 opacity-90 fixed sm:inset-0" />
      </slot>

      <div class="bg-white rounded mx-auto ring-[#9095AD40] ring-4 relative">
        <div
          ref="container"
        />
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts">
export const inheritAttrs = false
</script>

<script setup lang="ts">
import {
  Dialog,
  DialogOverlay,
} from '@headlessui/vue'
import { init, loadRemote } from '@module-federation/runtime'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { CyPromptAppDefaultShape, GetCodeModalContentsShape } from './prompt-app-types'
import { usePromptStore } from '../store/prompt-store'

// Mirrors the ReactDOM.Root type since incorporating those types
// messes up vue typing elsewhere
interface Root {
  render: (element: JSX.Element) => void
  unmount: () => void
}

withDefaults(defineProps<{
  modelValue?: boolean
}>(), {
  modelValue: false,
})

interface CyPromptApp { default: CyPromptAppDefaultShape }

const container = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)
const ReactGetCodeModalContents = ref<GetCodeModalContentsShape | null>(null)
const reactRoot = ref<Root | null>(null)
const promptStore = usePromptStore()

const maybeRenderReactComponent = () => {
  if (!ReactGetCodeModalContents.value || !!error.value) {
    return
  }

  const panel = window.UnifiedRunner.React.createElement(ReactGetCodeModalContents.value, {
    code: promptStore.currentPromptInfo?.text,
    lineNumber: promptStore.currentPromptInfo?.invocationDetails.line,
    columnNumber: promptStore.currentPromptInfo?.invocationDetails.column,
    fileName: promptStore.currentPromptInfo?.invocationDetails.absoluteFilePath,
    onSave: () => {
      closeModal()
    },
  })

  if (!reactRoot.value) {
    reactRoot.value = window.UnifiedRunner.ReactDOM.createRoot(container.value)
  }

  reactRoot.value?.render(panel)
}

const unmountReactComponent = () => {
  if (!ReactGetCodeModalContents.value || !container.value) {
    return
  }

  reactRoot.value?.unmount()
}

onMounted(maybeRenderReactComponent)
onBeforeUnmount(unmountReactComponent)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const closeModal = () => {
  emit('close')
}

init({
  remotes: [{
    alias: 'cy-prompt',
    type: 'module',
    name: 'cy-prompt',
    entryGlobalName: 'cy-prompt',
    entry: '/__cypress-cy-prompt/app/cy-prompt.js',
    shareScope: 'default',
  }],
  name: 'app',
  shared: {
    react: {
      scope: 'default',
      version: '18.3.1',
      lib: () => window.UnifiedRunner.React,
      shareConfig: {
        singleton: true,
        requiredVersion: '^18.3.1',
      },
    },
  },
})

function loadGetCodeModalContents () {
  if (ReactGetCodeModalContents.value) {
    return
  }

  loadRemote<CyPromptApp>('cy-prompt').then((module) => {
    if (!module?.default) {
      error.value = 'The panel was not loaded successfully'

      return
    }

    ReactGetCodeModalContents.value = module.default.GetCodeModalContents
    maybeRenderReactComponent()
  }).catch((e) => {
    error.value = e.message
  })
}

loadGetCodeModalContents()

</script>
