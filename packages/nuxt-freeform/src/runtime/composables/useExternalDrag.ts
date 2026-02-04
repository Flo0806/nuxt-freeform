import { ref } from 'vue'
import type { FreeformItemData } from '../types'
import { useDropZoneRegistry, type DropZoneEntry } from './useDropZoneRegistry'

/**
 * Handles SOURCE side of cross-list drag:
 * - Detects when dragging over external drop zones
 * - Updates global registry with hover state
 */
export function useExternalDrag(ownDropZoneId?: string) {
  const registry = useDropZoneRegistry()
  const currentExternalZone = ref<DropZoneEntry | null>(null)

  /**
   * Call during pointermove when dragging.
   * Detects external zones and updates registry.
   */
  function detectExternalZone(pos: { x: number, y: number }, draggedItems: FreeformItemData[]) {
    let zone = registry.findAtPosition(pos.x, pos.y)

    // Ignore our own drop zone
    if (zone && ownDropZoneId && zone.id === ownDropZoneId) {
      zone = null
    }

    if (zone !== currentExternalZone.value) {
      currentExternalZone.value = zone
      registry.setHovered(zone?.id ?? null, draggedItems, pos)
    }
    else if (zone) {
      // Same zone, just update position
      registry.updatePosition(pos)
    }
  }

  /**
   * Call on pointerup. Returns drop info and cleans up.
   *
   * Accept logic:
   * - If dropping into a container: check container.accept (via registry)
   * - If dropping directly into zone: check zone.accept
   */
  function finishExternalDrag(draggedItems: FreeformItemData[]) {
    const zone = currentExternalZone.value
    if (!zone) {
      return null
    }

    const containerId = registry.targetContainerId.value
    const containerAccepted = registry.targetContainerAccepted.value

    if (containerId) {
      // Dropping into container - check container accept
      if (!containerAccepted) {
        cleanup()
        return null
      }
    }
    else {
      // Direct drop into zone - check zone accept
      const accepted = zone.accept ? zone.accept(draggedItems) : true
      if (!accepted) {
        cleanup()
        return null
      }
    }

    const result = {
      zoneId: zone.id,
      dropIndex: registry.targetDropIndex.value ?? 0,
      containerId,
    }

    cleanup()
    return result
  }

  function cleanup() {
    currentExternalZone.value = null
    registry.setHovered(null)
    registry.setTargetContainer(null)
  }

  return {
    currentExternalZone,
    detectExternalZone,
    finishExternalDrag,
    cleanup,
  }
}
