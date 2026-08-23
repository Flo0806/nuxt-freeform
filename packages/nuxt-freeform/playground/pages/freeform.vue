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
  { id: '2', name: 'Pictures', gridX: 1, gridY: 0, icon: '🖼️', type: 'container' },
  { id: '3', name: 'Downloads', gridX: 2, gridY: 0, icon: '📥', type: 'container' },
  { id: '4', name: 'README.md', gridX: 0, gridY: 1, icon: '📝', type: 'item' },
  { id: '5', name: 'Photo.jpg', gridX: 3, gridY: 1, icon: '🏞️', type: 'item' },
  { id: '6', name: 'Music.mp3', gridX: 5, gridY: 2, icon: '🎵', type: 'item' },
  { id: '7', name: 'Notes.txt', gridX: 1, gridY: 1, icon: '📄', type: 'item' },
  { id: '8', name: 'Data.xlsx', gridX: 4, gridY: 3, icon: '📊', type: 'item' },
])

const gridRef = ref<{
  hoveredCell: GridCell | null
  onDragStart: () => void
  onDragEnd: () => void
} | null>(null)

const selected = ref<GridItem[]>([])
const eventLog = ref<string[]>([])

// Drag bookkeeping - the anchor is the item actually grabbed by the cursor
const anchorId = ref<string | null>(null)
const dragging = ref<GridItem[]>([])
const isDragging = ref(false)
const hoveredCell = ref<GridCell | null>(null)
const dropCell = ref<GridCell | null>(null)

function log(message: string) {
  const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  eventLog.value.unshift(`[${time}] ${message}`)
  if (eventLog.value.length > 15) eventLog.value.pop()
}

function cellsOf(list: GridItem[]): GridCell[] {
  return list.map(i => ({ x: i.gridX, y: i.gridY }))
}

function optionsFor(target: GridCell, group: GridItem[]) {
  const groupIds = new Set(group.map(i => i.id))
  const others = items.value.filter(i => !groupIds.has(i.id))
  return {
    dragged: group.map(i => ({ id: i.id, cell: { x: i.gridX, y: i.gridY } })),
    anchorId: anchorId.value ?? group[0]!.id,
    target,
    occupied: cellsOf(others),
    // Folders swallow the drop (move-into), so they are never a position
    blocked: cellsOf(others.filter(i => i.type === 'container')),
    columns: columns.value,
    rows: rows.value,
  }
}

/** Where a group would land if dropped on `target` */
function placementFor(target: GridCell, group: GridItem[]) {
  return resolveGridDrop(optionsFor(target, group))
}

/** Where it would land with nothing in the way - to tell dodging apart */
function wishesFor(target: GridCell, group: GridItem[]) {
  return resolveGridWishes(optionsFor(target, group))
}

const preview = computed(() => {
  if (!hoveredCell.value || dragging.value.length === 0) return new Map<string, GridCell>()
  return placementFor(hoveredCell.value, dragging.value)
})

const previewCells = computed(() =>
  new Set([...preview.value.values()].map(c => `${c.x},${c.y}`)),
)

/** Cells an item had to dodge to - shown in amber instead of blue */
const dodgedCells = computed(() => {
  if (!hoveredCell.value || preview.value.size === 0) return new Set<string>()

  const wishes = wishesFor(hoveredCell.value, dragging.value)
  const dodged = new Set<string>()

  for (const [id, actual] of preview.value) {
    const wish = wishes.get(id)
    if (wish && (actual.x !== wish.x || actual.y !== wish.y)) {
      dodged.add(`${actual.x},${actual.y}`)
    }
  }
  return dodged
})

function resetDrag() {
  dragging.value = []
  isDragging.value = false
  anchorId.value = null
  hoveredCell.value = null
  dropCell.value = null
}

function onSelect(selectedItems: FreeformItemData[]) {
  selected.value = selectedItems as GridItem[]
}

function onDragStart(dragged: FreeformItemData[]) {
  dragging.value = dragged as GridItem[]
  isDragging.value = true
  gridRef.value?.onDragStart()
  log(`Drag: ${dragging.value.map(i => i.name).join(', ')}`)
}

function onDragMove() {
  hoveredCell.value = gridRef.value?.hoveredCell ?? null
}

function onDragEnd() {
  // Keep the cell before the grid clears it - @drop fires after this
  dropCell.value = hoveredCell.value
  gridRef.value?.onDragEnd()
  hoveredCell.value = null
  // Release pointer events here: @drop does not fire for every gesture,
  // and a stuck flag would leave every icon click-dead.
  isDragging.value = false
}

function onDrop(payload: DropEventPayload) {
  // Drops onto a folder are handled by @drop-into
  if (payload.dropType !== 'reorder') return

  const group = payload.items as GridItem[]
  const target = dropCell.value

  if (!target || group.length === 0) {
    resetDrag()
    return
  }

  const placement = placementFor(target, group)
  const wishes = wishesFor(target, group)

  // No placement at all - the cell rejects positioning (e.g. a folder)
  if (placement.size === 0) {
    resetDrag()
    return
  }

  let dodged = 0

  for (const [id, cell] of placement) {
    const item = items.value.find(i => i.id === id)
    if (!item) continue

    const wish = wishes.get(id)
    if (wish && (cell.x !== wish.x || cell.y !== wish.y)) dodged++

    item.gridX = cell.x
    item.gridY = cell.y
  }

  const names = group.map(i => i.name).join(', ')
  log(`Moved ${names} → (${target.x}, ${target.y})${dodged ? ` · ${dodged} dodged` : ''}`)
  resetDrag()
}

function onDropInto(dropped: FreeformItemData[], container: FreeformItemData, accepted: boolean) {
  if (!accepted) {
    log(`Rejected by ${(container as GridItem).name}`)
    resetDrag()
    return
  }

  const folder = container as GridItem
  const ids = new Set(dropped.map(i => i.id))
  items.value = items.value.filter(i => !ids.has(i.id))
  log(`Into ${folder.name}: ${(dropped as GridItem[]).map(i => i.name).join(', ')}`)
  selected.value = []
  resetDrag()
}

/** Folders take files, but not other folders */
function acceptFiles(dragged: FreeformItemData[]) {
  return !(dragged as GridItem[]).some(i => i.type === 'container')
}

// Shrinking the raster must not strand items outside of it
watch([columns, rows], ([cols, rws], [prevCols, prevRows]) => {
  // A raster smaller than the item count has nowhere to put them - refuse it
  if (cols * rws < items.value.length) {
    columns.value = prevCols
    rows.value = prevRows
    log(`${cols}x${rws} is too small for ${items.value.length} items - kept ${prevCols}x${prevRows}`)
    return
  }

  const strays = items.value.filter(i => i.gridX >= columns.value || i.gridY >= rows.value)
  let pulled = 0

  for (const stray of strays) {
    const placement = resolveGridDrop({
      dragged: [{ id: stray.id, cell: { x: stray.gridX, y: stray.gridY } }],
      anchorId: stray.id,
      target: {
        x: Math.min(stray.gridX, columns.value - 1),
        y: Math.min(stray.gridY, rows.value - 1),
      },
      occupied: cellsOf(items.value.filter(i => i.id !== stray.id)),
      columns: columns.value,
      rows: rows.value,
    })
    const cell = placement.get(stray.id)
    if (cell) {
      stray.gridX = cell.x
      stray.gridY = cell.y
      pulled++
    }
  }

  if (pulled) log(`Raster resized · ${pulled} item(s) pulled back in`)
})
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <h1 class="text-2xl font-bold text-white mb-2">
      Freeform Grid Mode
    </h1>

    <div class="mb-6 text-sm text-white/60">
      <p class="mb-2">
        <span class="text-white/80 font-medium">Try it out:</span>
      </p>
      <ul class="list-disc list-inside space-y-1 ml-2">
        <li>Drag a rectangle across empty space to select several icons</li>
        <li><kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Ctrl</kbd>/<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Cmd</kbd>+Click toggles single icons</li>
        <li>Drag any selected icon - the others keep their relative spacing</li>
        <li>Taken cells never block: icons dodge to the next free one (amber preview)</li>
        <li>Drop onto a folder (📁) to move files into it</li>
      </ul>
    </div>

    <div class="mb-4 flex gap-4">
      <label class="flex items-center gap-2 text-white/80">
        Columns:
        <input
          v-model.number="columns"
          type="number"
          min="2"
          max="12"
          class="w-16 bg-white/10 text-white border border-white/20 rounded px-2 py-1"
        >
      </label>
      <label class="flex items-center gap-2 text-white/80">
        Rows:
        <input
          v-model.number="rows"
          type="number"
          min="2"
          max="8"
          class="w-16 bg-white/10 text-white border border-white/20 rounded px-2 py-1"
        >
      </label>
      <span class="flex items-center text-white/40 text-sm">
        {{ selected.length }} selected
      </span>
    </div>

    <div class="flex gap-6">
      <FreeformSelection
        class="flex-1"
        @select="onSelect"
      >
        <TheFreeform
          v-model="items"
          manual-reorder
          class="w-full"
          @drag-start="onDragStart"
          @drag-move="onDragMove"
          @drag-end="onDragEnd"
          @drop="onDrop"
          @drop-into="onDropInto"
        >
          <FreeformGrid
            ref="gridRef"
            :columns="columns"
            :rows="rows"
            gap="8px"
            class="w-full p-4 min-h-[500px] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10"
          >
            <template #cell="{ cell }">
              <div
                class="w-full h-full rounded-lg border-2 border-dashed transition-colors"
                :class="{
                  'border-white/10': !previewCells.has(`${cell.x},${cell.y}`),
                  'border-blue-500 bg-blue-500/20': previewCells.has(`${cell.x},${cell.y}`) && !dodgedCells.has(`${cell.x},${cell.y}`),
                  'border-amber-400 bg-amber-400/20': dodgedCells.has(`${cell.x},${cell.y}`),
                }"
              />
            </template>

            <FreeformItem
              v-for="item in items"
              :key="item.id"
              :item="item"
              :accept="item.type === 'container' ? acceptFiles : undefined"
              :class="{ 'pointer-events-none': isDragging }"
              :style="{
                gridColumn: item.gridX + 1,
                gridRow: item.gridY + 1,
                alignSelf: 'stretch',
                justifySelf: 'stretch',
                minWidth: 0,
                minHeight: 0,
                overflow: 'hidden',
              }"
            >
              <template #default="{ selected: isSelected, dropTarget, dropAccepted }">
                <div
                  class="h-full flex flex-col items-center justify-center p-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all"
                  :class="{
                    'bg-blue-500/40 ring-1 ring-blue-400': isSelected && !dropTarget,
                    'bg-green-500/40 ring-2 ring-green-400 scale-105': dropTarget && dropAccepted,
                    'bg-red-500/40 ring-2 ring-red-400': dropTarget && !dropAccepted,
                    'hover:bg-white/10': !isSelected && !dropTarget,
                  }"
                  @pointerdown="anchorId = item.id"
                >
                  <span class="text-4xl mb-1">{{ item.icon }}</span>
                  <span class="text-[11px] text-center text-white/90 leading-tight truncate w-full">
                    {{ item.name }}
                  </span>
                  <span class="text-[9px] text-white/40 mt-0.5">
                    ({{ item.gridX }}, {{ item.gridY }})
                  </span>
                </div>
              </template>
            </FreeformItem>
          </FreeformGrid>

          <!-- Ghost: entirely yours via slot -->
          <template #drag-ghost="{ items: ghostItems, count }">
            <div class="flex items-center gap-2 bg-slate-800/95 backdrop-blur rounded-lg px-3 py-2 shadow-2xl border border-white/20">
              <div class="flex -space-x-2">
                <span
                  v-for="(ghost, idx) in (ghostItems as GridItem[]).slice(0, 3)"
                  :key="ghost.id"
                  class="text-2xl"
                  :style="{ zIndex: 3 - idx }"
                >
                  {{ ghost.icon }}
                </span>
              </div>
              <span class="text-white text-sm">
                {{ count === 1 ? (ghostItems[0] as GridItem).name : `${count} items` }}
              </span>
            </div>
          </template>
        </TheFreeform>

        <!-- Lasso: entirely yours via slot -->
        <template #lasso="{ selectedCount }">
          <div class="relative w-full h-full border border-blue-400/50 bg-blue-500/10 rounded">
            <div
              v-if="selectedCount > 0"
              class="absolute -top-2 -right-2 min-w-5 h-5 px-1 flex items-center justify-center bg-blue-500 text-white text-xs font-bold rounded-full"
            >
              {{ selectedCount }}
            </div>
          </div>
        </template>
      </FreeformSelection>

      <!-- Event Log -->
      <div class="w-72 bg-slate-800 rounded-lg border border-white/10 overflow-hidden self-start">
        <div class="px-3 py-2 bg-slate-700 border-b border-white/10">
          <span class="text-white text-sm font-medium">Event Log</span>
        </div>
        <div class="h-[400px] overflow-y-auto p-2 font-mono text-[11px] text-white/70 space-y-1">
          <div
            v-for="(entry, idx) in eventLog"
            :key="idx"
            class="leading-tight"
          >
            {{ entry }}
          </div>
          <div
            v-if="eventLog.length === 0"
            class="text-white/30 italic"
          >
            Select and drag items to see events...
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 p-4 bg-slate-800 rounded-lg text-sm border border-white/10">
      <strong class="text-white">Item Positions:</strong>
      <pre class="mt-2 text-white/60 text-xs">{{ JSON.stringify(items.map(i => ({ name: i.name, x: i.gridX, y: i.gridY, type: i.type })), null, 2) }}</pre>
    </div>
  </div>
</template>
