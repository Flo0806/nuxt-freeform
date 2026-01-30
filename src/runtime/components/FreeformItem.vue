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
  context.dragState.value.items.some((i: FreeformItemData) => i.id === props.item.id),
)

function onClick(event: MouseEvent) {
  if (props.disabled) return
  context.select(props.item, {
    ctrl: event.ctrlKey || event.metaKey,
    shift: event.shiftKey,
  })
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
    @click="onClick"
  >
    <slot
      :item="item"
      :selected="isSelected"
      :dragging="isDragging"
    />
  </div>
</template>

<style>
.freeform-item {
  cursor: pointer;
}

.freeform-item--dragging {
  opacity: 0.5;
}

.freeform-item--disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
