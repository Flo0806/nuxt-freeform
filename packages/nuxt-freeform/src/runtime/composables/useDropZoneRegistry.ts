import { ref } from 'vue'
import type { FreeformItemData } from '../types'

export interface DropZoneEntry {
  id: string
  element: HTMLElement
  accept?: (items: FreeformItemData[]) => boolean
}

// Global registry - shared across all Freeform instances
const dropZoneRegistry = new Map<string, DropZoneEntry>()

// Currently hovered zone (reactive)
const hoveredZoneId = ref<string | null>(null)
const hoveredItems = ref<FreeformItemData[]>([])
const dragPosition = ref<{ x: number, y: number } | null>(null)
const targetDropIndex = ref<number | null>(null)
const targetContainerId = ref<string | null>(null)

export function useDropZoneRegistry() {
  function register(id: string, element: HTMLElement, accept?: (items: FreeformItemData[]) => boolean) {
    dropZoneRegistry.set(id, { id, element, accept })
  }

  function unregister(id: string) {
    dropZoneRegistry.delete(id)
    if (hoveredZoneId.value === id) {
      hoveredZoneId.value = null
      hoveredItems.value = []
    }
  }

  function getAll(): Map<string, DropZoneEntry> {
    return dropZoneRegistry
  }

  function findAtPosition(x: number, y: number, excludeIds: Set<string> = new Set()): DropZoneEntry | null {
    for (const [id, entry] of dropZoneRegistry) {
      if (excludeIds.has(id)) continue
      const rect = entry.element.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return entry
      }
    }
    return null
  }

  function setHovered(zoneId: string | null, items: FreeformItemData[] = [], position: { x: number, y: number } | null = null) {
    // Reset targetDropIndex first, watch will recalculate it after position update
    if (hoveredZoneId.value !== zoneId) {
      targetDropIndex.value = null
    }
    hoveredZoneId.value = zoneId
    hoveredItems.value = items
    dragPosition.value = position
  }

  function updatePosition(position: { x: number, y: number }) {
    dragPosition.value = position
  }

  function setTargetDropIndex(index: number | null) {
    targetDropIndex.value = index
  }

  function setTargetContainer(containerId: string | null) {
    targetContainerId.value = containerId
  }

  return {
    register,
    unregister,
    getAll,
    findAtPosition,
    setHovered,
    updatePosition,
    setTargetDropIndex,
    setTargetContainer,
    hoveredZoneId,
    hoveredItems,
    dragPosition,
    targetDropIndex,
    targetContainerId,
  }
}
