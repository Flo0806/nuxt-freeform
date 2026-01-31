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
  type?: ItemType
  position?: Position
  disabled?: boolean
}

/**
 * Internal item state managed by the library
 */
export interface FreeformItemState {
  selected: boolean
  dragging: boolean
  dropTarget: boolean
}

/**
 * Complete item with user data + internal state
 */
export type FreeformItem<T extends FreeformItemData = FreeformItemData> = T & {
  __state: FreeformItemState
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
  /** Offset from item origin to mouse position */
  offset: Position | null
  /** Has the drag threshold been passed? (prevents accidental drags) */
  thresholdPassed: boolean
}

/**
 * Drag event payload
 */
export interface DragEventPayload<T extends FreeformItemData = FreeformItemData> {
  items: T[]
  position: Position
  event: PointerEvent
}

// =============================================================================
// DROP TYPES
// =============================================================================

/**
 * Drop target information
 */
export interface DropTarget<T extends FreeformItemData = FreeformItemData> {
  /** The container item that is the drop target */
  item: T
  /** Element bounds for hit testing */
  bounds: Rect
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

/**
 * Selection event payload
 */
export interface SelectionEventPayload<T extends FreeformItemData = FreeformItemData> {
  items: T[]
  /** Was shift held? (range select) */
  shift: boolean
  /** Was ctrl/cmd held? (toggle select) */
  ctrl: boolean
}

// =============================================================================
// COMPONENT PROPS & EMITS
// =============================================================================

/**
 * Freeform container props
 */
export interface FreeformProps<T extends FreeformItemData = FreeformItemData> {
  /** Items to display (v-model) */
  modelValue: T[]
  /** Enable grid-based sorting */
  sortable?: boolean
  /** Enable lasso selection */
  selectionEnabled?: boolean
  /** Enable drag & drop */
  dragEnabled?: boolean
  /** Minimum pixels to move before drag starts */
  dragThreshold?: number
  /** Disable all interactions */
  disabled?: boolean
}

/**
 * Freeform container emits
 */
export interface FreeformEmits<T extends FreeformItemData = FreeformItemData> {
  'update:modelValue': [items: T[]]
  'select': [payload: SelectionEventPayload<T>]
  'drag-start': [payload: DragEventPayload<T>]
  'drag-move': [payload: DragEventPayload<T>]
  'drag-end': [payload: DragEventPayload<T>]
  'drop': [payload: DropEventPayload<T>]
  'reorder': [fromIndex: number, toIndex: number]
}

/**
 * FreeformItem component props
 */
export interface FreeformItemProps<T extends FreeformItemData = FreeformItemData> {
  /** Item data */
  item: T
  /** Custom drag handle selector (if not set, whole item is draggable) */
  handle?: string
  /** Disable dragging for this item */
  disabled?: boolean
}

/**
 * FreeformDropZone component props
 */
export interface FreeformDropZoneProps<T extends FreeformItemData = FreeformItemData> {
  /** Associated item (for container-type items) */
  item?: T
  /** Accept function to validate drops */
  accept?: (items: T[]) => boolean
}

// =============================================================================
// SLOT PROPS (for customization)
// =============================================================================

/**
 * Props passed to item slot
 */
export interface ItemSlotProps<T extends FreeformItemData = FreeformItemData> {
  item: T
  selected: boolean
  dragging: boolean
  dropTarget: boolean
}

/**
 * Props passed to selection-box slot
 */
export interface SelectionBoxSlotProps {
  bounds: Rect
  itemCount: number
}

/**
 * Props passed to drag-ghost slot
 */
export interface DragGhostSlotProps<T extends FreeformItemData = FreeformItemData> {
  items: T[]
  count: number
  position: Position
}

/**
 * Props passed to drop-indicator slot
 */
export interface DropIndicatorSlotProps {
  valid: boolean
  bounds: Rect
}

// =============================================================================
// CONTEXT TYPES (for provide/inject)
// =============================================================================

/**
 * Freeform context provided to child components
 */
export interface FreeformContext<T extends FreeformItemData = FreeformItemData> {
  // State
  items: Readonly<T[]>
  dragState: Readonly<DragState<T>>
  selectionState: Readonly<SelectionState<T>>

  // Item registration (called by FreeformItem on mount)
  registerItem: (id: string, element: HTMLElement) => void
  unregisterItem: (id: string) => void

  // Drop zone registration
  registerDropZone: (id: string, element: HTMLElement, accept?: (items: T[]) => boolean) => void
  unregisterDropZone: (id: string) => void

  // Actions
  select: (item: T, options?: { shift?: boolean, ctrl?: boolean }) => void
  selectAll: () => void
  clearSelection: () => void
  startDrag: (items: T[], event: PointerEvent) => void
}

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
  selectionState: Ref<SelectionState<T>>
}

/**
 * Injection key for selection context
 */
export const SELECTION_CONTEXT_KEY: InjectionKey<SelectionContext> = Symbol('freeform-selection-context')

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Configuration options for the module
 */
export interface FreeformModuleOptions {
  /** Prefix for CSS custom properties */
  cssPrefix?: string
  /** Default drag threshold in pixels */
  defaultDragThreshold?: number
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Duration in ms */
  duration: number
  /** Easing function */
  easing: string
}
