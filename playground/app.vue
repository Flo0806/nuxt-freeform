<script setup lang="ts">
import type { FreeformItemData } from '../src/runtime/types'

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
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">
      nuxt-freeform Playground
    </h1>

    <p class="mb-4 text-gray-500">
      Selected: <span class="text-gray-800 font-medium">{{ selected.map(i => i.name).join(', ') || 'none' }}</span>
      <br>
      <small>Click to select, Ctrl/Cmd+Click for multi-select</small>
    </p>

    <TheFreeform
      v-model="items"
      class="grid grid-cols-4 gap-4"
      @select="onSelect"
    >
      <FreeformItem
        v-for="item in items"
        :key="item.id"
        :item="item"
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
    </TheFreeform>
  </div>
</template>
