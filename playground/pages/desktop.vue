<script setup lang="ts">
import type { FreeformItemData, DropEventPayload } from '../../src/runtime/types'

interface FileItem extends FreeformItemData {
  name: string
  type: 'item' | 'container'
  parentId: string | null
  icon: string
}

const items = ref<FileItem[]>([
  // System folders
  { id: 'trash', name: 'Trash', type: 'container', parentId: null, icon: '🗑️' },
  { id: 'documents', name: 'Documents', type: 'container', parentId: null, icon: '📁' },
  { id: 'pictures', name: 'Pictures', type: 'container', parentId: null, icon: '🖼️' },
  { id: 'downloads', name: 'Downloads', type: 'container', parentId: null, icon: '📥' },
  // Files
  { id: 'file-1', name: 'Report.docx', type: 'item', parentId: null, icon: '📝' },
  { id: 'file-2', name: 'Photo.jpg', type: 'item', parentId: null, icon: '🏞️' },
  { id: 'file-3', name: 'Music.mp3', type: 'item', parentId: null, icon: '🎵' },
  { id: 'file-4', name: 'Video.mp4', type: 'item', parentId: null, icon: '🎬' },
  { id: 'file-5', name: 'Data.xlsx', type: 'item', parentId: null, icon: '📊' },
  { id: 'file-6', name: 'Notes.txt', type: 'item', parentId: null, icon: '📄' },
])

const selected = ref<FileItem[]>([])
const eventLog = ref<string[]>([])
const showTrashConfirm = ref(false)
const showTrashWarning = ref(false)
const pendingTrashItems = ref<FileItem[]>([])

// Navigation state
const currentFolderId = ref<string | null>(null)

const currentFolder = computed(() =>
  currentFolderId.value ? items.value.find(i => i.id === currentFolderId.value) : null,
)

// Build breadcrumb path
const breadcrumbs = computed(() => {
  const path: FileItem[] = []
  let folderId = currentFolderId.value
  while (folderId) {
    const folder = items.value.find(i => i.id === folderId)
    if (folder) {
      path.unshift(folder)
      folderId = folder.parentId
    }
    else {
      break
    }
  }
  return path
})

function openFolder(folder: FileItem) {
  currentFolderId.value = folder.id
  selected.value = []
  log(`Opened folder: ${folder.name}`)
}

function goToRoot() {
  currentFolderId.value = null
  selected.value = []
  log('Navigated to root')
}

function goToFolder(folderId: string | null) {
  currentFolderId.value = folderId
  selected.value = []
  log(folderId ? `Navigated to: ${items.value.find(i => i.id === folderId)?.name}` : 'Navigated to root')
}

function onItemDblClick(item: FileItem) {
  if (item.type === 'container') {
    openFolder(item)
  }
}

function log(message: string) {
  const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  eventLog.value.unshift(`[${time}] ${message}`)
  if (eventLog.value.length > 20) eventLog.value.pop()
}

function onSelect(selectedItems: FreeformItemData[]) {
  selected.value = selectedItems as FileItem[]
  if (selectedItems.length > 0) {
    log(`Selected: ${selectedItems.map(i => (i as FileItem).name).join(', ')}`)
  }
}

function onDragStart(draggedItems: FreeformItemData[]) {
  log(`Drag started: ${draggedItems.map(i => (i as FileItem).name).join(', ')}`)
}

function onDragEnd(draggedItems: FreeformItemData[]) {
  log(`Drag ended: ${draggedItems.map(i => (i as FileItem).name).join(', ')}`)
}

function onDropInto(droppedItems: FreeformItemData[], container: FreeformItemData, accepted: boolean) {
  const containerItem = container as FileItem
  const dropped = droppedItems as FileItem[]

  // Rejected by accept function (e.g., trying to move Trash)
  if (!accepted) {
    if (dropped.some(item => item.id === 'trash')) {
      showTrashWarning.value = true
      log(`Warning: Cannot move Trash into ${containerItem.name}`)
    }
    return
  }

  // Trash: Ask for confirmation
  if (containerItem.id === 'trash') {
    pendingTrashItems.value = dropped
    showTrashConfirm.value = true
    log(`Trash confirmation requested for: ${dropped.map(i => i.name).join(', ')}`)
    return
  }

  // Other folders: Move directly
  dropped.forEach((item) => {
    const found = items.value.find(i => i.id === item.id)
    if (found) {
      found.parentId = containerItem.id
    }
  })
  log(`Moved to ${containerItem.name}: ${dropped.map(i => i.name).join(', ')}`)
}

function confirmTrash() {
  pendingTrashItems.value.forEach((item) => {
    const found = items.value.find(i => i.id === item.id)
    if (found) {
      found.parentId = 'trash'
    }
  })
  log(`Trashed: ${pendingTrashItems.value.map(i => i.name).join(', ')}`)
  showTrashConfirm.value = false
  pendingTrashItems.value = []
}

function cancelTrash() {
  log(`Trash cancelled for: ${pendingTrashItems.value.map(i => i.name).join(', ')}`)
  showTrashConfirm.value = false
  pendingTrashItems.value = []
}

function onReorder(fromIndex: number, toIndex: number) {
  log(`Reorder: Position ${fromIndex} → ${toIndex}`)
}

function onDrop(payload: DropEventPayload) {
  if (payload.dropType === 'reorder') {
    log(`Drop (reorder): ${payload.items.map(i => (i as FileItem).name).join(', ')} | from ${payload.fromIndex} to ${payload.toIndex}`)
  }
  else if (payload.dropType === 'container') {
    log(`Drop (container): ${payload.items.map(i => (i as FileItem).name).join(', ')} → ${(payload.targetContainer as FileItem)?.name}`)
  }
}

function acceptNotTrash(draggedItems: FreeformItemData[]) {
  // Reject if trying to drag the Trash into a folder
  return !draggedItems.some(item => item.id === 'trash')
}

const visibleItems = computed(() =>
  items.value.filter(i => i.parentId === currentFolderId.value),
)

function getChildren(containerId: string) {
  return items.value.filter(i => i.parentId === containerId)
}

const itemsJson = computed(() => JSON.stringify(items.value, null, 2))
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <!-- Feature Description -->
    <div class="mb-4 text-sm text-white/60">
      <p class="mb-2">
        <span class="text-white/80 font-medium">Try it out:</span>
      </p>
      <ul class="list-disc list-inside space-y-1 ml-2">
        <li>Double-click folders to navigate inside</li>
        <li>Drag files/folders to reorder or move into containers</li>
        <li>Drop items on Trash - confirmation dialog appears</li>
        <li>Try to move Trash into a folder - warning dialog (protected)</li>
        <li>Multi-select with <kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Ctrl</kbd>/<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-xs">Cmd</kbd>+Click or lasso</li>
        <li>Watch the event log and data panel on the right</li>
      </ul>
    </div>

    <!-- Header with Breadcrumbs -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-bold text-white">
          Desktop
        </h1>
        <span class="text-white/30 mx-2">|</span>
        <!-- Breadcrumb Navigation -->
        <nav class="flex items-center gap-1 text-sm">
          <button
            class="text-white/70 hover:text-white transition-colors"
            :class="{ 'text-white font-medium': !currentFolderId }"
            @click="goToRoot"
          >
            Root
          </button>
          <template
            v-for="folder in breadcrumbs"
            :key="folder.id"
          >
            <span class="text-white/30">/</span>
            <button
              class="text-white/70 hover:text-white transition-colors"
              :class="{ 'text-white font-medium': currentFolderId === folder.id }"
              @click="goToFolder(folder.id)"
            >
              {{ folder.icon }} {{ folder.name }}
            </button>
          </template>
        </nav>
      </div>
      <span class="text-white/50 text-sm">
        Selected: {{ selected.map(i => i.name).join(', ') || 'none' }}
      </span>
    </div>

    <div class="flex gap-4 h-[calc(100vh-180px)]">
      <!-- Desktop Area -->
      <div class="flex-1 flex flex-col">
        <!-- Back Button (when in subfolder) -->
        <div
          v-if="currentFolderId"
          class="mb-2"
        >
          <button
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors text-sm"
            @click="goToFolder(currentFolder?.parentId ?? null)"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        </div>

        <FreeformSelection
          class="flex-1"
          @select="onSelect"
        >
          <TheFreeform
            v-model="items"
            class="flex flex-wrap content-start gap-1 p-4 h-full rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @drop-into="onDropInto"
            @reorder="onReorder"
            @drop="onDrop"
          >
            <FreeformItem
              v-for="item in visibleItems"
              :key="item.id"
              :item="item"
              :accept="item.type === 'container' ? acceptNotTrash : undefined"
              class="w-20"
            >
              <template #default="{ selected: isSelected, dropTarget, dropAccepted }">
                <div
                  class="flex flex-col items-center p-2 rounded-lg cursor-default transition-all"
                  :class="{
                    'bg-blue-500/40 ring-1 ring-blue-400': isSelected && !dropTarget,
                    'bg-green-500/40 ring-2 ring-green-400 scale-105': dropTarget && dropAccepted,
                    'bg-red-500/40 ring-2 ring-red-400': dropTarget && !dropAccepted,
                    'hover:bg-white/10': !isSelected && !dropTarget,
                  }"
                  @dblclick="onItemDblClick(item)"
                >
                  <div
                    class="w-12 h-12 flex items-center justify-center text-4xl transition-transform"
                    :class="{ 'scale-110': isSelected }"
                  >
                    {{ item.icon }}
                  </div>
                  <span
                    class="text-[11px] text-center text-white/90 leading-tight w-full mt-1 truncate"
                    :title="item.name"
                  >
                    {{ item.name }}
                  </span>
                  <span
                    v-if="item.type === 'container' && getChildren(item.id).length > 0"
                    class="text-[9px] text-white/40"
                  >
                    {{ getChildren(item.id).length }}
                  </span>
                </div>
              </template>
            </FreeformItem>

            <!-- Empty Folder Message -->
            <div
              v-if="visibleItems.length === 0"
              class="w-full flex flex-col items-center justify-center py-12 text-white/30"
            >
              <span class="text-4xl mb-2">📂</span>
              <span class="text-sm">This folder is empty</span>
            </div>

            <!-- Placeholder -->
            <FreeformPlaceholder
              v-slot="{ count }"
              class="w-20"
            >
              <div class="flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-white/20 bg-white/5 h-[76px]">
                <span class="text-white/30 text-[10px]">
                  {{ count > 1 ? count : '' }}
                </span>
              </div>
            </FreeformPlaceholder>

            <!-- Drag Ghost -->
            <template #drag-ghost="{ items: draggedItems, count }">
              <div class="flex items-center gap-2 bg-slate-800/95 backdrop-blur rounded-lg px-3 py-2 shadow-xl border border-white/20">
                <div class="flex -space-x-2">
                  <span
                    v-for="(item, idx) in (draggedItems as FileItem[]).slice(0, 3)"
                    :key="item.id"
                    class="text-2xl"
                    :style="{ zIndex: 3 - idx }"
                  >
                    {{ item.icon }}
                  </span>
                </div>
                <span class="text-white text-sm">
                  {{ count === 1 ? (draggedItems[0] as FileItem).name : `${count} items` }}
                </span>
              </div>
            </template>
          </TheFreeform>

          <template #lasso="{ selectedCount }">
            <div class="relative w-full h-full border border-blue-400/50 bg-blue-500/10 rounded">
              <div
                v-if="selectedCount > 0"
                class="absolute -top-2 -right-2 min-w-5 h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full"
              >
                {{ selectedCount }}
              </div>
            </div>
          </template>
        </FreeformSelection>
      </div>

      <!-- Right Panel: Event Log + Data -->
      <div class="w-80 flex flex-col gap-4">
        <!-- Event Log -->
        <div class="bg-slate-800 rounded-lg border border-white/10 overflow-hidden">
          <div class="px-3 py-2 bg-slate-700 border-b border-white/10">
            <span class="text-white text-sm font-medium">Event Log</span>
          </div>
          <div class="h-48 overflow-y-auto p-2 font-mono text-[11px] text-white/70 space-y-1">
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
              Events will appear here...
            </div>
          </div>
        </div>

        <!-- Data View -->
        <div class="flex-1 bg-slate-800 rounded-lg border border-white/10 overflow-y-auto">
          <div class="px-3 py-2 bg-slate-700 border-b border-white/10">
            <span class="text-white text-sm font-medium">Data (items)</span>
          </div>
          <div class="h-full overflow-y-auto p-2">
            <pre class="font-mono text-[11px] text-green-400/80 whitespace-pre-wrap">{{ itemsJson }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Trash Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="showTrashConfirm"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="cancelTrash"
      >
        <div class="bg-slate-800 rounded-xl border border-white/20 shadow-2xl p-6 max-w-sm">
          <div class="text-4xl text-center mb-4">
            🗑️
          </div>
          <h2 class="text-white text-lg font-semibold text-center mb-2">
            Move to Trash?
          </h2>
          <p class="text-white/60 text-sm text-center mb-6">
            {{ pendingTrashItems.length === 1
              ? `"${pendingTrashItems[0]?.name}" will be moved to Trash.`
              : `${pendingTrashItems.length} items will be moved to Trash.`
            }}
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              @click="cancelTrash"
            >
              Cancel
            </button>
            <button
              class="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              @click="confirmTrash"
            >
              Move to Trash
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Trash Warning Dialog (cannot move trash) -->
    <Teleport to="body">
      <div
        v-if="showTrashWarning"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="showTrashWarning = false"
      >
        <div class="bg-slate-800 rounded-xl border border-white/20 shadow-2xl p-6 max-w-sm">
          <div class="text-4xl text-center mb-4">
            ⚠️
          </div>
          <h2 class="text-white text-lg font-semibold text-center mb-2">
            Cannot Move Trash
          </h2>
          <p class="text-white/60 text-sm text-center mb-6">
            The Trash is a system folder and cannot be moved into other folders.
          </p>
          <button
            class="w-full px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            @click="showTrashWarning = false"
          >
            OK
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
