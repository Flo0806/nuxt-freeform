<script setup lang="ts">
import type { FreeformItemData } from '../../src/runtime/types'

interface ListItem extends FreeformItemData {
  name: string
  color: string
  type?: 'item' | 'container'
}

const listA = ref<ListItem[]>([
  { id: 'a1', name: 'Apple', color: 'bg-red-500' },
  { id: 'a2', name: 'Banana', color: 'bg-yellow-500', disabled: true },
  { id: 'a3', name: 'Cherry', color: 'bg-pink-500' },
  { id: 'a4', name: 'Date', color: 'bg-amber-700' },
])

const listB = ref<ListItem[]>([
  { id: 'b1', name: 'Eggplant', color: 'bg-purple-500' },
  { id: 'b-folder', name: 'Folder', color: 'bg-slate-600', type: 'container' },
  { id: 'b2', name: 'Fig', color: 'bg-indigo-500' },
])

const listC = ref<ListItem[]>([
  { id: 'c1', name: 'Grape', color: 'bg-violet-500' },
  { id: 'c-folder', name: 'A-Only Folder', color: 'bg-emerald-600', type: 'container' },
])

const eventLog = ref<string[]>([])

function log(message: string) {
  const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  eventLog.value.unshift(`[${time}] ${message}`)
  if (eventLog.value.length > 15) eventLog.value.pop()
}

function moveItems(items: ListItem[], targetZoneId: string, index: number) {
  // Remove from all lists
  listA.value = listA.value.filter(i => !items.some(t => t.id === i.id))
  listB.value = listB.value.filter(i => !items.some(t => t.id === i.id))
  listC.value = listC.value.filter(i => !items.some(t => t.id === i.id))

  // Insert at specific index
  if (targetZoneId === 'list-a') {
    listA.value.splice(index, 0, ...items)
    log(`Moved to List A at ${index}: ${items.map(i => i.name).join(', ')}`)
  }
  else if (targetZoneId === 'list-b') {
    listB.value.splice(index, 0, ...items)
    log(`Moved to List B at ${index}: ${items.map(i => i.name).join(', ')}`)
  }
  else if (targetZoneId === 'list-c') {
    listC.value.splice(index, 0, ...items)
    log(`Moved to List C at ${index}: ${items.map(i => i.name).join(', ')}`)
  }
}

function onDropToZone(items: FreeformItemData[], zoneId: string, index: number, containerId: string | null) {
  // External drop into container?
  if (containerId) {
    const targetList = zoneId === 'list-a' ? listA : zoneId === 'list-b' ? listB : listC
    const container = targetList.value.find(i => i.id === containerId)
    if (container) {
      // Remove from all lists
      listA.value = listA.value.filter(i => !items.some(t => t.id === i.id))
      listB.value = listB.value.filter(i => !items.some(t => t.id === i.id))
      listC.value = listC.value.filter(i => !items.some(t => t.id === i.id))
      log(`Dropped into container "${(container as ListItem).name}" (external): ${(items as ListItem[]).map(i => i.name).join(', ')}`)
      return
    }
  }
  // Regular zone drop
  moveItems(items as ListItem[], zoneId, index)
}

function onDropIntoContainer(items: FreeformItemData[], container: FreeformItemData, accepted: boolean) {
  if (!accepted) return

  const typed = items as ListItem[]
  // Remove from all lists
  listA.value = listA.value.filter(i => !items.some(t => t.id === i.id))
  listB.value = listB.value.filter(i => !items.some(t => t.id === i.id))
  listC.value = listC.value.filter(i => !items.some(t => t.id === i.id))
  log(`Dropped into container "${(container as ListItem).name}": ${typed.map(i => i.name).join(', ')}`)
}

// List C is blocked - accepts nothing directly
function acceptNothing() {
  return false
}

// Container in List C only accepts items from List A (id starts with 'a')
function acceptOnlyFromListA(items: FreeformItemData[]) {
  return items.every(item => item.id.startsWith('a'))
}
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <h1 class="text-2xl font-bold text-white mb-2">
      DropZones
    </h1>

    <div class="mb-6 text-sm text-white/60">
      <p class="mb-2">
        <span class="text-white/80 font-medium">Try it out:</span>
      </p>
      <ul class="list-disc list-inside space-y-1 ml-2">
        <li>Drag items between List A and List B</li>
        <li>Drop at a specific position - the placeholder shows where</li>
        <li>List B has a folder - drag items onto it</li>
        <li>List C is blocked BUT has a folder that only accepts items from List A</li>
        <li>Try dragging Apple → C's folder (✓) vs Eggplant → C's folder (✗)</li>
        <li>Watch the event log to see what's happening</li>
      </ul>
    </div>

    <div class="flex gap-6">
      <!-- List A -->
      <FreeformDropZone
        id="list-a"
        class="flex-1"
      >
        <template #default="{ isOver, isAccepted }">
          <div
            class="p-4 rounded-xl border-2 transition-all min-h-[300px]"
            :class="{
              'border-white/20 bg-slate-800': !isOver,
              'border-green-500 bg-green-500/10': isOver && isAccepted,
              'border-red-500 bg-red-500/10': isOver && !isAccepted,
            }"
          >
            <h2 class="text-lg font-semibold text-white mb-4">
              List A ({{ listA.length }})
            </h2>
            <TheFreeform
              v-model="listA"
              drop-zone-id="list-a"
              class="flex flex-wrap gap-2"
              @drop-to-zone="onDropToZone"
            >
              <FreeformItem
                v-for="item in listA"
                :key="item.id"
                :item="item"
                :disabled="item.disabled"
              >
                <template #default="{ selected }">
                  <div
                    class="px-4 py-2 rounded-lg text-white font-medium"
                    :class="[
                      item.color,
                      { 'ring-2 ring-white': selected },
                      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab',
                    ]"
                  >
                    {{ item.name }}{{ item.disabled ? ' 🔒' : '' }}
                  </div>
                </template>
              </FreeformItem>

              <FreeformPlaceholder
                v-slot="{ count }"
                class="w-24"
              >
                <div class="px-4 py-2 rounded-lg border-2 border-dashed border-white/30 text-white/30 text-center">
                  {{ count }}
                </div>
              </FreeformPlaceholder>

              <template #drag-ghost="{ count }">
                <div class="px-4 py-2 rounded-lg bg-slate-700 text-white font-medium shadow-xl">
                  {{ count }} item{{ count > 1 ? 's' : '' }}
                </div>
              </template>
            </TheFreeform>
          </div>
        </template>
      </FreeformDropZone>

      <!-- List B -->
      <FreeformDropZone
        id="list-b"
        class="flex-1"
      >
        <template #default="{ isOver, isAccepted }">
          <div
            class="p-4 rounded-xl border-2 transition-all min-h-[300px]"
            :class="{
              'border-white/20 bg-slate-800': !isOver,
              'border-green-500 bg-green-500/10': isOver && isAccepted,
              'border-red-500 bg-red-500/10': isOver && !isAccepted,
            }"
          >
            <h2 class="text-lg font-semibold text-white mb-4">
              List B ({{ listB.length }})
            </h2>
            <TheFreeform
              v-model="listB"
              drop-zone-id="list-b"
              class="flex flex-wrap gap-2"
              @drop-to-zone="onDropToZone"
              @drop-into="onDropIntoContainer"
            >
              <FreeformItem
                v-for="item in listB"
                :key="item.id"
                :item="item"
              >
                <template #default="{ selected, dropTarget, dropAccepted }">
                  <div
                    class="px-4 py-2 rounded-lg text-white font-medium cursor-grab"
                    :class="[
                      item.color,
                      { 'ring-2 ring-white': selected },
                      { 'ring-2 ring-green-400 scale-105': dropTarget && dropAccepted },
                      { 'ring-2 ring-red-400': dropTarget && !dropAccepted },
                    ]"
                  >
                    {{ item.type === 'container' ? '📁 ' : '' }}{{ item.name }}
                  </div>
                </template>
              </FreeformItem>

              <FreeformPlaceholder
                v-slot="{ count }"
                class="w-24"
              >
                <div class="px-4 py-2 rounded-lg border-2 border-dashed border-white/30 text-white/30 text-center">
                  {{ count }}
                </div>
              </FreeformPlaceholder>

              <template #drag-ghost="{ count }">
                <div class="px-4 py-2 rounded-lg bg-slate-700 text-white font-medium shadow-xl">
                  {{ count }} item{{ count > 1 ? 's' : '' }}
                </div>
              </template>
            </TheFreeform>
          </div>
        </template>
      </FreeformDropZone>

      <!-- List C (blocked) -->
      <FreeformDropZone
        id="list-c"
        class="flex-1"
        :accept="acceptNothing"
      >
        <template #default="{ isOver, isAccepted }">
          <div
            class="p-4 rounded-xl border-2 transition-all min-h-[300px]"
            :class="{
              'border-white/20 bg-slate-800': !isOver,
              'border-green-500 bg-green-500/10': isOver && isAccepted,
              'border-red-500 bg-red-500/10': isOver && !isAccepted,
            }"
          >
            <h2 class="text-lg font-semibold text-white mb-4">
              List C - Blocked ({{ listC.length }})
            </h2>
            <TheFreeform
              v-model="listC"
              drop-zone-id="list-c"
              class="flex flex-wrap gap-2"
              @drop-to-zone="onDropToZone"
              @drop-into="onDropIntoContainer"
            >
              <FreeformItem
                v-for="item in listC"
                :key="item.id"
                :item="item"
                :accept="item.type === 'container' ? acceptOnlyFromListA : undefined"
              >
                <template #default="{ selected, dropTarget, dropAccepted }">
                  <div
                    class="px-4 py-2 rounded-lg text-white font-medium cursor-grab"
                    :class="[
                      item.color,
                      { 'ring-2 ring-white': selected },
                      { 'ring-2 ring-green-400 scale-105': dropTarget && dropAccepted },
                      { 'ring-2 ring-red-400': dropTarget && !dropAccepted },
                    ]"
                  >
                    {{ item.type === 'container' ? '📁 ' : '' }}{{ item.name }}
                  </div>
                </template>
              </FreeformItem>

              <FreeformPlaceholder
                v-slot="{ count }"
                class="w-24"
              >
                <div class="px-4 py-2 rounded-lg border-2 border-dashed border-white/30 text-white/30 text-center">
                  {{ count }}
                </div>
              </FreeformPlaceholder>

              <template #drag-ghost="{ count }">
                <div class="px-4 py-2 rounded-lg bg-slate-700 text-white font-medium shadow-xl">
                  {{ count }} item{{ count > 1 ? 's' : '' }}
                </div>
              </template>
            </TheFreeform>
          </div>
        </template>
      </FreeformDropZone>
    </div>

    <!-- Event Log -->
    <div class="mt-8 bg-slate-800 rounded-lg border border-white/10 p-4 max-w-xl">
      <h3 class="text-white font-medium mb-2">
        Event Log
      </h3>
      <div class="space-y-1 font-mono text-xs text-white/60">
        <div
          v-for="(entry, idx) in eventLog"
          :key="idx"
        >
          {{ entry }}
        </div>
        <div
          v-if="eventLog.length === 0"
          class="text-white/30 italic"
        >
          Drag items between lists...
        </div>
      </div>
    </div>
  </div>
</template>
