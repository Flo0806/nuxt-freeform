# Quick Start

Build a working drag & drop interface in under 20 lines of code.

## Minimal Example

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

## What You Get

With this minimal setup, you already have:

- **Drag to reorder** - Items can be dragged and reordered (automatic via `v-model`)
- **Drop into folders** - Items with `type: 'container'` accept drops
- **Default styling** - Ghost, placeholder, and items have sensible defaults
- **Selection states** - Visual feedback on hover and selection

## Understanding the Code

### Data Structure

```ts
interface FreeformItemData {
  id: string           // Required: unique identifier
  type?: 'container'   // Optional: makes item a drop target
}
```

### The Components

1. **`TheFreeform`** - The container. Wrap all items with this.
   - `v-model` syncs your items array (handles reordering)
   - `@drop-into` fires when items are dropped into a container

2. **`FreeformItem`** - Each draggable item.
   - `:item` - The item data (must have `id`)
   - Automatically styled based on state (selected, dragging, drop target)

3. **`FreeformPlaceholder`** - Visual indicator for drop position.
   - Shows where items will land during drag
   - Automatically sizes to match dragged items

## Adding Lasso Selection

Wrap with `FreeformSelection` to enable rectangle selection:

```vue
<template>
  <FreeformSelection>
    <TheFreeform v-model="items" class="flex flex-wrap gap-3 p-4">
      <FreeformItem v-for="item in items" :key="item.id" :item="item" />
      <FreeformPlaceholder />
    </TheFreeform>
  </FreeformSelection>
</template>
```

Now you can click and drag on empty space to select multiple items at once.

## Next Steps

- [Concepts](/getting-started/concepts) - Understand how nuxt-freeform works
- [Components](/components/the-freeform) - Deep dive into each component
- [Examples](/examples/file-manager) - See more complex examples
