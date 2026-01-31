import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { FreeformItemData, DragState, SelectionState, Position } from '../types'

export const FREEFORM_CONTEXT_KEY: InjectionKey<FreeformContext> = Symbol('freeform-context')

export interface FreeformContext {
  items: Ref<FreeformItemData[]>
  dragState: Ref<DragState>
  selectionState: Ref<SelectionState>
  disabled: Ref<boolean>
  dropIndex: Ref<number | null>
  dragSourceIndex: Ref<number | null>
  registerItem: (id: string, element: HTMLElement) => void
  unregisterItem: (id: string) => void
  select: (item: FreeformItemData, options?: { shift?: boolean, ctrl?: boolean }) => void
  clearSelection: () => void
  startDrag: (item: FreeformItemData, event: PointerEvent) => void
  getVisualIndex: (itemId: string) => number
}

export interface FreeformContextInternal extends FreeformContext {
  itemElements: Map<string, HTMLElement>
  handlePointerMove: (event: PointerEvent) => void
  handlePointerUp: (event: PointerEvent) => void
}

const DRAG_THRESHOLD = 5

export function createFreeformContext() {
  const itemElements = new Map<string, HTMLElement>()
  const items = ref<FreeformItemData[]>([])
  const disabled = ref(false)
  const dropIndex = ref<number | null>(null)
  const dragSourceIndex = ref<number | null>(null)

  const dragState = ref<DragState>({
    active: false,
    items: [],
    startPosition: null,
    currentPosition: null,
    offset: null,
    thresholdPassed: false,
  })

  const selectionState = ref<SelectionState>({
    items: [],
    lassoActive: false,
    lassoRect: null,
  })

  function select(item: FreeformItemData, options?: { shift?: boolean, ctrl?: boolean }) {
    if (options?.ctrl) {
      const idx = selectionState.value.items.findIndex(i => i.id === item.id)
      if (idx >= 0) {
        selectionState.value.items.splice(idx, 1)
      }
      else {
        selectionState.value.items.push(item)
      }
    }
    else {
      selectionState.value.items = [item]
    }
  }

  function clearSelection() {
    selectionState.value.items = []
  }

  function startDrag(item: FreeformItemData, event: PointerEvent) {
    if (disabled.value) return
    if (event.button !== 0) return

    event.preventDefault()

    // If item is selected, drag all selected items
    // If not selected, select it and drag only it
    const isSelected = selectionState.value.items.some(i => i.id === item.id)
    const itemsToDrag = isSelected ? [...selectionState.value.items] : [item]

    if (!isSelected) {
      selectionState.value.items = [item]
    }

    // Store source index for reordering
    const sourceIdx = items.value.findIndex(i => i.id === item.id)
    dragSourceIndex.value = sourceIdx
    dropIndex.value = sourceIdx

    const startPos: Position = { x: event.clientX, y: event.clientY }

    dragState.value = {
      active: true,
      items: itemsToDrag,
      startPosition: startPos,
      currentPosition: startPos,
      offset: null,
      thresholdPassed: false,
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (!dragState.value.active || !dragState.value.startPosition) return

    const currentPosition: Position = { x: event.clientX, y: event.clientY }

    // Check threshold before starting visual drag
    if (!dragState.value.thresholdPassed) {
      const dx = Math.abs(currentPosition.x - dragState.value.startPosition.x)
      const dy = Math.abs(currentPosition.y - dragState.value.startPosition.y)

      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return

      dragState.value.thresholdPassed = true
    }

    dragState.value.currentPosition = currentPosition

    // Calculate drop index based on mouse position
    updateDropIndex(currentPosition)
  }

  function updateDropIndex(position: Position) {
    // Find which item element the mouse is over
    for (const [id, element] of itemElements) {
      // Skip dragged items
      if (dragState.value.items.some(i => i.id === id)) continue

      const rect = element.getBoundingClientRect()
      if (
        position.x >= rect.left
        && position.x <= rect.right
        && position.y >= rect.top
        && position.y <= rect.bottom
      ) {
        const idx = items.value.findIndex(i => i.id === id)
        if (idx !== -1) {
          dropIndex.value = idx
        }
        return
      }
    }
  }

  function handlePointerUp(_event: PointerEvent) {
    if (!dragState.value.active) return

    // Reset drag state
    dragState.value = {
      active: false,
      items: [],
      startPosition: null,
      currentPosition: null,
      offset: null,
      thresholdPassed: false,
    }

    // Reset sorting indices
    dragSourceIndex.value = null
    dropIndex.value = null
  }

  function getVisualIndex(itemId: string): number {
    const actualIndex = items.value.findIndex(i => i.id === itemId)
    if (actualIndex === -1) return -1

    // If not dragging, return actual index
    if (dragSourceIndex.value === null || dropIndex.value === null) {
      return actualIndex
    }

    // If this item is being dragged, return drop index
    if (dragState.value.items.some(i => i.id === itemId)) {
      return dropIndex.value
    }

    // Calculate visual index based on drag movement
    const source = dragSourceIndex.value
    const target = dropIndex.value

    if (source === target) return actualIndex

    if (source < target) {
      // Dragging down: items between source and target shift up
      if (actualIndex > source && actualIndex <= target) {
        return actualIndex - 1
      }
    }
    else {
      // Dragging up: items between target and source shift down
      if (actualIndex >= target && actualIndex < source) {
        return actualIndex + 1
      }
    }

    return actualIndex
  }

  const context: FreeformContext = {
    items,
    dragState,
    selectionState,
    disabled,
    dropIndex,
    dragSourceIndex,
    registerItem: (id, element) => itemElements.set(id, element),
    unregisterItem: id => itemElements.delete(id),
    select,
    clearSelection,
    startDrag,
    getVisualIndex,
  }

  provide(FREEFORM_CONTEXT_KEY, context)

  return {
    context,
    items,
    dragState,
    selectionState,
    disabled,
    dropIndex,
    dragSourceIndex,
    itemElements,
    handlePointerMove,
    handlePointerUp,
    getVisualIndex,
  }
}

export function useFreeformContext(): FreeformContext {
  const context = inject(FREEFORM_CONTEXT_KEY)
  if (!context) {
    throw new Error('useFreeformContext must be used inside a <TheFreeform> component')
  }
  return context
}
