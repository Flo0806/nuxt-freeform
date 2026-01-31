<script setup lang="ts">
import type { FreeformItemData } from '../../src/runtime/types'

interface FileItem extends FreeformItemData {
  name: string
  type: 'item' | 'container'
  parentId: string | null
  icon?: string
}

const items = ref<FileItem[]>([
  { id: 'folder-1', name: 'Documents', type: 'container', parentId: null, icon: '📁' },
  { id: 'folder-2', name: 'Pictures', type: 'container', parentId: null, icon: '🖼️' },
  { id: 'folder-3', name: 'Downloads', type: 'container', parentId: null, icon: '📥' },
  { id: 'folder-4', name: 'Projects', type: 'container', parentId: null, icon: '💼' },
  { id: 'file-1', name: 'README.md', type: 'item', parentId: null, icon: '📝' },
  { id: 'file-2', name: 'notes.txt', type: 'item', parentId: null, icon: '📄' },
  { id: 'file-3', name: 'vacation-photo-2024.jpg', type: 'item', parentId: null, icon: '🏞️' },
  { id: 'file-4', name: 'config.json', type: 'item', parentId: null, icon: '⚙️' },
  { id: 'file-5', name: 'presentation.pptx', type: 'item', parentId: null, icon: '📊' },
  { id: 'file-6', name: 'budget-report-final-v2.xlsx', type: 'item', parentId: null, icon: '📈' },
  { id: 'file-7', name: 'movie.mp4', type: 'item', parentId: null, icon: '🎬' },
  { id: 'file-8', name: 'song.mp3', type: 'item', parentId: null, icon: '🎵' },
])

const selected = ref<FileItem[]>([])

function onSelect(selectedItems: FreeformItemData[]) {
  selected.value = selectedItems as FileItem[]
}

function onDropInto(droppedItems: FreeformItemData[], container: FreeformItemData, accepted: boolean) {
  if (!accepted) return

  const containerItem = container as FileItem
  const dropped = droppedItems as FileItem[]

  dropped.forEach((item) => {
    const found = items.value.find(i => i.id === item.id)
    if (found) {
      found.parentId = containerItem.id
    }
  })

  console.log(`Moved ${dropped.map(i => i.name).join(', ')} to ${containerItem.name}`)
}

function acceptAll() {
  return true
}

const rootItems = computed(() =>
  items.value.filter(i => i.parentId === null),
)

function getChildren(containerId: string) {
  return items.value.filter(i => i.parentId === containerId)
}
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <h1 class="text-2xl font-bold mb-2 text-white">
      Files & Folders
    </h1>

    <div class="mb-6 text-sm text-white/60">
      <p class="mb-2">
        <span class="text-white/80 font-medium">Try it out:</span>
      </p>
      <ul class="list-disc list-inside space-y-1 ml-2">
        <li>Drag a file onto a folder to move it inside</li>
        <li>Select multiple files with <kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Ctrl</kbd>/<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Cmd</kbd>+Click or lasso selection</li>
        <li>Drag multiple selected files into a folder at once</li>
        <li>Folders show visual feedback: green = accepted, red = rejected</li>
      </ul>
      <p class="mt-3">
        Selected: <span class="text-white font-medium">{{ selected.map(i => i.name).join(', ') || 'none' }}</span>
      </p>
    </div>

    <FreeformSelection @select="onSelect">
      <TheFreeform
        v-model="items"
        class="flex flex-wrap content-start gap-2 p-4 min-h-[500px] rounded-lg bg-black/20 backdrop-blur-sm"
        @drop-into="onDropInto"
      >
        <FreeformItem
          v-for="item in rootItems"
          :key="item.id"
          :item="item"
          :accept="item.type === 'container' ? acceptAll : undefined"
          class="w-24"
        >
          <template #default="{ selected: isSelected, dropTarget, dropAccepted }">
            <div
              class="flex flex-col items-center p-2 rounded-lg cursor-default transition-all"
              :class="{
                'bg-blue-500/50': isSelected && !dropTarget,
                'bg-green-500/50 ring-2 ring-green-400': dropTarget && dropAccepted,
                'bg-red-500/50 ring-2 ring-red-400': dropTarget && !dropAccepted,
                'hover:bg-white/10': !isSelected && !dropTarget,
              }"
            >
              <!-- Icon -->
              <div
                class="w-16 h-16 flex items-center justify-center text-5xl mb-1 transition-transform"
                :class="{ 'scale-110': isSelected }"
              >
                {{ item.icon }}
              </div>

              <!-- Name -->
              <span
                class="text-xs text-center text-white leading-tight w-full px-1 line-clamp-2"
                :class="{ 'font-medium': isSelected }"
                :title="item.name"
              >
                {{ item.name }}
              </span>

              <!-- Item count for folders -->
              <span
                v-if="item.type === 'container'"
                class="text-[10px] text-white/50 mt-0.5"
              >
                {{ getChildren(item.id).length }} items
              </span>
            </div>
          </template>
        </FreeformItem>

        <!-- Placeholder -->
        <FreeformPlaceholder
          v-slot="{ count }"
          class="w-24"
        >
          <div class="flex flex-col items-center p-2 rounded-lg border-2 border-dashed border-white/30 bg-white/5 h-full min-h-[100px] justify-center">
            <span class="text-white/50 text-xs text-center">
              {{ count > 1 ? `${count} items` : 'Drop' }}
            </span>
          </div>
        </FreeformPlaceholder>

        <!-- Drag Ghost -->
        <template #drag-ghost="{ items: draggedItems, count }">
          <div class="flex flex-col items-center bg-gray-900/90 backdrop-blur rounded-lg p-3 shadow-2xl border border-white/20">
            <div class="flex -space-x-4">
              <div
                v-for="(dragItem, idx) in (draggedItems as FileItem[]).slice(0, 3)"
                :key="dragItem.id"
                class="w-12 h-12 flex items-center justify-center text-3xl bg-gray-800 rounded-lg border border-white/10"
                :style="{ zIndex: 3 - idx }"
              >
                {{ dragItem.icon }}
              </div>
            </div>
            <span class="text-white text-xs mt-2 font-medium">
              {{ count }} {{ count === 1 ? 'item' : 'items' }}
            </span>
          </div>
        </template>
      </TheFreeform>

      <template #lasso="{ selectedCount }">
        <div class="relative w-full h-full border border-blue-400 bg-blue-500/20 rounded">
          <span
            v-if="selectedCount > 0"
            class="absolute -top-5 left-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded shadow"
          >
            {{ selectedCount }}
          </span>
        </div>
      </template>
    </FreeformSelection>
  </div>
</template>

<style>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
