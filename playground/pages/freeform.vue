<script setup lang="ts">
import { ref } from 'vue'

interface GridItem {
  id: string
  name: string
  gridX: number
  gridY: number
  icon: string
  type?: 'container'
}

const gridRef = ref<{ hoveredCell: { x: number, y: number } | null, onDragStart: () => void, onDragEnd: () => void } | null>(null)

const items = ref<GridItem[]>([
  { id: '1', name: 'Documents', gridX: 0, gridY: 0, icon: '📁', type: 'container' },
  { id: '2', name: 'Pictures', gridX: 1, gridY: 0, icon: '🖼️', type: 'container' },
  { id: '3', name: 'Downloads', gridX: 2, gridY: 0, icon: '📥', type: 'container' },
  { id: '4', name: 'README.md', gridX: 0, gridY: 1, icon: '📝' },
  { id: '5', name: 'Photo.jpg', gridX: 3, gridY: 1, icon: '🏞️' },
  { id: '6', name: 'Music.mp3', gridX: 5, gridY: 2, icon: '🎵' },
])

const eventLog = ref<string[]>([])

function log(message: string) {
  const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  eventLog.value.unshift(`[${time}] ${message}`)
  if (eventLog.value.length > 15) eventLog.value.pop()
}

const draggedItem = ref<GridItem | null>(null)
const ghostPosition = ref<{ x: number, y: number } | null>(null)
const hoveredContainer = ref<GridItem | null>(null)

// Check if cell is occupied (excluding dragged item)
function isCellOccupied(x: number, y: number): boolean {
  return items.value.some(item =>
    item.gridX === x && item.gridY === y && item.id !== draggedItem.value?.id,
  )
}

// Get item at position (for container detection)
function getItemAt(x: number, y: number): GridItem | undefined {
  return items.value.find(item =>
    item.gridX === x && item.gridY === y && item.id !== draggedItem.value?.id,
  )
}

function onPointerDown(item: GridItem, event: PointerEvent) {
  event.preventDefault()
  draggedItem.value = item
  ghostPosition.value = { x: event.clientX, y: event.clientY }
  gridRef.value?.onDragStart()

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event: PointerEvent) {
  // Update ghost position
  ghostPosition.value = { x: event.clientX, y: event.clientY }

  // Check for container hover
  if (gridRef.value?.hoveredCell && draggedItem.value) {
    const { x, y } = gridRef.value.hoveredCell
    const itemAtCell = getItemAt(x, y)
    if (itemAtCell?.type === 'container') {
      hoveredContainer.value = itemAtCell
    }
    else {
      hoveredContainer.value = null
    }
  }
  else {
    hoveredContainer.value = null
  }
}

function onPointerUp() {
  if (draggedItem.value && gridRef.value?.hoveredCell) {
    const { x, y } = gridRef.value.hoveredCell
    const containerAtCell = getItemAt(x, y)

    // Drop into container
    if (containerAtCell?.type === 'container') {
      log(`Dropped "${draggedItem.value.name}" into ${containerAtCell.name}`)
      // Remove item (simulate move into folder)
      items.value = items.value.filter(i => i.id !== draggedItem.value!.id)
    }
    // Move to empty cell
    else if (!isCellOccupied(x, y)) {
      log(`Moved "${draggedItem.value.name}" to (${x}, ${y})`)
      draggedItem.value.gridX = x
      draggedItem.value.gridY = y
    }
    else {
      log(`Blocked: Cell (${x}, ${y}) is occupied`)
    }
  }

  draggedItem.value = null
  ghostPosition.value = null
  hoveredContainer.value = null
  gridRef.value?.onDragEnd()

  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
}

const columns = ref(6)
const rows = ref(4)
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
        <li>Drag items to any grid cell - they snap to position</li>
        <li>Drop files into folders (📁) - they get "moved"</li>
        <li>Drop on occupied cells is blocked (red highlight)</li>
        <li>Ghost follows cursor while dragging</li>
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
    </div>

    <div class="flex gap-6">
      <!-- Desktop Grid -->
      <div class="flex-1">
        <FreeformGrid
          ref="gridRef"
          :columns="columns"
          :rows="rows"
          gap="8px"
          class="p-4 min-h-[500px] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10"
        >
          <template #cell="{ cell, isHovered }">
            <div
              class="w-full h-full rounded-lg border-2 border-dashed transition-colors"
              :class="{
                'border-white/10': !isHovered || getItemAt(cell.x, cell.y)?.type === 'container',
                'border-blue-500 bg-blue-500/20': isHovered && !isCellOccupied(cell.x, cell.y),
                'border-red-500 bg-red-500/20': isHovered && isCellOccupied(cell.x, cell.y) && getItemAt(cell.x, cell.y)?.type !== 'container',
              }"
            />
          </template>

          <!-- Items -->
          <div
            v-for="item in items"
            :key="item.id"
            class="flex flex-col items-center justify-center p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all select-none place-self-stretch"
            :class="{
              'opacity-30 pointer-events-none': draggedItem?.id === item.id,
              'pointer-events-none': draggedItem && draggedItem.id !== item.id,
              'hover:bg-white/10': !draggedItem,
              'ring-2 ring-green-400 bg-green-500/20 scale-105': hoveredContainer?.id === item.id,
            }"
            :style="{
              gridColumn: item.gridX + 1,
              gridRow: item.gridY + 1,
            }"
            @pointerdown="onPointerDown(item, $event)"
          >
            <span class="text-4xl mb-1">{{ item.icon }}</span>
            <span class="text-[11px] text-center text-white/90 leading-tight truncate w-full">
              {{ item.name }}
            </span>
            <span class="text-[9px] text-white/40 mt-0.5">
              ({{ item.gridX }}, {{ item.gridY }})
            </span>
          </div>
        </FreeformGrid>
      </div>

      <!-- Event Log -->
      <div class="w-72 bg-slate-800 rounded-lg border border-white/10 overflow-hidden">
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
            Drag items to see events...
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 p-4 bg-slate-800 rounded-lg text-sm border border-white/10">
      <strong class="text-white">Item Positions:</strong>
      <pre class="mt-2 text-white/60 text-xs">{{ JSON.stringify(items.map(i => ({ id: i.id, name: i.name, x: i.gridX, y: i.gridY, type: i.type })), null, 2) }}</pre>
    </div>

    <!-- Drag Ghost (teleported to body) -->
    <Teleport to="body">
      <div
        v-if="draggedItem && ghostPosition"
        class="fixed pointer-events-none z-[9999] flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/90 backdrop-blur shadow-2xl border border-white/20"
        :style="{
          left: `${ghostPosition.x}px`,
          top: `${ghostPosition.y}px`,
          transform: 'translate(-50%, -50%)',
        }"
      >
        <span class="text-3xl mb-1">{{ draggedItem.icon }}</span>
        <span class="text-[10px] text-white/80">{{ draggedItem.name }}</span>
      </div>
    </Teleport>
  </div>
</template>
