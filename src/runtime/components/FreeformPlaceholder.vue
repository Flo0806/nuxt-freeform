<script setup lang="ts">
import { computed } from 'vue'
import { useFreeformContext, getPlaceholderPosition } from '../composables/useFreeform'

const context = useFreeformContext()

// Show placeholder when dragging
const isVisible = computed(() => {
  return (
    context.dragState.value.thresholdPassed
    && context.dropIndex.value !== null
    // Keep placeholder visible even over containers - hiding it shifts layout and causes bugs
    // && !context.currentDropTarget.value
  )
})

// Number of items being dragged
const dragCount = computed(() => context.dragState.value.items.length)

// Calculate placeholder order (in compacted space)
const placeholderOrder = computed(() => {
  if (context.dropIndex.value === null) return -1

  const draggedIds = new Set(context.dragState.value.items.map(i => i.id))
  return getPlaceholderPosition(context.items.value, context.dropIndex.value, draggedIds)
})
</script>

<template>
  <div
    v-if="isVisible"
    class="freeform-placeholder"
    :style="{ order: placeholderOrder }"
  >
    <slot :count="dragCount">
      <!-- Default placeholder style -->
      <div class="freeform-placeholder__default" />
    </slot>
  </div>
</template>

<style>
.freeform-placeholder {
  pointer-events: none;
}

.freeform-placeholder__default {
  width: 100%;
  height: 100%;
  min-height: 60px;
  border: 2px dashed rgba(59, 130, 246, 0.5);
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1);
}
</style>
