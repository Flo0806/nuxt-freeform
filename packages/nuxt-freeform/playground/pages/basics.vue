<script setup lang="ts">
import type { FreeformItemData } from 'nuxt-freeform'

interface MyItem extends FreeformItemData {
  name: string
  color: string
}

const items = ref<MyItem[]>([
  { id: '1', name: '1', color: '#ef4444' },
  { id: '2', name: '2', color: '#f97316' },
  { id: '3', name: '3', color: '#eab308' },
  { id: '4', name: '4', color: '#84cc16' },
  { id: '5', name: '5', color: '#22c55e' },
  { id: '6', name: '6', color: '#14b8a6' },
  { id: '7', name: '7', color: '#06b6d4' },
  { id: '8', name: '8', color: '#3b82f6' },
  { id: '9', name: '9', color: '#6366f1' },
  { id: '10', name: '10', color: '#8b5cf6' },
  { id: '11', name: '11', color: '#a855f7' },
  { id: '12', name: '12', color: '#ec4899' },
])

const selected = ref<MyItem[]>([])

function onSelect(selectedItems: FreeformItemData[]) {
  selected.value = selectedItems as MyItem[]
}
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <h1 class="text-2xl font-bold mb-2 text-white">
      Basics
    </h1>

    <div class="mb-6 text-sm text-white/60">
      <p class="mb-2">
        <span class="text-white/80 font-medium">Try it out:</span>
      </p>
      <ul class="list-disc list-inside space-y-1 ml-2">
        <li>Drag an item to reorder it in the grid</li>
        <li>Click to select, <kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Ctrl</kbd>/<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Cmd</kbd>+Click for multi-select</li>
        <li>Draw a selection rectangle (lasso) on empty space to select multiple items</li>
        <li>Drag selected items together to reposition them</li>
      </ul>
      <p class="mt-3">
        Selected: <span class="text-white font-medium">{{ selected.map(i => i.name).join(', ') || 'none' }}</span>
      </p>
    </div>

    <FreeformSelection @select="onSelect">
      <TheFreeform
        v-model="items"
        class="flex flex-wrap gap-4 p-10 bg-slate-800 rounded-xl"
      >
        <FreeformItem
          v-for="item in items"
          :key="item.id"
          :item="item"
          class="w-[calc(25%-12px)]"
        >
          <template #default="{ selected: isSelected }">
            <div
              class="p-4 rounded-lg text-white font-medium transition-all"
              :class="isSelected ? 'ring-4 ring-blue-500 scale-105' : ''"
              :style="{ backgroundColor: item.color }"
            >
              {{ item.name }}
            </div>
          </template>
        </FreeformItem>

        <FreeformPlaceholder
          v-slot="{ count }"
          class="w-[calc(25%-12px)]"
        >
          <div class="p-4 rounded-lg border-2 border-dashed border-white/30 bg-white/5">
            <span class="text-white/40 text-sm">{{ count }}</span>
          </div>
        </FreeformPlaceholder>

        <template #drag-ghost="{ items: dragItems, count }">
          <div
            class="w-40 p-4 rounded-lg text-white font-medium shadow-2xl opacity-80"
            :style="{ backgroundColor: (dragItems[0] as MyItem)?.color }"
          >
            {{ (dragItems[0] as MyItem)?.name }}
            <span
              v-if="count > 1"
              class="ml-2 px-2 py-0.5 bg-black/30 rounded text-xs"
            >
              +{{ count - 1 }}
            </span>
          </div>
        </template>
      </TheFreeform>

      <!-- Custom Lasso Style -->
      <template #lasso="{ selectedCount }">
        <div class="relative w-full h-full border-2 border-dashed border-blue-500 bg-blue-500/10 rounded">
          <span
            v-if="selectedCount > 0"
            class="absolute -top-6 left-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded"
          >
            {{ selectedCount }} selected
          </span>
        </div>
      </template>
    </FreeformSelection>
  </div>
</template>
