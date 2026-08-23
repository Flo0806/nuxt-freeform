import type { InjectionKey, Ref } from 'vue'

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Basic position with x/y coordinates
 */
export interface Position {
  x: number
  y: number
}

/**
 * Rectangular bounds (for selection box, collision detection, etc.)
 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Item type - file or folder/container
 */
export type ItemType = 'item' | 'container'

// =============================================================================
// ITEM TYPES
// =============================================================================

/**
 * Base interface for freeform items.
 * Users extend this with their own data via generics.
 *
 * @example
 * interface MyFile extends FreeformItemData {
 *   name: string
 *   size: number
 * }
 */
export interface FreeformItemData {
  id: string
  /** `'container'` turns the item into a drop target for other items */
  type?: ItemType
  /** Excludes the item from dragging and selection */
  disabled?: boolean
}

// =============================================================================
// DRAG TYPES
// =============================================================================

/**
 * Current drag operation state
 */
export interface DragState<T extends FreeformItemData = FreeformItemData> {
  /** Is a drag operation active? */
  active: boolean
  /** Items being dragged */
  items: T[]
  /** Starting position of the drag */
  startPosition: Position | null
  /** Current position during drag */
  currentPosition: Position | null
  /** Has the drag threshold been passed? (prevents accidental drags) */
  thresholdPassed: boolean
}

// =============================================================================
// DROP TYPES
// =============================================================================

/**
 * Type of drop target
 */
export type DropTargetType = 'reorder' | 'container' | 'zone' | null

/**
 * Drop target information
 */
export interface DropTarget<T extends FreeformItemData = FreeformItemData> {
  /** The container item that is the drop target */
  item: T
  /** Element bounds for hit testing */
  bounds: Rect
  /** Type of drop target */
  type: DropTargetType
  /** Whether the drop is accepted by the target */
  accepted: boolean
}

/**
 * Drop zone registry entry
 */
export interface DropZoneEntry<T extends FreeformItemData = FreeformItemData> {
  id: string
  element: HTMLElement
  item?: T
  accept?: (items: T[]) => boolean
}

/**
 * Drop event payload
 */
export interface DropEventPayload<T extends FreeformItemData = FreeformItemData> {
  /** Items that were dropped */
  items: T[]
  /** Target where items were dropped (null = dropped on canvas) */
  target: DropTarget<T> | null
  /** Final position */
  position: Position
  /** For sorting: original index */
  fromIndex?: number
  /** For sorting: new index */
  toIndex?: number
  /** Container item if dropped into a container */
  targetContainer?: T | null
  /** Zone ID if dropped to external drop zone */
  targetZoneId?: string
  /** Container ID if dropped into a container in external zone */
  targetContainerId?: string | null
  /** Type of drop operation */
  dropType: DropTargetType
}

// =============================================================================
// SELECTION TYPES
// =============================================================================

/**
 * Selection state
 */
export interface SelectionState<T extends FreeformItemData = FreeformItemData> {
  /** Currently selected items */
  items: T[]
  /** Is lasso selection active? */
  lassoActive: boolean
  /** Current lasso rectangle bounds */
  lassoRect: Rect | null
}

// =============================================================================
// CONTEXT TYPES (for provide/inject)
// =============================================================================

/**
 * Registered Freeform data for FreeformSelection
 */
export interface RegisteredFreeform<T extends FreeformItemData = FreeformItemData> {
  items: Ref<T[]>
  itemElements: Map<string, HTMLElement>
  disabled: Ref<boolean>
  selectionState: Ref<SelectionState<T>>
}

/**
 * Selection context provided by FreeformSelection
 */
export interface SelectionContext<T extends FreeformItemData = FreeformItemData> {
  registerFreeform: (ctx: RegisteredFreeform<T>) => void
  unregisterFreeform: () => void
}

/**
 * Injection key for selection context
 */
export const SELECTION_CONTEXT_KEY: InjectionKey<SelectionContext> = Symbol('freeform-selection-context')

// =============================================================================
// GRID TYPES (FreeformGrid component)
// =============================================================================

/**
 * Grid cell position
 */
export interface GridCell {
  x: number
  y: number
}

/**
 * Context provided by FreeformGrid to children
 */
export interface FreeformGridContext {
  columns: Ref<number>
  rows: Ref<number>
  hoveredCell: Ref<GridCell | null>
  isDragging: Ref<boolean>
}

/**
 * Injection key for FreeformGrid context
 */
export const FREEFORM_GRID_KEY: InjectionKey<FreeformGridContext> = Symbol('freeform-grid')
