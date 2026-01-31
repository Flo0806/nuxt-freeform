# API Reference

Complete API documentation for nuxt-freeform.

## Types

### FreeformItemData

Base interface for all items:

```ts
interface FreeformItemData {
  id: string
  type?: 'item' | 'container'
  position?: { x: number, y: number }
  disabled?: boolean
}
```

### DropEventPayload

Payload for drop events:

```ts
interface DropEventPayload<T extends FreeformItemData> {
  items: T[]
  target: DropTarget<T> | null
  position: { x: number, y: number }
  fromIndex?: number
  toIndex?: number
  targetContainer?: T | null
  dropType: 'reorder' | 'container' | 'zone' | null
}
```

### SelectionState

Current selection state:

```ts
interface SelectionState<T extends FreeformItemData> {
  items: T[]
  lassoActive: boolean
  lassoRect: Rect | null
}
```

### DragState

Current drag operation state:

```ts
interface DragState<T extends FreeformItemData> {
  active: boolean
  items: T[]
  startPosition: Position | null
  currentPosition: Position | null
  offset: Position | null
  thresholdPassed: boolean
}
```

## Components

### TheFreeform

Main container component.

**Props:**
- `modelValue: FreeformItemData[]` (required)
- `disabled?: boolean`
- `manualReorder?: boolean`

**Events:**
- `update:modelValue`
- `select`
- `drag-start`
- `drag-move`
- `drag-end`
- `drop-into`
- `reorder`

**Slots:**
- `default` - Main content
- `drag-ghost` - Custom drag ghost

### FreeformItem

Individual draggable item.

**Props:**
- `item: FreeformItemData` (required)
- `disabled?: boolean`
- `asDropZone?: boolean`
- `accept?: (items) => boolean`

**Slots:**
- `default` - Custom item content

### FreeformPlaceholder

Drop position indicator.

**Slots:**
- `default` - Custom placeholder content

### FreeformSelection

Lasso selection wrapper.

**Events:**
- `select`

**Slots:**
- `default` - Content to wrap
- `lasso` - Custom lasso rectangle

## Composables

### useAutoScroll

Auto-scroll when dragging near container edges:

```ts
const scrollContainer = ref<HTMLElement | null>(null)
const { onDragMove, stop } = useAutoScroll(scrollContainer)
```

### useFreeformContext

Access the freeform context from child components:

```ts
const context = useFreeformContext()
```

## CSS Variables

```css
.freeform-container {
  --freeform-color-primary: #3b82f6;
  --freeform-color-primary-light: #dbeafe;
  --freeform-color-success: #22c55e;
  --freeform-color-success-light: #dcfce7;
  --freeform-color-danger: #ef4444;
  --freeform-color-danger-light: #fee2e2;
  --freeform-color-neutral: #f3f4f6;
  --freeform-color-text: #374151;
}
```
