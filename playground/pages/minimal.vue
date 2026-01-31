<script setup lang="ts">
import type { FreeformItemData } from '../../src/runtime/types'

// Minimal data - just id and type
const items = ref<FreeformItemData[]>([
  { id: 'Folder A', type: 'container' },
  { id: 'Folder B', type: 'container' },
  { id: 'Item 1' },
  { id: 'Item 2' },
  { id: 'Item 3' },
  { id: 'Item 4' },
])

// Handle drop into folder - this is the only event you need to handle!
// The library handles reordering automatically via v-model.
function onDropInto(droppedItems: FreeformItemData[], container: FreeformItemData, accepted: boolean) {
  if (!accepted) return

  // Remove items from the list (they're now "inside" the folder)
  // In a real app, you'd set item.parentId = container.id instead
  items.value = items.value.filter(i => !droppedItems.some(d => d.id === i.id))

  console.log(`Moved ${droppedItems.map(i => i.id).join(', ')} into "${container.id}"`)
}
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <h1 class="text-2xl font-bold text-white mb-2">
      Minimal Example
    </h1>

    <div class="mb-6 text-sm text-white/60">
      <p class="mb-2">
        <span class="text-white/80 font-medium">Zero configuration needed:</span>
      </p>
      <ul class="list-disc list-inside space-y-1 ml-2">
        <li>Default ghost shows item count</li>
        <li>Default placeholder shows drop position</li>
        <li>Default item styling with selection/drop states</li>
        <li>Drag to reorder, drop into folders</li>
        <li>All with ~15 lines of code!</li>
      </ul>
    </div>

    <!-- That's ALL you need! -->
    <TheFreeform
      v-model="items"
      class="flex flex-wrap gap-3 p-6 rounded-xl bg-slate-800 border border-white/10 min-h-[300px]"
      @drop-into="onDropInto"
    >
      <FreeformItem
        v-for="item in items"
        :key="item.id"
        :item="item"
      />
      <FreeformPlaceholder />
    </TheFreeform>

    <div class="mt-6 p-4 bg-slate-800 rounded-lg border border-white/10">
      <p class="text-white/60 text-sm mb-2">
        Current items:
      </p>
      <pre class="text-white/80 text-xs">{{ JSON.stringify(items.map(i => i.id), null, 2) }}</pre>
    </div>
  </div>
</template>
