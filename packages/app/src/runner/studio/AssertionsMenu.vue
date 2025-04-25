<template>
  <div
    ref="highlight"
    class="highlight"
    :style="highlightStyle"
  />
  <div
    ref="assertionsMenu"
    data-cy="assertions-menu"
    class="assertions-menu bg-gray-1100 border-{9747FF} rounded-[5px] absolute text-sm text-gray-300"
  >
    <div class="flex items-center border-b border-gray-900 p-[0.5rem]">
      <div
        class="title font-semibold flex items-center gap-2"
        data-cy="assertions-menu-title"
      >
        <IconActionTap
          size="16"
          fill-color="gray-900"
          stroke-color="gray-500"
        />
        Assert
      </div>
      <div class="close-wrapper ml-auto mt-[-2.5px]">
        <a
          class="close text-[18px] font-medium hover:cursor-pointer focus:cursor-pointer active:cursor-pointer"
          data-cy="assertions-menu-close"
          @click.stop="onClose"
        >&times;</a>
      </div>
    </div>
    <div
      class="subtitle"
      data-cy="assertions-menu-subtitle"
    >
      Expect
      {{ ' ' }}
      <Tag
        :dark="true"
        color="gray"
        size="20"
      >
        <code>
          {{ tagName }}
        </code>
      </Tag>
      {{ ' ' }}
      to
    </div>
    <div
      class="assertions-list"
      data-cy="assertions-menu-list"
    >
      <AssertionType
        v-for="(assertion) in possibleAssertions"
        :key="assertion.type"
        :type="assertion.type"
        :options="assertion.options"
        @add-assertion="onAddAssertion"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createPopper } from '@popperjs/core'
import AssertionType from './AssertionType.vue'
import _ from 'lodash'
import { nextTick, onMounted, Ref, ref, StyleValue } from 'vue'
import type { PossibleAssertions, AddAssertion, AssertionArgs } from './types'
import Tag from '@cypress-design/vue-tag'
import { IconActionTap } from '@cypress-design/vue-icon'

const props = defineProps <{
  jqueryElement: JQuery<HTMLElement>
  possibleAssertions: PossibleAssertions
  addAssertion: AddAssertion
  closeMenu: () => void
  highlightStyle: StyleValue
}>()

const onAddAssertion = ({ type, name, value }: {
  type: string
  name?: string
  value?: string
}) => {
  let args = [type, name, value]

  args = _.compact(args)
  props.addAssertion(props.jqueryElement, ...args as AssertionArgs)
}

const onClose = () => {
  props.closeMenu()
}

const tagName = `<${props.jqueryElement.prop('tagName').toLowerCase()}>`

const highlight: Ref<HTMLElement | null> = ref(null)
const assertionsMenu: Ref<HTMLElement | null> = ref(null)

onMounted(() => {
  nextTick(() => {
    const highlightEl = highlight.value as HTMLElement
    const assertionsMenuEl = assertionsMenu.value as HTMLElement

    createPopper(highlightEl, assertionsMenuEl, {
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            altAxis: true,
          },
        },
      ],
    })
  })
})
</script>

<style lang="scss">

.highlight {
  background: rgba(159, 196, 231, 0.6);
  border: solid 2px #9FC4E7;
  cursor: pointer;
}

.assertions-menu {
  box-shadow: 2px 5px 12px rgba(0, 0, 0, 0.2);
  z-index: 2147483647;
  width: 175px;

  .subtitle {
    border-bottom: 1px solid #c4c4c4;
    color: $gray-500;
    font-weight: 400;
    padding: 0.5rem 0.7rem;

    code {
      color: $white;
    }
  }
}
</style>
