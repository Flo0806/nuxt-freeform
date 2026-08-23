# API Reference

Complete API documentation for nuxt-freeform.

## Types

### FreeformItemData

Base interface for all items:

```ts
interface FreeformItemData {
  id: string
  /** `'container'` turns the item into a drop target for other items */
  type?: 'item' | 'container'
  /** Excludes the item from dragging and lasso selection */
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
  thresholdPassed: boolean
}
```

### GridCell

Zero-based cell coordinates in a `FreeformGrid`:

```ts
interface GridCell {
  x: number
  y: number
}
```

### GridPlacement

An item taking part in a grid drag, with the cell it currently occupies:

```ts
interface GridPlacement {
  id: string
  cell: GridCell
}
```

### ResolveGridDropOptions

```ts
interface ResolveGridDropOptions {
  /** Items being dragged, with the cells they held before the drag */
  dragged: GridPlacement[]
  /** Id of the item under the cursor - defines the anchor of the group */
  anchorId: string
  /** Cell the anchor should land on */
  target: GridCell
  /** Cells taken by items that are NOT being dragged */
  occupied: Iterable<GridCell>
  /** Cells that must never receive a placement, e.g. folders */
  blocked?: Iterable<GridCell>
  columns: number
  rows: number
}
```

## Components

### TheFreeform

Main container component.

**Props:**
- `modelValue: FreeformItemData[]` (required)
- `disabled?: boolean`
- `manualReorder?: boolean`
- `dropZoneId?: string`

**Events:**
- `update:modelValue`
- `select`
- `drag-start`
- `drag-move`
- `drag-end`
- `drop` - every completed drop, with `DropEventPayload`
- `drop-into`
- `drop-to-zone`
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

### FreeformGrid

Fixed raster of cells — see [FreeformGrid](/components/freeform-grid).

**Props:**
- `columns?: number` (default `6`)
- `rows?: number` (default `4`)
- `gap?: string` (default `'8px'`)

**Slots:**
- `cell` - Rendered per cell, behind the items
- `default` - The items themselves

**Exposed:** `hoveredCell`, `isDragging`, `onDragStart()`, `onDragEnd()`

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

## Grid helpers

Optional maths for grid layouts. Auto-imported, and also importable from the
package entry:

```ts
import { resolveGridDrop, resolveGridWishes } from 'nuxt-freeform'
```

You never have to use them — they are a tool, not a rule.

### resolveGridDrop

Works out where a group of dragged items should land, the way desktop file
managers do it.

```ts
function resolveGridDrop(options: ResolveGridDropOptions): Map<string, GridCell>
```

- The grabbed item aims for `target`; every other item keeps its offset from it
- The group is clamped into the raster **as a block**, so the arrangement survives
  at the edges — near an edge even the grabbed item can end up beside `target`
- Items whose cell is taken move to the next free one; the drop is never rejected
- Items whose wished-for cell is free win it before dodging items are placed, so
  a dodger cannot displace an item that already fits
- Dropping on a `blocked` cell yields an **empty map** — the drop means something
  else there (a folder swallowing it), so leave the items alone
- If the raster is full, an item keeps its old cell; if that cell is outside the
  raster too, the item is **left out of the result** entirely

```ts
const placement = resolveGridDrop({
  dragged: [{ id: 'a', cell: { x: 0, y: 0 } }],
  anchorId: 'a',
  target: { x: 2, y: 2 },
  occupied: [{ x: 2, y: 2 }],
  columns: 6,
  rows: 4,
})

placement.get('a') // { x: 3, y: 2 } - dodged, because (2,2) was taken
```

Always check what came back before writing coordinates:

```ts
for (const [id, cell] of placement) {
  const item = items.value.find(i => i.id === id)
  if (item) {
    item.gridX = cell.x
    item.gridY = cell.y
  }
}
```

### resolveGridWishes

The cells the group would take if nothing were in the way — target plus offsets,
clamped into the raster, but without collision handling.

```ts
function resolveGridWishes(options: ResolveGridDropOptions): Map<string, GridCell>
```

Compare it against `resolveGridDrop` to tell **real dodging** apart from edge
clamping. Recomputing the wish yourself is easy to get wrong: the clamp shifts
the whole block, and the anchor's own coordinates change as you write results back.

```ts
const wishes = resolveGridWishes(options)
const placement = resolveGridDrop(options)

for (const [id, actual] of placement) {
  const wish = wishes.get(id)
  const dodged = wish && (actual.x !== wish.x || actual.y !== wish.y)
}
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
