<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { FreeformItemData } from '../types'
import { useFreeformContext } from '../composables/useFreeform'

const props = defineProps<{
  item: FreeformItemData
  disabled?: boolean
}>()

const context = useFreeformContext()
const elementRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (elementRef.value) {
    context.registerItem(props.item.id, elementRef.value)
  }
})

onUnmounted(() => {
  context.unregisterItem(props.item.id)
})

const isSelected = computed(() =>
  context.selectionState.value.items.some((i: FreeformItemData) => i.id === props.item.id),
)

const isDragging = computed(() =>
  context.dragState.value.thresholdPassed
  && context.dragState.value.items.some((i: FreeformItemData) => i.id === props.item.id),
)

const actualIndex = computed(() =>
  context.items.value.findIndex(i => i.id === props.item.id),
)

const visualIndex = computed(() =>
  context.getVisualIndex(props.item.id),
)

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return

  // Stop propagation so container doesn't start lasso
  event.stopPropagation()

  // Handle selection on pointer down
  // Ctrl/Cmd+click toggles selection
  if (event.ctrlKey || event.metaKey) {
    context.select(props.item, { ctrl: true })
    return
  }

  // Start drag (will also select item if not already selected)
  context.startDrag(props.item, event)
}

function onClick(event: MouseEvent) {
  if (props.disabled) return

  // If a drag happened, don't change selection
  if (context.dragState.value.thresholdPassed) return

  // Ctrl+click was already handled in pointerdown
  if (event.ctrlKey || event.metaKey) return

  // Normal click selects only this item
  context.select(props.item)
}
</script>

<template>
  <div
    ref="elementRef"
    class="freeform-item"
    :class="{
      'freeform-item--selected': isSelected,
      'freeform-item--dragging': isDragging,
      'freeform-item--disabled': disabled,
    }"
    data-freeform-item
    :data-index="actualIndex"
    :data-visual-index="visualIndex"
    @pointerdown="onPointerDown"
    @click="onClick"
  >
    <slot
      :item="item"
      :selected="isSelected"
      :dragging="isDragging"
      :index="actualIndex"
      :visual-index="visualIndex"
    />
  </div>
</template>

<style>
.freeform-item {
  touch-action: none;
}
</style>
