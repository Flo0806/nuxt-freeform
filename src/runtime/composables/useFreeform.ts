import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { FreeformItemData, DragState, SelectionState, Position, DropTarget, DropZoneEntry, Rect } from '../types'

export const FREEFORM_CONTEXT_KEY: InjectionKey<FreeformContext> = Symbol('freeform-context')

export interface FreeformContext {
  items: Ref<FreeformItemData[]>
  dragState: Ref<DragState>
  selectionState: Ref<SelectionState>
  disabled: Ref<boolean>
  dropIndex: Ref<number | null>
  dragSourceIndex: Ref<number | null>
  currentDropTarget: Ref<DropTarget | null>
  /** Size of the first dragged item (for placeholder sizing) */
  draggedItemSize: Ref<{ width: number, height: number } | null>
  registerItem: (id: string, element: HTMLElement) => void
  unregisterItem: (id: string) => void
  registerDropZone: (id: string, element: HTMLElement, item?: FreeformItemData, accept?: (items: FreeformItemData[]) => boolean) => void
  unregisterDropZone: (id: string) => void
  setDropTarget: (item: FreeformItemData, accept?: (items: FreeformItemData[]) => boolean) => void
  clearDropTarget: () => void
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

// ============================================================================
// Constants
// ============================================================================

const DRAG_THRESHOLD = 5
const EDGE_PERCENT = 0.40
const EDGE_MIN_PX = 20
const ROW_THRESHOLD = 20

// ============================================================================
// Utility Functions
// ============================================================================

function getEdgeThreshold(width: number): number {
  return Math.max(width * EDGE_PERCENT, EDGE_MIN_PX)
}

function domRectToRect(domRect: DOMRect): Rect {
  return {
    x: domRect.left,
    y: domRect.top,
    width: domRect.width,
    height: domRect.height,
  }
}

/**
 * Calculate placeholder position in "compacted space" (list without dragged items)
 * Used by both getVisualIndex and FreeformPlaceholder
 */
export function getPlaceholderPosition(
  items: FreeformItemData[],
  targetIndex: number,
  draggedIds: Set<string>,
): number {
  let pos = 0
  for (let i = 0; i < targetIndex; i++) {
    if (!draggedIds.has(items[i]!.id)) {
      pos++
    }
  }
  return pos
}

// ============================================================================
// Reorder Helpers
// ============================================================================

type VisibleItem = { id: string, index: number, rect: DOMRect }

function collectVisibleItems(
  itemElements: Map<string, HTMLElement>,
  items: FreeformItemData[],
  draggedIds: Set<string>,
): VisibleItem[] {
  const result: VisibleItem[] = []
  for (const [id, element] of itemElements) {
    if (draggedIds.has(id)) continue
    const idx = items.findIndex(i => i.id === id)
    if (idx !== -1) {
      result.push({ id, index: idx, rect: element.getBoundingClientRect() })
    }
  }
  return result
}

function sortAndGroupByRow(visibleItems: VisibleItem[]): VisibleItem[][] {
  // Sort by visual position (row first, then column)
  visibleItems.sort((a, b) => {
    const rowDiff = a.rect.top - b.rect.top
    if (Math.abs(rowDiff) < ROW_THRESHOLD) {
      return a.rect.left - b.rect.left
    }
    return rowDiff
  })

  // Group items by row
  const rows: VisibleItem[][] = []
  let currentRow: VisibleItem[] = []
  let lastTop = -Infinity

  for (const item of visibleItems) {
    if (currentRow.length === 0 || Math.abs(item.rect.top - lastTop) < ROW_THRESHOLD) {
      currentRow.push(item)
      lastTop = item.rect.top
    }
    else {
      rows.push(currentRow)
      currentRow = [item]
      lastTop = item.rect.top
    }
  }
  if (currentRow.length > 0) rows.push(currentRow)

  return rows
}

function findDropIndexInRow(row: VisibleItem[], positionX: number): number | null {
  for (let i = 0; i <= row.length; i++) {
    const prevItem = row[i - 1]
    const nextItem = row[i]

    let gapLeft: number
    let gapRight: number

    if (!prevItem) {
      gapLeft = -Infinity
      gapRight = nextItem!.rect.left + getEdgeThreshold(nextItem!.rect.width)
    }
    else if (!nextItem) {
      gapLeft = prevItem.rect.right - getEdgeThreshold(prevItem.rect.width)
      gapRight = Infinity
    }
    else {
      gapLeft = prevItem.rect.right - getEdgeThreshold(prevItem.rect.width)
      gapRight = nextItem.rect.left + getEdgeThreshold(nextItem.rect.width)
    }

    if (positionX >= gapLeft && positionX < gapRight) {
      return nextItem ? nextItem.index : prevItem!.index + 1
    }
  }

  return null // Cursor in middle of item (hysteresis)
}

export function createFreeformContext() {
  const itemElements = new Map<string, HTMLElement>()
  const dropZones = new Map<string, DropZoneEntry>()
  const containerElement = ref<HTMLElement | null>(null)
  const items = ref<FreeformItemData[]>([])
  const disabled = ref(false)
  const dropIndex = ref<number | null>(null)
  const dragSourceIndex = ref<number | null>(null)
  const currentDropTarget = ref<DropTarget | null>(null)
  const draggedItemSize = ref<{ width: number, height: number } | null>(null)

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
    dropIndex.value = null // Will be set in updateDropTarget when threshold is passed

    const startPos: Position = { x: event.clientX, y: event.clientY }

    // Measure the dragged item's size for placeholder
    const itemElement = itemElements.get(item.id)
    if (itemElement) {
      const rect = itemElement.getBoundingClientRect()
      draggedItemSize.value = { width: rect.width, height: rect.height }
    }

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

    // Check if cursor is inside any container
    let inContainer = false
    for (const [id, entry] of dropZones) {
      if (!entry.item) continue
      if (dragState.value.items.some(i => i.id === id)) continue // skip if dragging this container
      const rect = entry.element.getBoundingClientRect()
      if (event.clientX >= (rect.left + 20) && event.clientX <= (rect.right - 20)
        && event.clientY >= rect.top && event.clientY <= rect.bottom) {
        const accepted = entry.accept ? entry.accept(dragState.value.items) : true
        currentDropTarget.value = {
          item: entry.item,
          bounds: domRectToRect(rect),
          type: 'container',
          accepted,
        }
        inContainer = true
        break
      }
    }
    if (!inContainer && currentDropTarget.value) {
      currentDropTarget.value = null
    }

    const currentPosition: Position = { x: event.clientX, y: event.clientY }

    // Check threshold before starting visual drag
    if (!dragState.value.thresholdPassed) {
      const dx = Math.abs(currentPosition.x - dragState.value.startPosition.x)
      const dy = Math.abs(currentPosition.y - dragState.value.startPosition.y)

      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return

      dragState.value.thresholdPassed = true

      // Initialize dropIndex to source position before first updateDropTarget call
      if (dragSourceIndex.value !== null) {
        dropIndex.value = dragSourceIndex.value
      }
    }

    dragState.value.currentPosition = currentPosition

    // Calculate drop target based on mouse position
    updateDropTarget(currentPosition)
  }

  function registerDropZone(id: string, element: HTMLElement, item?: FreeformItemData, accept?: (items: FreeformItemData[]) => boolean) {
    dropZones.set(id, { id, element, item, accept })
  }

  function unregisterDropZone(id: string) {
    dropZones.delete(id)
  }

  function setDropTarget(item: FreeformItemData, accept?: (items: FreeformItemData[]) => boolean) {
    const entry = dropZones.get(item.id)
    if (!entry) return

    const accepted = accept
      ? accept(dragState.value.items)
      : true

    const rect = entry.element.getBoundingClientRect()

    currentDropTarget.value = {
      item,
      bounds: domRectToRect(rect),
      type: 'container',
      accepted,
    }

    // Set dropIndex to container position for smooth placeholder behavior
    const containerIndex = items.value.findIndex(i => i.id === item.id)
    if (containerIndex !== -1) {
      dropIndex.value = containerIndex
    }
  }

  function clearDropTarget() {
    currentDropTarget.value = null
  }

  /**
   * Calculate drop index from cursor position.
   * Used for both internal drags and external drops.
   * @param position Cursor position
   * @param excludeIds IDs to exclude from visible items (dragged items)
   * @returns The calculated drop index, or null if no change (hysteresis)
   */
  function calculateDropIndex(position: Position, excludeIds: Set<string>): number | null {
    const visibleItems = collectVisibleItems(itemElements, items.value, excludeIds)

    // Empty list - drop at position 0
    if (visibleItems.length === 0) {
      return 0
    }

    const rows = sortAndGroupByRow(visibleItems)

    // Find which row the cursor is on
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]!
      if (row.length === 0) continue

      const firstItem = row[0]!
      const nextRow = rows[rowIndex + 1]
      const rowTop = firstItem.rect.top
      const rowBottom = nextRow?.[0]?.rect.top ?? Infinity

      // Cursor is above this row -> insert before first item
      if (position.y < rowTop) {
        return firstItem.index
      }

      // Cursor is within this row
      if (position.y >= rowTop && position.y < rowBottom) {
        return findDropIndexInRow(row, position.x)
      }
    }

    // Cursor is below all rows -> insert at the end
    const lastRow = rows[rows.length - 1]
    if (lastRow?.length) {
      return lastRow[lastRow.length - 1]!.index + 1
    }

    return null
  }

  function isInsideContainer(position: Position): boolean {
    if (!containerElement.value) return true // No container = always inside (fallback)
    const rect = containerElement.value.getBoundingClientRect()
    return position.x >= rect.left && position.x <= rect.right
      && position.y >= rect.top && position.y <= rect.bottom
  }

  function updateDropTarget(position: Position) {
    // Container drop detection is handled via mouseenter/mouseleave in FreeformItem
    // If currently over a container, skip reorder logic
    if (currentDropTarget.value) return

    // Only update if cursor is inside the Freeform container
    if (!isInsideContainer(position)) return

    const draggedIds = new Set(dragState.value.items.map(i => i.id))
    const newIndex = calculateDropIndex(position, draggedIds)
    if (newIndex !== null) {
      dropIndex.value = newIndex
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

    // Reset sorting indices and drop target
    dragSourceIndex.value = null
    dropIndex.value = null
    currentDropTarget.value = null
    draggedItemSize.value = null
  }

  function getVisualIndex(itemId: string): number {
    const actualIndex = items.value.findIndex(i => i.id === itemId)
    if (actualIndex === -1) return -1

    // If not dragging, return actual index
    if (dragSourceIndex.value === null || dropIndex.value === null) {
      return actualIndex
    }

    // External drop (dragSourceIndex === -1): items coming from outside
    if (dragSourceIndex.value === -1) {
      // Items at or after dropIndex shift right to make room
      if (actualIndex >= dropIndex.value) {
        return actualIndex + 1 // Shift right by 1 (placeholder takes 1 slot)
      }
      return actualIndex
    }

    // Internal drag
    const draggedItems = dragState.value.items
    const draggedIds = new Set(draggedItems.map(i => i.id))

    // If this item is being dragged, it's hidden
    if (draggedIds.has(itemId)) return -1

    // Calculate compacted index (position without dragged items)
    const compactedIndex = getPlaceholderPosition(items.value, actualIndex, draggedIds)
    const placeholderPos = getPlaceholderPosition(items.value, dropIndex.value, draggedIds)

    // Items at or after placeholder shift right to make room
    return compactedIndex >= placeholderPos
      ? compactedIndex + draggedItems.length
      : compactedIndex
  }

  /**
   * Handle external drop - called when items from another Freeform are dragged over this one.
   * Sets up state for external drop visualization.
   */
  function handleExternalDrop(position: Position | null, incomingItems: FreeformItemData[]) {
    if (!position || incomingItems.length === 0) {
      // Clear external drop state
      if (!dragState.value.active) {
        dropIndex.value = null
        dragSourceIndex.value = null
        currentDropTarget.value = null
      }
      return { dropIndex: null, containerId: null }
    }

    // Mark as external drop
    dragSourceIndex.value = -1

    // Check for container drop first
    let foundContainer: FreeformItemData | null = null
    for (const [, entry] of dropZones) {
      if (!entry.item) continue
      const rect = entry.element.getBoundingClientRect()
      // 20px edge padding like internal drag
      if (position.x >= (rect.left + 20) && position.x <= (rect.right - 20)
        && position.y >= rect.top && position.y <= rect.bottom) {
        const accepted = entry.accept ? entry.accept(incomingItems) : true
        if (accepted) {
          foundContainer = entry.item
          currentDropTarget.value = {
            item: entry.item,
            bounds: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
            type: 'container',
            accepted: true,
          }
        }
        break
      }
    }

    if (!foundContainer) {
      currentDropTarget.value = null
    }

    // Only update drop index if cursor is inside the Freeform container
    if (!isInsideContainer(position)) {
      return {
        dropIndex: dropIndex.value,
        containerId: foundContainer?.id ?? null,
      }
    }

    // Calculate drop index (empty set = no items to exclude for external drops)
    const newIndex = calculateDropIndex(position, new Set())
    if (newIndex !== null) {
      dropIndex.value = newIndex
    }

    return {
      dropIndex: dropIndex.value,
      containerId: foundContainer?.id ?? null,
    }
  }

  const context: FreeformContext = {
    items,
    dragState,
    selectionState,
    disabled,
    dropIndex,
    dragSourceIndex,
    currentDropTarget,
    draggedItemSize,
    registerItem: (id, element) => itemElements.set(id, element),
    unregisterItem: id => itemElements.delete(id),
    registerDropZone,
    unregisterDropZone,
    setDropTarget,
    clearDropTarget,
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
    currentDropTarget,
    containerElement,
    itemElements,
    dropZones,
    handlePointerMove,
    handlePointerUp,
    handleExternalDrop,
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
