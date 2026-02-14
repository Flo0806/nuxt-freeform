<script setup lang="ts">
import { watch, onMounted, onUnmounted, computed, inject } from 'vue'
import type { FreeformItemData, DropEventPayload } from '../types'
import { SELECTION_CONTEXT_KEY } from '../types'
import { createFreeformContext } from '../composables/useFreeform'
import { useExternalDrag } from '../composables/useExternalDrag'
import { useExternalDrop } from '../composables/useExternalDrop'

const props = withDefaults(defineProps<{
  modelValue: FreeformItemData[]
  disabled?: boolean
  /** If true, reorder is not applied automatically. User must handle @reorder event manually. */
  manualReorder?: boolean
  /** ID of parent DropZone - enables receiving external drops with placeholder */
  dropZoneId?: string
}>(), {
  disabled: false,
  manualReorder: false,
})

const emit = defineEmits<{
  'update:modelValue': [items: FreeformItemData[]]
  'select': [items: FreeformItemData[]]
  'drag-start': [items: FreeformItemData[]]
  'drag-move': [items: FreeformItemData[], position: { x: number, y: number }]
  'drag-end': [items: FreeformItemData[]]
  'reorder': [fromIndex: number, toIndex: number]
  'drop': [payload: DropEventPayload]
  'drop-into': [items: FreeformItemData[], container: FreeformItemData, accepted: boolean]
  'drop-to-zone': [items: FreeformItemData[], zoneId: string, index: number, containerId: string | null]
}>()

const {
  items,
  dragState,
  selectionState,
  disabled: contextDisabled,
  dropIndex,
  dragSourceIndex,
  currentDropTarget,
  containerElement,
  itemElements,
  handlePointerMove,
  handlePointerUp,
  handleExternalDrop,
} = createFreeformContext()

// === CROSS-LIST DRAG & DROP ===
const { detectExternalZone, finishExternalDrag } = useExternalDrag(props.dropZoneId)
useExternalDrop({ dropZoneId: props.dropZoneId, dragState, handleExternalDrop })

// Register with FreeformSelection if present
const selectionContext = inject(SELECTION_CONTEXT_KEY, null)

// Sync props to context
watch(() => props.modelValue, (newItems) => {
  items.value = [...newItems]
}, { immediate: true, deep: true })

watch(() => props.disabled, (val) => {
  contextDisabled.value = val
}, { immediate: true })

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

// Emit drag-move event
watch(() => dragState.value.currentPosition, (pos) => {
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

// Lasso state from our own selection state
const isLassoActive = computed(() => selectionState.value.lassoActive)

// Global pointer event listeners
function onPointerMove(event: PointerEvent) {
  handlePointerMove(event)

  // Detect external drop zones while dragging
  if (dragState.value.thresholdPassed) {
    detectExternalZone({ x: event.clientX, y: event.clientY }, dragState.value.items)
  }
}

function reorderItems(draggedItems: FreeformItemData[], targetIndex: number): FreeformItemData[] {
  const draggedIds = new Set(draggedItems.map(i => i.id))

  // Keep dragged items in their original array order
  const itemsToMove = items.value.filter(i => draggedIds.has(i.id))
  const remaining = items.value.filter(i => !draggedIds.has(i.id))

  // Calculate insert position in remaining array
  // Count how many non-dragged items are before targetIndex
  let insertAt = 0
  for (let i = 0; i < targetIndex && i < items.value.length; i++) {
    if (!draggedIds.has(items.value[i]!.id)) {
      insertAt++
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
    const dropTarget = currentDropTarget.value

    emit('drag-end', draggedItems)

    // Drop to external zone (highest priority)
    const externalDrop = finishExternalDrag(draggedItems)
    if (externalDrop) {
      emit('drop-to-zone', draggedItems, externalDrop.zoneId, externalDrop.dropIndex, externalDrop.containerId)
      emit('drop', {
        items: draggedItems,
        target: null,
        position: dragState.value.currentPosition!,
        dropType: externalDrop.containerId ? 'container' : 'zone',
        targetZoneId: externalDrop.zoneId,
        targetContainerId: externalDrop.containerId,
      })
      // Clear selection after dropping to external zone
      selectionState.value.items = []
    }
    // Drop into container (internal) - emit for both accepted and rejected
    else if (dropTarget?.type === 'container') {
      emit('drop-into', draggedItems, dropTarget.item, dropTarget.accepted)
      if (dropTarget.accepted) {
        emit('drop', {
          items: draggedItems,
          target: dropTarget,
          position: dragState.value.currentPosition!,
          dropType: 'container',
          targetContainer: dropTarget.item,
        })
        // Clear selection after dropping into container
        selectionState.value.items = []
      }
    }
    // Reorder (no container target)
    else {
      const to = dropIndex.value
      if (to !== null && draggedItems.length > 0) {
        // Auto-reorder unless manualReorder is enabled
        if (!props.manualReorder) {
          const newItems = reorderItems(draggedItems, to)
          items.value = newItems
          emit('update:modelValue', newItems)
        }

        // Always emit events so user can handle manually if needed
        emit('reorder', dragSourceIndex.value ?? 0, to)
        emit('drop', {
          items: draggedItems,
          target: null,
          position: dragState.value.currentPosition!,
          dropType: 'reorder',
          fromIndex: dragSourceIndex.value ?? 0,
          toIndex: to,
        })
      }
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
  <div
    ref="containerElement"
    class="freeform-container"
  >
    <slot
      :items="items"
      :selected="selectionState.items"
      :is-dragging="isDragging"
      :drag-items="dragItems"
      :is-lasso-active="isLassoActive"
      :drop-index="dropIndex"
      :drag-source-index="dragSourceIndex"
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
        >
          <!-- Default ghost: looks like item but transparent -->
          <div class="freeform-ghost-default">
            <span class="freeform-ghost-default__label">{{ dragItems[0]?.id }}</span>
            <span
              v-if="dragItems.length > 1"
              class="freeform-ghost-default__badge"
            >
              +{{ dragItems.length - 1 }}
            </span>
          </div>
        </slot>
      </div>
    </Teleport>
  </div>
</template>

<style>
.freeform-container {
  position: relative;
  display: flex;

  /* Color tokens - override these to customize */
  --freeform-color-primary: #3b82f6;
  --freeform-color-primary-light: #dbeafe;
  --freeform-color-success: #22c55e;
  --freeform-color-success-light: #dcfce7;
  --freeform-color-danger: #ef4444;
  --freeform-color-danger-light: #fee2e2;
  --freeform-color-neutral: #f3f4f6;
  --freeform-color-text: #374151;
}

/* Default ghost styling - looks like item but transparent */
.freeform-ghost-default {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: var(--freeform-color-neutral);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

.freeform-ghost-default__label {
  font-weight: 500;
  color: var(--freeform-color-text);
}

.freeform-ghost-default__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: var(--freeform-color-primary);
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}
</style>
