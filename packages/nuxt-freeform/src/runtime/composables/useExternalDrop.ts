import { computed, watch, type Ref } from 'vue'
import type { FreeformItemData, DragState } from '../types'
import { useDropZoneRegistry } from './useDropZoneRegistry'

interface ExternalDropOptions {
  dropZoneId?: string
  dragState: Ref<DragState>
  handleExternalDrop: (position: { x: number, y: number } | null, items: FreeformItemData[]) => {
    dropIndex: number | null
    containerId: string | null
    containerAccepted: boolean
  }
}

/**
 * Handles TARGET side of cross-list drag:
 * - Detects when external items are dragged over this Freeform
 * - Calculates drop position and container targets
 * - Updates registry so source can read drop info
 */
export function useExternalDrop(options: ExternalDropOptions) {
  const registry = useDropZoneRegistry()

  // Are we receiving an external drop?
  const isReceiving = computed(() =>
    options.dropZoneId
    && registry.hoveredZoneId.value === options.dropZoneId
    && registry.hoveredItems.value.length > 0
    && !options.dragState.value.active, // Not receiving if we're the source
  )

  // Watch for external drops and calculate position
  watch([() => registry.dragPosition.value, isReceiving], ([pos, receiving]) => {
    // Only update if WE are the target - don't clear if someone else is receiving
    if (!receiving) {
      // Just clear local state, don't touch global registry
      options.handleExternalDrop(null, [])
      return
    }

    const result = options.handleExternalDrop(pos, registry.hoveredItems.value)

    // Update registry so source Freeform can read the target info
    registry.setTargetDropIndex(result.dropIndex)
    registry.setTargetContainer(result.containerId, result.containerAccepted)
  }, { immediate: true })

  return {
    isReceiving,
  }
}
