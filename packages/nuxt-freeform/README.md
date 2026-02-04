# nuxt-freeform

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]
[![GitHub stars][stars-src]][stars-href]
[![nuxt.care][nuxtcare-src]][nuxtcare-href]

Desktop-like drag & drop for Nuxt/Vue. Lasso selection, reorder, drop into containers - all with sensible defaults.

**There's no Nuxt module for drag & drop on nuxt.com/modules** - until now.

### Learn more
**[Documentation](https://nuxt-freeform.fh-softdev.de)**

## Modes

### Desktop
Lasso selection, multi-select, drag & drop - just like your OS file manager.

<img width="620" alt="Desktop Mode" src="https://github.com/user-attachments/assets/7042faa8-8d3e-44b2-bd6e-ed48fb558d30" />

### Freeform
Free positioning on a canvas - arrange items anywhere you want.

<img width="620" alt="Freeform Mode" src="https://github.com/user-attachments/assets/6c04ac3b-c3c5-4c12-89c7-cc518783f092" />

### Lists
Drag between multiple lists - perfect for Kanban boards and task management.

<img width="620" alt="Lists Mode" src="https://github.com/user-attachments/assets/f929f11b-b038-46d1-8f62-64af557b2555" />

## Features

- **Zero Dependencies** - Pure Vue magic, no third-party drag & drop libraries
- **Lasso Selection** - Select multiple items with a selection rectangle, just like on your desktop
- **Drag & Drop** - Reorder items or drop into containers/folders
- **Multi-Select** - Ctrl/Cmd+Click to toggle selection, drag multiple items at once
- **Zero Config** - Works out of the box with sensible defaults
- **Fully Customizable** - Override any visual via slots
- **CSS Variables** - Easy theming with CSS custom properties
- **SSR Safe** - Proper hydration support for Nuxt
- **TypeScript** - Full type support with generics

## Installation

```bash
npx nuxi module add nuxt-freeform
```

Or manually:

```bash
pnpm add nuxt-freeform
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-freeform']
})
```

## Quick Start

The simplest example - just 15 lines of code:

```vue
<script setup>
const items = ref([
  { id: 'Folder A', type: 'container' },
  { id: 'Folder B', type: 'container' },
  { id: 'Item 1' },
  { id: 'Item 2' },
  { id: 'Item 3' },
])

function onDropInto(droppedItems, container, accepted) {
  if (!accepted) return
  // Remove items from list (they're now "inside" the folder)
  items.value = items.value.filter(i => !droppedItems.some(d => d.id === i.id))
}
</script>

<template>
  <TheFreeform v-model="items" @drop-into="onDropInto" class="flex flex-wrap gap-3 p-4">
    <FreeformItem v-for="item in items" :key="item.id" :item="item" />
    <FreeformPlaceholder />
  </TheFreeform>
</template>
```

You get:
- Drag to reorder (automatic via `v-model`)
- Drop into folders (items with `type: 'container'`)
- Default ghost, placeholder, and item styling
- Selection states

## Components

### TheFreeform

The main container that manages all drag & drop state.

```vue
<TheFreeform
  v-model="items"
  :disabled="false"
  :manual-reorder="false"
  @select="onSelect"
  @drag-start="onDragStart"
  @drag-end="onDragEnd"
  @drop-into="onDropInto"
  @reorder="onReorder"
>
  <!-- items go here -->
</TheFreeform>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `FreeformItemData[]` | required | Items array (v-model) |
| `disabled` | `boolean` | `false` | Disable all interactions |
| `manualReorder` | `boolean` | `false` | Don't auto-reorder, handle manually |

### FreeformItem

Individual draggable item. Automatically registers with the parent `TheFreeform`.

```vue
<FreeformItem
  :item="item"
  :disabled="false"
  :as-drop-zone="false"
  :accept="acceptFn"
>
  <template #default="{ selected, dragging, dropTarget, dropAccepted }">
    <!-- custom content -->
  </template>
</FreeformItem>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `item` | `FreeformItemData` | required | Item data |
| `disabled` | `boolean` | `false` | Disable dragging for this item |
| `asDropZone` | `boolean` | `false` | Force this item to be a drop target |
| `accept` | `(items) => boolean` | - | Validate if drop is allowed |

**Slot Props:**

| Prop | Type | Description |
|------|------|-------------|
| `item` | `object` | The item data |
| `selected` | `boolean` | Item is selected |
| `dragging` | `boolean` | Item is being dragged |
| `dropTarget` | `boolean` | Item is a drop target (hovering) |
| `dropAccepted` | `boolean` | Drop would be accepted |

### FreeformPlaceholder

Shows where dragged items will land. Automatically sizes to match the dragged item.

```vue
<FreeformPlaceholder>
  <template #default="{ count, size }">
    <div class="my-placeholder">{{ count }} items</div>
  </template>
</FreeformPlaceholder>
```

### FreeformSelection

Wraps `TheFreeform` to enable lasso selection.

```vue
<FreeformSelection @select="onSelect">
  <TheFreeform v-model="items">
    <!-- ... -->
  </TheFreeform>

  <template #lasso="{ selectedCount }">
    <div class="selection-box">
      <span class="badge">{{ selectedCount }}</span>
    </div>
  </template>
</FreeformSelection>
```

### FreeformDropZone

Enables cross-list drag & drop between multiple `TheFreeform` instances.

```vue
<FreeformDropZone id="list-a" :accept="acceptFn">
  <template #default="{ isOver, isAccepted }">
    <div :class="{ 'bg-green-100': isOver && isAccepted, 'bg-red-100': isOver && !isAccepted }">
      <TheFreeform v-model="listA" drop-zone-id="list-a" @drop-to-zone="onDropToZone">
        <!-- items -->
      </TheFreeform>
    </div>
  </template>
</FreeformDropZone>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | auto-generated | Unique zone identifier |
| `accept` | `(items) => boolean` | - | Validate if drop is allowed |

**Slot Props:**

| Prop | Type | Description |
|------|------|-------------|
| `isOver` | `boolean` | Items are being dragged over this zone |
| `isAccepted` | `boolean` | Drop would be accepted |

#### Hierarchical Accept

When using `FreeformDropZone` with containers inside, the accept logic is hierarchical:

- **Zone `accept`**: Only checked for direct drops into the zone
- **Container `accept`**: Checked when dropping into a container inside the zone

This allows patterns like "zone accepts only cards, but cards (containers) accept controls":

```vue
<FreeformDropZone id="dashboard" :accept="acceptOnlyCards">
  <TheFreeform v-model="cards" drop-zone-id="dashboard">
    <FreeformItem
      v-for="card in cards"
      :item="card"
      :accept="acceptOnlyControls"
    />
  </TheFreeform>
</FreeformDropZone>
```

```ts
// Zone accepts only cards directly
function acceptOnlyCards(items) {
  return items.every(i => i.type === 'card')
}

// Containers (cards) accept only controls
function acceptOnlyControls(items) {
  return items.every(i => i.type === 'control')
}
```

Items dragged to a container bypass the zone's `accept` - only the container's `accept` is checked.

## Examples

### File Manager

```vue
<script setup>
interface FileItem {
  id: string
  name: string
  icon: string
  type?: 'container'
}

const files = ref<FileItem[]>([
  { id: '1', name: 'Documents', icon: '📁', type: 'container' },
  { id: '2', name: 'Photos', icon: '📁', type: 'container' },
  { id: '3', name: 'readme.md', icon: '📝' },
  { id: '4', name: 'photo.jpg', icon: '🖼️' },
])

function onDropInto(items: FileItem[], folder: FileItem, accepted: boolean) {
  if (!accepted) return
  files.value = files.value.filter(f => !items.some(i => i.id === f.id))
  console.log(`Moved ${items.map(i => i.name).join(', ')} to ${folder.name}`)
}
</script>

<template>
  <TheFreeform v-model="files" @drop-into="onDropInto" class="flex flex-wrap gap-4 p-6">
    <FreeformItem v-for="file in files" :key="file.id" :item="file">
      <template #default="{ selected, dropTarget, dropAccepted }">
        <div
          class="flex flex-col items-center p-4 rounded-lg cursor-pointer"
          :class="{
            'bg-blue-100 ring-2 ring-blue-500': selected,
            'bg-green-100 ring-2 ring-green-500': dropTarget && dropAccepted,
            'bg-red-100 ring-2 ring-red-500': dropTarget && !dropAccepted,
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

### With Lasso Selection

```vue
<script setup>
const items = ref([
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
])

const selected = ref([])

function onSelect(items) {
  selected.value = items
}
</script>

<template>
  <FreeformSelection @select="onSelect">
    <TheFreeform v-model="items" class="flex flex-wrap gap-3 p-4 min-h-[300px]">
      <FreeformItem v-for="item in items" :key="item.id" :item="item" />
      <FreeformPlaceholder />
    </TheFreeform>

    <template #lasso="{ selectedCount }">
      <div class="border border-blue-500 bg-blue-500/10 rounded relative">
        <span
          v-if="selectedCount"
          class="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-2"
        >
          {{ selectedCount }}
        </span>
      </div>
    </template>
  </FreeformSelection>
</template>
```

### Custom Accept Function

Prevent certain drops (e.g., folders into folders):

```vue
<script setup>
const items = ref([
  { id: '1', name: 'Folder', type: 'container' },
  { id: '2', name: 'File.txt' },
])

// Only accept non-container items
function acceptFiles(draggedItems) {
  return draggedItems.every(item => item.type !== 'container')
}
</script>

<template>
  <TheFreeform v-model="items">
    <FreeformItem
      v-for="item in items"
      :key="item.id"
      :item="item"
      :accept="item.type === 'container' ? acceptFiles : undefined"
    />
    <FreeformPlaceholder />
  </TheFreeform>
</template>
```

### Custom Ghost

```vue
<TheFreeform v-model="items">
  <FreeformItem v-for="item in items" :key="item.id" :item="item" />
  <FreeformPlaceholder />

  <template #drag-ghost="{ items, count }">
    <div class="bg-white shadow-xl rounded-lg p-4 flex items-center gap-3">
      <span class="text-2xl">{{ items[0]?.icon }}</span>
      <div>
        <div class="font-medium">{{ items[0]?.name }}</div>
        <div v-if="count > 1" class="text-sm text-gray-500">
          +{{ count - 1 }} more
        </div>
      </div>
    </div>
  </template>
</TheFreeform>
```

## CSS Variables

Customize the default styling with CSS variables:

```css
.my-freeform {
  /* Primary color (selection, placeholder) */
  --freeform-color-primary: #3b82f6;
  --freeform-color-primary-light: #dbeafe;

  /* Success color (drop accepted) */
  --freeform-color-success: #22c55e;
  --freeform-color-success-light: #dcfce7;

  /* Danger color (drop rejected) */
  --freeform-color-danger: #ef4444;
  --freeform-color-danger-light: #fee2e2;

  /* Neutral colors */
  --freeform-color-neutral: #f3f4f6;
  --freeform-color-text: #374151;
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `items[]` | Items array changed (reorder) |
| `select` | `items[]` | Selection changed |
| `drag-start` | `items[]` | Drag operation started |
| `drag-move` | `items[], position` | Dragging (with cursor position) |
| `drag-end` | `items[]` | Drag operation ended |
| `drop-into` | `items[], container, accepted` | Items dropped into a container |
| `drop-to-zone` | `items[], zoneId, index, containerId` | Items dropped to external zone |
| `reorder` | `fromIndex, toIndex` | Items reordered |

## TypeScript

Extend `FreeformItemData` with your own properties:

```ts
import type { FreeformItemData } from 'nuxt-freeform'

interface MyItem extends FreeformItemData {
  name: string
  icon: string
  size?: number
}

const items = ref<MyItem[]>([
  { id: '1', name: 'File', icon: '📄', size: 1024 }
])
```

## Development

```bash
# Install dependencies
pnpm install

# Start playground
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Test
pnpm test
```

## Inspiration

This module was inspired by the Angular library [ngx-explorer-dnd](https://github.com/Flo0806/ngx-explorer-dnd) and brings the same desktop-like drag & drop experience to the Vue/Nuxt ecosystem.

## License

[MIT](https://github.com/Flo0806/nuxt-freeform/blob/main/LICENSE)

---

Made with ♥️ by Flo0806 · Creator of [nuxt.care](https://nuxt.care)

## Support

If you like this module, give it a ⭐!

<a href="https://www.buymeacoffee.com/flo0806" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40"></a>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-freeform/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-freeform

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-freeform.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-freeform

[license-src]: https://img.shields.io/npm/l/nuxt-freeform.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://github.com/Flo0806/nuxt-freeform/blob/main/LICENSE

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com

[stars-src]: https://img.shields.io/github/stars/Flo0806/nuxt-freeform?style=flat&colorA=020420&colorB=00DC82
[stars-href]: https://github.com/Flo0806/nuxt-freeform

[nuxtcare-src]: https://img.shields.io/endpoint?url=https%3A%2F%2Fnuxt.care%2Fapi%2Fv1%2Fbadge%3Fmode%3Dstatus%26package%3Dnuxt-freeform
[nuxtcare-href]: https://nuxt.care/?search=npm:nuxt-freeform
