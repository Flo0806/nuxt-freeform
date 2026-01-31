<script setup lang="ts">
import type { FreeformItemData } from 'nuxt-freeform'

interface FileItem extends FreeformItemData {
  name: string
  icon: string
}

// Auto-scroll when dragging near edges
const scrollContainer = ref<HTMLElement | null>(null)
const { onDragMove, stop: stopAutoScroll } = useAutoScroll(scrollContainer)

// Generate many items for scrolling
const items = ref<FileItem[]>([
  // Folders at top
  { id: 'folder-1', name: 'Documents', icon: '📁', type: 'container' },
  { id: 'folder-2', name: 'Downloads', icon: '📁', type: 'container' },
  { id: 'folder-3', name: 'Pictures', icon: '📁', type: 'container' },
  // Many files
  { id: 'file-1', name: 'Report.pdf', icon: '📄' },
  { id: 'file-2', name: 'Budget.xlsx', icon: '📊' },
  { id: 'file-3', name: 'Notes.txt', icon: '📝' },
  { id: 'file-4', name: 'Photo1.jpg', icon: '🖼️' },
  { id: 'file-5', name: 'Photo2.jpg', icon: '🖼️' },
  { id: 'file-6', name: 'Photo3.jpg', icon: '🖼️' },
  { id: 'file-7', name: 'Video.mp4', icon: '🎬' },
  { id: 'file-8', name: 'Music.mp3', icon: '🎵' },
  { id: 'file-9', name: 'Archive.zip', icon: '📦' },
  { id: 'file-10', name: 'Backup.tar', icon: '💾' },
  { id: 'file-11', name: 'Config.json', icon: '⚙️' },
  { id: 'file-12', name: 'Script.sh', icon: '📜' },
  { id: 'file-13', name: 'Database.db', icon: '🗃️' },
  { id: 'file-14', name: 'Log.txt', icon: '📋' },
  { id: 'file-15', name: 'README.md', icon: '📖' },
  { id: 'file-16', name: 'License.txt', icon: '📃' },
  { id: 'file-17', name: 'Image.png', icon: '🖼️' },
  { id: 'file-18', name: 'Icon.svg', icon: '🎨' },
  { id: 'file-19', name: 'Font.ttf', icon: '🔤' },
  { id: 'file-20', name: 'Style.css', icon: '🎭' },
  { id: 'file-21', name: 'App.vue', icon: '💚' },
  { id: 'file-22', name: 'Index.ts', icon: '🔷' },
  { id: 'file-23', name: 'Test.spec.ts', icon: '🧪' },
  { id: 'file-24', name: 'Package.json', icon: '📦' },
  // More folders in the middle
  { id: 'folder-4', name: 'Projects', icon: '📁', type: 'container' },
  { id: 'folder-5', name: 'Archive', icon: '📁', type: 'container' },
  // More files
  { id: 'file-25', name: 'Draft.docx', icon: '📝' },
  { id: 'file-26', name: 'Presentation.pptx', icon: '📊' },
  { id: 'file-27', name: 'Spreadsheet.xlsx', icon: '📈' },
  { id: 'file-28', name: 'Email.eml', icon: '✉️' },
  { id: 'file-29', name: 'Contact.vcf', icon: '👤' },
  { id: 'file-30', name: 'Calendar.ics', icon: '📅' },
])

function onDropInto(draggedItems: FreeformItemData[], container: FreeformItemData, accepted: boolean) {
  if (!accepted) return

  // Remove dropped items from list
  items.value = items.value.filter(i => !draggedItems.some(d => d.id === i.id))
  console.log(`Dropped ${draggedItems.length} items into ${(container as FileItem).name}`)
}
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <h1 class="text-2xl font-bold text-white mb-2">
      Scrolling
    </h1>

    <div class="mb-6 text-sm text-white/60">
      <p class="mb-2">
        <span class="text-white/80 font-medium">Try it out:</span>
      </p>
      <ul class="list-disc list-inside space-y-1 ml-2">
        <li>Drag an item near the top or bottom edge of the list</li>
        <li>Auto-scroll kicks in as you approach the edges</li>
        <li>The placeholder follows along while scrolling</li>
        <li>Drop items into folders (📁) while scrolling</li>
      </ul>
      <p class="mt-2 text-xs">
        Powered by <code class="px-1.5 py-0.5 bg-white/10 rounded text-blue-400">useAutoScroll()</code> composable
      </p>
    </div>

    <div
      ref="scrollContainer"
      class="bg-slate-800 rounded-xl border border-white/10 h-[400px] overflow-auto"
    >
      <TheFreeform
        v-model="items"
        class="grid grid-cols-3 gap-4 p-4"
        @drop-into="onDropInto"
        @drag-move="(_, pos) => onDragMove(pos)"
        @drag-end="stopAutoScroll"
      >
        <FreeformItem
          v-for="item in items"
          :key="item.id"
          :item="item"
        >
          <template #default="{ selected, dropTarget, dropAccepted }">
            <div
              class="flex flex-col items-center justify-center p-4 rounded-lg cursor-grab transition-all"
              :class="[
                selected ? 'bg-blue-500/30 ring-2 ring-blue-400' : 'bg-slate-700 hover:bg-slate-600',
                dropTarget && dropAccepted ? 'ring-2 ring-green-400 scale-110' : '',
                dropTarget && !dropAccepted ? 'ring-2 ring-red-400' : '',
              ]"
            >
              <span class="text-3xl mb-2">{{ item.icon }}</span>
              <span class="text-white text-xs text-center truncate w-full">{{ item.name }}</span>
            </div>
          </template>
        </FreeformItem>

        <FreeformPlaceholder v-slot="{ count }">
          <div class="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-white/20">
            <span class="text-white/40 text-sm">{{ count }}</span>
          </div>
        </FreeformPlaceholder>

        <template #drag-ghost="{ items: dragItems, count }">
          <div class="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-600 shadow-xl">
            <span class="text-3xl mb-1">{{ (dragItems[0] as FileItem)?.icon }}</span>
            <span v-if="count > 1" class="text-white text-xs">+{{ count - 1 }} more</span>
          </div>
        </template>
      </TheFreeform>
    </div>
  </div>
</template>
