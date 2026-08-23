# FreeformGrid

A fixed raster of cells to place items on — the basis for desktop-style icon
grids, where every item sits in a cell instead of flowing in a list.

`FreeformGrid` draws the raster and tells you which cell the cursor is over.
It does **not** move anything by itself: you decide where items land, and
[`resolveGridDrop`](/api/#resolvegriddrop) does that maths for you if you want it.

## Usage

```vue
<FreeformGrid ref="gridRef" :columns="6" :rows="4" gap="8px">
  <template #cell="{ cell, isHovered }">
    <div class="rounded border-2 border-dashed" :class="isHovered && 'border-blue-500'" />
  </template>

  <FreeformItem
    v-for="item in items"
    :key="item.id"
    :item="item"
    :style="{ gridColumn: item.gridX + 1, gridRow: item.gridY + 1 }"
  >
    {{ item.name }}
  </FreeformItem>
</FreeformGrid>
```

Items are positioned with plain CSS grid — `gridColumn` and `gridRow` are
one-based, so a cell at `{ x: 0, y: 0 }` becomes `gridColumn: 1, gridRow: 1`.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `number` | `6` | Number of columns |
| `rows` | `number` | `4` | Number of rows |
| `gap` | `string` | `'8px'` | CSS gap between cells |

## Slots

### `cell`

Rendered once per cell, behind the items. Use it to draw the raster.

| Prop | Type | Description |
|------|------|-------------|
| `cell` | `{ x, y }` | Zero-based cell coordinates |
| `isHovered` | `boolean` | Cursor is over this cell during a drag |

### `default`

Your items, placed on top of the cells.

| Prop | Type | Description |
|------|------|-------------|
| `hoveredCell` | `{ x, y } \| null` | Cell under the cursor |
| `isDragging` | `boolean` | A drag is in progress |

## Exposed

Reach these through a template ref:

| Name | Type | Description |
|------|------|-------------|
| `hoveredCell` | `{ x, y } \| null` | Cell under the cursor |
| `isDragging` | `boolean` | Whether cell tracking is active |
| `onDragStart()` | `function` | Start tracking — call on `@drag-start` |
| `onDragEnd()` | `function` | Stop tracking — call on `@drag-end` |

Cell tracking only runs between `onDragStart()` and `onDragEnd()`, so hovering
without dragging does not light up the raster:

```vue
<TheFreeform
  v-model="items"
  manual-reorder
  @drag-start="gridRef?.onDragStart()"
  @drag-end="gridRef?.onDragEnd()"
>
```

::: tip Let items fill their cell
`FreeformItem` sets `align-self: flex-start` for list layouts. In a grid, give
it `alignSelf: 'stretch'` and `minWidth: 0` via `:style`, otherwise icons sit at
the top of their cell and long names blow up the column.
:::

## Combining with selection

`FreeformGrid` works inside `FreeformSelection`, so lasso and multi-select come
for free — see the [Grid Desktop example](/examples/grid-desktop).
