# Minimal Example

The simplest possible setup - just 15 lines of code.

## Code

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

With zero configuration:

- **Default ghost** - Shows item ID and count badge
- **Default placeholder** - Dashed border with primary color
- **Default item styling** - Selection, hover, and drop target states
- **Drag to reorder** - Automatic via `v-model`
- **Drop into folders** - Items with `type: 'container'`

## Key Points

1. **`v-model`** handles reordering automatically
2. **`type: 'container'`** makes items drop targets
3. **`@drop-into`** fires when dropping into a container
4. **Default slots** provide sensible styling out of the box
