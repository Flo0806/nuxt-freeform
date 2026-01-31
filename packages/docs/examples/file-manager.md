# File Manager Example

A complete file manager with folders, custom icons, and visual feedback.

## Code

```vue
<script setup lang="ts">
import type { FreeformItemData } from 'nuxt-freeform'

interface FileItem extends FreeformItemData {
  name: string
  icon: string
}

const files = ref<FileItem[]>([
  { id: '1', name: 'Documents', icon: '📁', type: 'container' },
  { id: '2', name: 'Photos', icon: '📁', type: 'container' },
  { id: '3', name: 'readme.md', icon: '📝' },
  { id: '4', name: 'photo.jpg', icon: '🖼️' },
  { id: '5', name: 'report.pdf', icon: '📄' },
])

// Only accept non-folder items
function acceptFiles(draggedItems: FileItem[]) {
  return draggedItems.every(item => item.type !== 'container')
}

function onDropInto(items: FileItem[], folder: FileItem, accepted: boolean) {
  if (!accepted) return
  files.value = files.value.filter(f => !items.some(i => i.id === f.id))
  console.log(`Moved ${items.map(i => i.name).join(', ')} to ${folder.name}`)
}
</script>

<template>
  <TheFreeform v-model="files" @drop-into="onDropInto" class="flex flex-wrap gap-4 p-6">
    <FreeformItem
      v-for="file in files"
      :key="file.id"
      :item="file"
      :accept="file.type === 'container' ? acceptFiles : undefined"
    >
      <template #default="{ selected, dropTarget, dropAccepted }">
        <div
          class="flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all"
          :class="{
            'bg-blue-100 ring-2 ring-blue-500': selected,
            'bg-green-100 ring-2 ring-green-500': dropTarget && dropAccepted,
            'bg-red-100 ring-2 ring-red-500': dropTarget && !dropAccepted,
            'bg-gray-100 hover:bg-gray-200': !selected && !dropTarget,
          }"
        >
          <span class="text-4xl">{{ file.icon }}</span>
          <span class="mt-2 text-sm">{{ file.name }}</span>
        </div>
      </template>
    </FreeformItem>
    <FreeformPlaceholder />
  </TheFreeform>
</template>
```

## Features Demonstrated

### Custom Item Interface

Extend `FreeformItemData` with your own properties:

```ts
interface FileItem extends FreeformItemData {
  name: string
  icon: string
}
```

### Accept Validation

Prevent folders from being dropped into folders:

```ts
function acceptFiles(draggedItems: FileItem[]) {
  return draggedItems.every(item => item.type !== 'container')
}
```

### Visual Feedback

Different styles based on state:

- **Selected**: Blue ring
- **Drop accepted**: Green ring
- **Drop rejected**: Red ring
