<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import type { GridCell } from '../types'
import { FREEFORM_GRID_KEY } from '../types'

const props = withDefaults(defineProps<{
  columns?: number
  rows?: number
  gap?: string
}>(), {
  columns: 6,
  rows: 4,
  gap: '8px',
})

const hoveredCell = ref<GridCell | null>(null)
const isDragging = ref(false)

// Generate cells array
const cells = computed(() => {
  const result: GridCell[] = []
  for (let y = 0; y < props.rows; y++) {
    for (let x = 0; x < props.columns; x++) {
      result.push({ x, y })
    }
  }
  return result
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
  gridTemplateRows: `repeat(${props.rows}, 1fr)`,
  gap: props.gap,
}))

function onCellEnter(cell: GridCell) {
  if (isDragging.value) {
    hoveredCell.value = cell
  }
}

function onCellLeave() {
  // Don't clear immediately - wait for next cell enter
}

function onDragStart() {
  isDragging.value = true
}

function onDragEnd() {
  isDragging.value = false
  hoveredCell.value = null
}

// Provide context to children
provide(FREEFORM_GRID_KEY, {
  columns: computed(() => props.columns),
  rows: computed(() => props.rows),
  hoveredCell,
  isDragging,
})

defineExpose({
  hoveredCell,
  isDragging,
  onDragStart,
  onDragEnd,
})
</script>

<template>
  <div
    class="freeform-grid"
    :style="gridStyle"
  >
    <!-- Grid cells (background) -->
    <div
      v-for="cell in cells"
      :key="`${cell.x}-${cell.y}`"
      class="freeform-grid__cell"
      :class="{
        'freeform-grid__cell--hovered': hoveredCell?.x === cell.x && hoveredCell?.y === cell.y,
      }"
      :style="{
        gridColumn: cell.x + 1,
        gridRow: cell.y + 1,
      }"
      @mouseenter="onCellEnter(cell)"
      @mouseleave="onCellLeave"
    >
      <slot
        name="cell"
        :cell="cell"
        :is-hovered="hoveredCell?.x === cell.x && hoveredCell?.y === cell.y"
      />
    </div>

    <!-- Items layer (positioned above cells) -->
    <slot
      :hovered-cell="hoveredCell"
      :is-dragging="isDragging"
    />
  </div>
</template>

<style>
.freeform-grid {
  position: relative;
}

.freeform-grid__cell {
  min-height: 80px;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}
</style>
