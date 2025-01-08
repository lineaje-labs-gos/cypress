<template>
  <div>
    <StudioContainer
      v-if="!tearingDown"
    />
  </div>
</template>

<script lang="ts" setup>
import StudioContainer from '../../runner/studio/StudioContainer.vue'
import { useUnifiedRunner } from '../../runner/unifiedRunner'

const { tearingDown } = useUnifiedRunner(true)

</script>

<route>
  {
    name: 'StudioRunner',
    meta: {
      header: false,
      navBarExpandedAllowed: false
    }
  }
</route>

<style lang="scss">

iframe.aut-iframe {
  width: 100%;
  height: 100%;
  background: white;
}

.is-screenshotting #main-pane {
  overflow: auto !important;
}

.is-screenshotting.screenshot-scrolling #main-pane {
  overflow: visible !important;
}

#resizable-panels-root {
  overflow-x: auto;
  overflow-y: hidden;
}

.is-screenshotting #resizable-panels-root {
  overflow-x: visible;
  overflow-y: visible;
}

iframe.spec-iframe {
    border: none;
    height: 0;
    position: absolute;
    visibility: hidden;
    width: 0;
}

.highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}

.tooltip {
  font-family: sans-serif;
  font-size: 14px;
  max-width: 400px !important;
}

#unified-runner {
  position: relative;
    margin: 0 auto;
}

.is-screenshotting #unified-runner {
    margin: unset;
}

#unified-runner > .screenshot-height-container {
  height: 100%
}

.is-screenshotting #unified-runner > .screenshot-height-container {
  height: min(100%, 100vh);
}

</style>
