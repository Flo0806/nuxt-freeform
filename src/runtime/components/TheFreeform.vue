<script setup lang="ts">
import { watch, onMounted, onUnmounted, computed, inject, useAttrs } from 'vue'
import type { FreeformItemData } from '../types'
import { SELECTION_CONTEXT_KEY } from '../types'
import { createFreeformContext } from '../composables/useFreeform'

const props = withDefaults(defineProps<{
  modelValue: FreeformItemData[]
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [items: FreeformItemData[]]
  'select': [items: FreeformItemData[]]
  'drag-start': [items: FreeformItemData[]]
  'drag-move': [items: FreeformItemData[], position: { x: number, y: number }]
  'drag-end': [items: FreeformItemData[]]
  'reorder': [fromIndex: number, toIndex: number]
}>()

const {
  items,
  dragState,
  selectionState,
  disabled: contextDisabled,
  dropIndex,
  dragSourceIndex,
  itemElements,
  handlePointerMove,
  handlePointerUp,
} = createFreeformContext()

// Register with FreeformSelection if present
const selectionContext = inject(SELECTION_CONTEXT_KEY, null)

// Sync props to context
watch(() => props.modelValue, (newItems) => {
  items.value = [...newItems]
}, { immediate: true, deep: true })

watch(() => props.disabled, (val) => {
  contextDisabled.value = val
}, { immediate: true })

// Check if drag-move listener is bound (optimization)
const attrs = useAttrs()
const hasDragMoveListener = computed(() => 'onDrag-move' in attrs || 'onDragMove' in attrs)

// Emit select event
watch(() => selectionState.value.items, (selected) => {
  emit('select', [...selected])
}, { deep: true })

// Emit drag-start event
watch(() => dragState.value.thresholdPassed, (passed) => {
  if (passed) {
    emit('drag-start', [...dragState.value.items])
  }
})

// Emit drag-move event (only if listener is bound)
watch(() => dragState.value.currentPosition, (pos) => {
  if (!hasDragMoveListener.value) return
  if (dragState.value.thresholdPassed && pos) {
    emit('drag-move', [...dragState.value.items], { ...pos })
  }
})

// Ghost position
const ghostStyle = computed(() => {
  if (!dragState.value.thresholdPassed || !dragState.value.currentPosition) {
    return { display: 'none' }
  }
  return {
    position: 'fixed' as const,
    left: `${dragState.value.currentPosition.x}px`,
    top: `${dragState.value.currentPosition.y}px`,
    pointerEvents: 'none' as const,
    zIndex: 9999,
    transform: 'translate(-50%, -50%)',
  }
})

const isDragging = computed(() => dragState.value.thresholdPassed)
const dragItems = computed(() => dragState.value.items)
const dragPosition = computed(() => dragState.value.currentPosition)
const dragStartPosition = computed(() => dragState.value.startPosition)

// Lasso state from selection context (if present)
const isLassoActive = computed(() => selectionContext?.selectionState.value.lassoActive ?? false)

// Global pointer event listeners
function onPointerMove(event: PointerEvent) {
  handlePointerMove(event)
}

function reorderItems(draggedItems: FreeformItemData[], targetIndex: number): FreeformItemData[] {
  const draggedIds = new Set(draggedItems.map(i => i.id))

  // Find first dragged item's original index
  const firstDraggedIdx = items.value.findIndex(i => draggedIds.has(i.id))

  // Keep dragged items in their original array order
  const itemsToMove = items.value.filter(i => draggedIds.has(i.id))
  const remaining = items.value.filter(i => !draggedIds.has(i.id))

  // Find the target item and its position in remaining array
  const targetItem = items.value[targetIndex]
  let insertAt = remaining.length

  if (targetItem) {
    const foundIdx = remaining.findIndex(i => i.id === targetItem.id)
    if (foundIdx !== -1) {
      // If dragging forward (to higher index): insert AFTER target
      // If dragging backward (to lower index): insert BEFORE target
      insertAt = firstDraggedIdx < targetIndex ? foundIdx + 1 : foundIdx
    }
  }

  return [
    ...remaining.slice(0, insertAt),
    ...itemsToMove,
    ...remaining.slice(insertAt),
  ]
}

function onPointerUp(event: PointerEvent) {
  if (dragState.value.thresholdPassed) {
    const draggedItems = [...dragState.value.items]
    emit('drag-end', draggedItems)

    const to = dropIndex.value
    if (to !== null && draggedItems.length > 0) {
      const newItems = reorderItems(draggedItems, to)
      // Update internal state immediately to prevent race conditions
      items.value = newItems
      emit('update:modelValue', newItems)
      emit('reorder', dragSourceIndex.value ?? 0, to)
    }
  }
  handlePointerUp(event)
}

onMounted(() => {
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerUp)

  // Register with FreeformSelection if present
  if (selectionContext) {
    selectionContext.registerFreeform({
      items,
      itemElements,
      disabled: contextDisabled,
      selectionState,
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('pointercancel', onPointerUp)

  // Unregister from FreeformSelection
  if (selectionContext) {
    selectionContext.unregisterFreeform()
  }
})
</script>

<template>
  <div class="freeform-container">
    <slot
      :items="items"
      :selected="selectionState.items"
      :is-dragging="isDragging"
      :drag-items="dragItems"
      :is-lasso-active="isLassoActive"
    />

    <!-- Drag Ghost (user provides via slot) -->
    <Teleport to="body">
      <div
        v-if="isDragging"
        :style="ghostStyle"
      >
        <slot
          name="drag-ghost"
          :items="dragItems"
          :count="dragItems.length"
          :position="dragPosition"
          :start-position="dragStartPosition"
        />
      </div>
    </Teleport>
  </div>
</template>

<style>
.freeform-container {
  position: relative;
}
</style>
