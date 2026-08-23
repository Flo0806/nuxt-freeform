# Grid Desktop Example

A desktop-style icon grid: lasso selection, multi-item drag that keeps the
arrangement intact, and icons that dodge to a free cell instead of refusing the
drop — the way Finder, Explorer and GNOME behave.

## How it behaves

- The grabbed icon aims for the cell under the cursor; every other selected icon
  keeps its offset relative to it
- Near an edge the whole group is clamped back into the raster **as a block**, so
  the arrangement survives instead of collapsing into a corner
- A taken cell never blocks the drop — the icon moves to the next free cell
- Folders swallow the drop as a *move into*, so they are never a position

## Full example

```vue
<script setup lang="ts">
import type { FreeformItemData, DropEventPayload, GridCell } from 'nuxt-freeform'

interface GridItem extends FreeformItemData {
  name: string
  icon: string
  gridX: number
  gridY: number
  type: 'item' | 'container'
}

const columns = ref(6)
const rows = ref(4)

const items = ref<GridItem[]>([
  { id: '1', name: 'Documents', gridX: 0, gridY: 0, icon: '📁', type: 'container' },
  { id: '2', name: 'README.md', gridX: 0, gridY: 1, icon: '📝', type: 'item' },
  { id: '3', name: 'Photo.jpg', gridX: 3, gridY: 1, icon: '🏞️', type: 'item' },
])

const gridRef = ref<{
  hoveredCell: GridCell | null
  onDragStart: () => void
  onDragEnd: () => void
} | null>(null)

// The anchor is the icon actually grabbed by the cursor
const anchorId = ref<string | null>(null)
const dragging = ref<GridItem[]>([])
const isDragging = ref(false)
const hoveredCell = ref<GridCell | null>(null)
const dropCell = ref<GridCell | null>(null)

const cellsOf = (list: GridItem[]) => list.map(i => ({ x: i.gridX, y: i.gridY }))

function optionsFor(target: GridCell, group: GridItem[]) {
  const groupIds = new Set(group.map(i => i.id))
  const others = items.value.filter(i => !groupIds.has(i.id))
  return {
    dragged: group.map(i => ({ id: i.id, cell: { x: i.gridX, y: i.gridY } })),
    anchorId: anchorId.value ?? group[0]!.id,
    target,
    occupied: cellsOf(others),
    // Folders take the drop instead of a position
    blocked: cellsOf(others.filter(i => i.type === 'container')),
    columns: columns.value,
    rows: rows.value,
  }
}

// Live preview of where the selection would land
const preview = computed(() => {
  if (!hoveredCell.value || dragging.value.length === 0) return new Map<string, GridCell>()
  return resolveGridDrop(optionsFor(hoveredCell.value, dragging.value))
})

const previewCells = computed(() =>
  new Set([...preview.value.values()].map(c => `${c.x},${c.y}`)),
)

// Compare against the wishes to tell dodging apart from edge clamping
const dodgedCells = computed(() => {
  if (!hoveredCell.value || preview.value.size === 0) return new Set<string>()
  const wishes = resolveGridWishes(optionsFor(hoveredCell.value, dragging.value))
  const dodged = new Set<string>()
  for (const [id, actual] of preview.value) {
    const wish = wishes.get(id)
    if (wish && (actual.x !== wish.x || actual.y !== wish.y)) {
      dodged.add(`${actual.x},${actual.y}`)
    }
  }
  return dodged
})

function onDragStart(dragged: FreeformItemData[]) {
  dragging.value = dragged as GridItem[]
  isDragging.value = true
  gridRef.value?.onDragStart()
}

function onDragMove() {
  hoveredCell.value = gridRef.value?.hoveredCell ?? null
}

function onDragEnd() {
  // Keep the cell before the grid clears it - @drop fires after this
  dropCell.value = hoveredCell.value
  gridRef.value?.onDragEnd()
  hoveredCell.value = null
  isDragging.value = false
}

function onDrop(payload: DropEventPayload) {
  if (payload.dropType !== 'reorder') return // folders are handled by @drop-into

  const group = payload.items as GridItem[]
  const target = dropCell.value
  if (!target || group.length === 0) return

  const placement = resolveGridDrop(optionsFor(target, group))
  if (placement.size === 0) return // cell rejects positioning, e.g. a folder

  for (const [id, cell] of placement) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.gridX = cell.x
      item.gridY = cell.y
    }
  }
}

function onDropInto(dropped: FreeformItemData[], container: FreeformItemData) {
  const ids = new Set(dropped.map(i => i.id))
  items.value = items.value.filter(i => !ids.has(i.id))
}
</script>

<template>
  <FreeformSelection>
    <TheFreeform
      v-model="items"
      manual-reorder
      @drag-start="onDragStart"
      @drag-move="onDragMove"
      @drag-end="onDragEnd"
      @drop="onDrop"
      @drop-into="onDropInto"
    >
      <FreeformGrid ref="gridRef" :columns="columns" :rows="rows" gap="8px">
        <template #cell="{ cell }">
          <div
            class="w-full h-full rounded-lg border-2 border-dashed"
            :class="{
              'border-white/10': !previewCells.has(`${cell.x},${cell.y}`),
              'border-blue-500 bg-blue-500/20': previewCells.has(`${cell.x},${cell.y}`)
                && !dodgedCells.has(`${cell.x},${cell.y}`),
              'border-amber-400 bg-amber-400/20': dodgedCells.has(`${cell.x},${cell.y}`),
            }"
          />
        </template>

        <FreeformItem
          v-for="item in items"
          :key="item.id"
          :item="item"
          :class="{ 'pointer-events-none': isDragging }"
          :style="{
            gridColumn: item.gridX + 1,
            gridRow: item.gridY + 1,
            alignSelf: 'stretch',
            minWidth: 0,
            overflow: 'hidden',
          }"
        >
          <template #default="{ selected }">
            <div
              class="h-full flex flex-col items-center justify-center p-2 rounded-lg"
              :class="selected && 'bg-blue-500/40 ring-1 ring-blue-400'"
              @pointerdown="anchorId = item.id"
            >
              <span class="text-4xl">{{ item.icon }}</span>
              <span class="text-xs truncate w-full text-center">{{ item.name }}</span>
            </div>
          </template>
        </FreeformItem>
      </FreeformGrid>
    </TheFreeform>
  </FreeformSelection>
</template>
```

## Things worth copying

**Remember the anchor.** `@pointerdown` on the item content records which icon
was grabbed. Without it, a multi-item drag has no reference point and the whole
selection shifts to the wrong place.

**Release pointer events in `@drag-end`.** `pointer-events-none` on the items
lets the cells underneath receive `mouseenter`, which is how `hoveredCell` is
tracked. Reset the flag in `@drag-end` — not in `@drop`, because `@drop` does not
fire for every gesture and a stuck flag leaves every icon click-dead.

**Read `hoveredCell` before the grid clears it.** `@drag-end` fires *before*
`@drop`, so stash the cell there.

**Use `manual-reorder`.** The list-reordering logic of `TheFreeform` would fight
your grid positions otherwise.

::: warning Shrinking the raster
Nothing stops a user from making the raster smaller than the item count. Items
that find no free cell are left out of the result — check
`placement.size` / `placement.get(id)` before writing coordinates back, or refuse
the resize outright.
:::
