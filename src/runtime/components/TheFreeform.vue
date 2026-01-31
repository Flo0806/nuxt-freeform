<script setup lang="ts">
import { watch, onMounted, onUnmounted, computed, inject, useAttrs, ref } from 'vue'
import type { FreeformItemData, DropEventPayload } from '../types'
import { SELECTION_CONTEXT_KEY } from '../types'
import { createFreeformContext } from '../composables/useFreeform'
import { useDropZoneRegistry, type DropZoneEntry } from '../composables/useDropZoneRegistry'

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
  'drop-into': [items: FreeformItemData[], container: FreeformItemData]
  'drop-to-zone': [items: FreeformItemData[], zoneId: string, index: number, containerId: string | null]
}>()

const dropZoneRegistry = useDropZoneRegistry()
const currentExternalZone = ref<DropZoneEntry | null>(null)

const {
  items,
  dragState,
  selectionState,
  disabled: contextDisabled,
  dropIndex,
  dragSourceIndex,
  currentDropTarget,
  itemElements,
  handlePointerMove,
  handlePointerUp,
  handleExternalDrop,
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

// Track if we're receiving an external drop (not our own drag)
const isReceivingExternal = computed(() =>
  props.dropZoneId
  && dropZoneRegistry.hoveredZoneId.value === props.dropZoneId
  && dropZoneRegistry.hoveredItems.value.length > 0
  && !dragState.value.active, // Not receiving if we're the source
)

// Handle external drops - delegate to centralized logic
// IMPORTANT: Only the receiving Freeform should update the global registry!
watch([() => dropZoneRegistry.dragPosition.value, isReceivingExternal], ([pos, receiving]) => {
  // Only update if WE are the target - don't clear if someone else is receiving
  if (!receiving) {
    // Just clear local state, don't touch global registry
    handleExternalDrop(null, [])
    return
  }

  const result = handleExternalDrop(pos, dropZoneRegistry.hoveredItems.value)

  // Update registry so source Freeform can read the target info
  dropZoneRegistry.setTargetDropIndex(result.dropIndex)
  dropZoneRegistry.setTargetContainer(result.containerId)
}, { immediate: true })

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

  // Check for external drop zones (not our own)
  if (dragState.value.thresholdPassed) {
    const pos = { x: event.clientX, y: event.clientY }
    let zone = dropZoneRegistry.findAtPosition(pos.x, pos.y)

    // Ignore our own drop zone
    if (zone && props.dropZoneId && zone.id === props.dropZoneId) {
      zone = null
    }

    if (zone !== currentExternalZone.value) {
      currentExternalZone.value = zone
      // Update global hover state for DropZone components
      dropZoneRegistry.setHovered(zone?.id ?? null, dragState.value.items, pos)
    }
    else if (zone) {
      // Same zone, just update position
      dropZoneRegistry.updatePosition(pos)
    }
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
    const externalZone = currentExternalZone.value

    emit('drag-end', draggedItems)

    // Drop to external zone (highest priority)
    if (externalZone) {
      const accepted = externalZone.accept ? externalZone.accept(draggedItems) : true
      if (accepted) {
        const containerId = dropZoneRegistry.targetContainerId.value

        emit('drop-to-zone', draggedItems, externalZone.id, dropZoneRegistry.targetDropIndex.value ?? 0, containerId)
        emit('drop', {
          items: draggedItems,
          target: null,
          position: dragState.value.currentPosition!,
          dropType: containerId ? 'container' : 'zone',
          targetZoneId: externalZone.id,
          targetContainerId: containerId,
        })
      }
    }
    // Drop into container
    else if (dropTarget?.type === 'container' && dropTarget.accepted) {
      emit('drop-into', draggedItems, dropTarget.item)
      emit('drop', {
        items: draggedItems,
        target: dropTarget,
        position: dragState.value.currentPosition!,
        dropType: 'container',
        targetContainer: dropTarget.item,
      })
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

  currentExternalZone.value = null
  dropZoneRegistry.setHovered(null)
  dropZoneRegistry.setTargetContainer(null)
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
