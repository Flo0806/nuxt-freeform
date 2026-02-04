# Concepts

Understanding the core concepts behind nuxt-freeform.

## Data Structure

### Flat Array with IDs

nuxt-freeform uses a flat array structure. Each item needs a unique `id`:

```ts
interface FreeformItemData {
  id: string
  type?: 'container'
  // ...your custom properties
}
```

### Containers

Items with `type: 'container'` become drop targets. Other items can be dropped into them:

```ts
const items = ref([
  { id: 'folder-1', type: 'container', name: 'Documents' },
  { id: 'folder-2', type: 'container', name: 'Photos' },
  { id: 'file-1', name: 'readme.md' },
  { id: 'file-2', name: 'photo.jpg' },
])
```

## Event Flow

### Reordering

When items are reordered, the array is automatically updated via `v-model`:

```vue
<TheFreeform v-model="items">
  <!-- items array is updated automatically -->
</TheFreeform>
```

### Dropping into Containers

The `@drop-into` event fires when items are dropped into a container:

```ts
function onDropInto(
  droppedItems: FreeformItemData[], // Items that were dropped
  container: FreeformItemData,      // Container they were dropped into
  accepted: boolean                 // Whether the drop was accepted
) {
  if (!accepted) return

  // Your logic here - e.g., set parentId, remove from list, etc.
  items.value = items.value.filter(
    i => !droppedItems.some(d => d.id === i.id)
  )
}
```

## Selection

### Click Selection

- **Click** on an item to select it (deselects others)
- **Ctrl/Cmd + Click** to toggle selection (keep others selected)
- **Shift + Click** to select a range

### Lasso Selection

When wrapped with `FreeformSelection`, you can draw a rectangle to select items:

```vue
<FreeformSelection @select="onSelect">
  <TheFreeform v-model="items">
    <!-- items -->
  </TheFreeform>
</FreeformSelection>
```

## Customization

### Slots

Every visual element can be customized via slots:

```vue
<TheFreeform v-model="items">
  <FreeformItem v-for="item in items" :key="item.id" :item="item">
    <template #default="{ selected, dragging, dropTarget }">
      <!-- Your custom item template -->
    </template>
  </FreeformItem>

  <FreeformPlaceholder>
    <template #default="{ count, size }">
      <!-- Your custom placeholder -->
    </template>
  </FreeformPlaceholder>

  <template #drag-ghost="{ items, count }">
    <!-- Your custom ghost -->
  </template>
</TheFreeform>
```

### CSS Variables

Override colors with CSS custom properties:

```css
.my-freeform {
  --freeform-color-primary: #3b82f6;
  --freeform-color-success: #22c55e;
  --freeform-color-danger: #ef4444;
}
```

## Accept Function

Control which drops are allowed with the `accept` prop:

```vue
<FreeformItem
  :item="item"
  :accept="item.type === 'container' ? acceptFiles : undefined"
>
```

```ts
// Only accept non-container items
function acceptFiles(draggedItems: FreeformItemData[]) {
  return draggedItems.every(item => item.type !== 'container')
}
```

When `accept` returns `false`, the drop is rejected and visual feedback shows red instead of green.

## Drop Zones

For cross-list drag & drop, wrap your `TheFreeform` instances with `FreeformDropZone`:

```vue
<FreeformDropZone id="list-a">
  <TheFreeform v-model="listA" drop-zone-id="list-a" @drop-to-zone="onDropToZone">
    <!-- items -->
  </TheFreeform>
</FreeformDropZone>
```

The `@drop-to-zone` event fires when items are dropped from another zone.

### Hierarchical Accept

When using drop zones with containers, the accept logic works hierarchically:

- **Zone `accept`**: Only checked for direct drops into the zone
- **Container `accept`**: Checked when dropping into a container inside the zone

This enables complex patterns like a dashboard that accepts only cards, but cards (containers) can accept controls:

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
function acceptOnlyCards(items) {
  return items.every(i => i.type === 'card')
}

function acceptOnlyControls(items) {
  return items.every(i => i.type === 'control')
}
```

**Key insight**: Items dragged to a container bypass the zone's `accept` - only the container's `accept` is checked.
