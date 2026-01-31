<script setup lang="ts">
import { computed } from 'vue'
import { useFreeformContext, getPlaceholderPosition } from '../composables/useFreeform'
import { useDropZoneRegistry } from '../composables/useDropZoneRegistry'

const context = useFreeformContext()
const registry = useDropZoneRegistry()

// Show placeholder when dragging (internal or receiving external)
const isVisible = computed(() => {
  const hasDropIndex = context.dropIndex.value !== null

  // Internal drag
  if (context.dragState.value.thresholdPassed && hasDropIndex) {
    return true
  }

  // External drop (dragSourceIndex === -1 means items coming from outside)
  if (context.dragSourceIndex.value === -1 && hasDropIndex) {
    return true
  }

  return false
})

// Number of items being dragged (internal or external)
const dragCount = computed(() => {
  // External drop
  if (context.dragSourceIndex.value === -1) {
    return registry.hoveredItems.value.length
  }
  // Internal drag
  return context.dragState.value.items.length
})

// Calculate placeholder order (in compacted space)
const placeholderOrder = computed(() => {
  if (context.dropIndex.value === null) return -1

  // External drop: placeholder order is just the dropIndex
  if (context.dragSourceIndex.value === -1) {
    return context.dropIndex.value
  }

  // Internal drag: calculate in compacted space
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
