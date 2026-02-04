# FreeformDropZone

Enables cross-list drag & drop between multiple `TheFreeform` instances.

## Basic Usage

```vue
<FreeformDropZone id="list-a" :accept="acceptFn">
  <template #default="{ isOver, isAccepted }">
    <div :class="{ 'bg-green-100': isOver && isAccepted, 'bg-red-100': isOver && !isAccepted }">
      <TheFreeform v-model="listA" drop-zone-id="list-a" @drop-to-zone="onDropToZone">
        <FreeformItem v-for="item in listA" :key="item.id" :item="item" />
        <FreeformPlaceholder />
      </TheFreeform>
    </div>
  </template>
</FreeformDropZone>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | auto-generated | Unique zone identifier |
| `accept` | `(items) => boolean` | - | Validate if drop is allowed |

## Slot Props

### Default Slot

```vue
<FreeformDropZone id="my-zone">
  <template #default="{ isOver, isAccepted }">
    <!-- Your content -->
  </template>
</FreeformDropZone>
```

| Prop | Type | Description |
|------|------|-------------|
| `isOver` | `boolean` | Items are being dragged over this zone |
| `isAccepted` | `boolean` | Drop would be accepted |

## Connecting TheFreeform to a Zone

Use the `drop-zone-id` prop on `TheFreeform` to connect it to a `FreeformDropZone`:

```vue
<FreeformDropZone id="list-a">
  <TheFreeform v-model="items" drop-zone-id="list-a">
    <!-- items -->
  </TheFreeform>
</FreeformDropZone>
```

## Handling Cross-Zone Drops

The `@drop-to-zone` event fires when items are dropped from another zone:

```ts
function onDropToZone(
  items: FreeformItemData[],  // Dropped items
  zoneId: string,             // Target zone ID
  index: number,              // Drop position in list
  containerId: string | null  // Container ID if dropped into container
) {
  if (containerId) {
    // Handle drop into container
    console.log(`Dropped into container ${containerId}`)
  } else {
    // Handle drop into zone
    moveItems(items, zoneId, index)
  }
}
```

## Hierarchical Accept

When using `FreeformDropZone` with containers inside, the accept logic is hierarchical:

- **Zone `accept`**: Only checked for direct drops into the zone
- **Container `accept`**: Checked when dropping into a container inside the zone

This allows patterns like "zone accepts only cards, but cards (containers) accept controls":

```vue
<FreeformDropZone id="dashboard" :accept="acceptOnlyCards">
  <TheFreeform v-model="cards" drop-zone-id="dashboard" @drop-to-zone="onDropToZone">
    <FreeformItem
      v-for="card in cards"
      :key="card.id"
      :item="card"
      :accept="acceptOnlyControls"
    />
    <FreeformPlaceholder />
  </TheFreeform>
</FreeformDropZone>
```

```ts
// Zone accepts only cards directly
function acceptOnlyCards(items: FreeformItemData[]) {
  return items.every(i => i.type === 'card')
}

// Containers (cards) accept only controls
function acceptOnlyControls(items: FreeformItemData[]) {
  return items.every(i => i.type === 'control')
}
```

**Key behavior**: Items dragged to a container bypass the zone's `accept` - only the container's `accept` is checked. This enables complex nested accept patterns.

## Complete Example

```vue
<script setup lang="ts">
const listA = ref([
  { id: 'a1', name: 'Apple' },
  { id: 'a2', name: 'Banana' },
])

const listB = ref([
  { id: 'b1', name: 'Cherry' },
  { id: 'b-folder', name: 'Folder', type: 'container' },
])

function onDropToZone(items, zoneId, index, containerId) {
  // Remove from source list
  listA.value = listA.value.filter(i => !items.some(t => t.id === i.id))
  listB.value = listB.value.filter(i => !items.some(t => t.id === i.id))

  if (containerId) {
    console.log(`Dropped into container: ${containerId}`)
    return
  }

  // Add to target list at index
  if (zoneId === 'list-a') {
    listA.value.splice(index, 0, ...items)
  } else if (zoneId === 'list-b') {
    listB.value.splice(index, 0, ...items)
  }
}
</script>

<template>
  <div class="flex gap-4">
    <FreeformDropZone id="list-a" class="flex-1">
      <template #default="{ isOver, isAccepted }">
        <div
          class="p-4 rounded border-2"
          :class="{
            'border-gray-200': !isOver,
            'border-green-500 bg-green-50': isOver && isAccepted,
            'border-red-500 bg-red-50': isOver && !isAccepted,
          }"
        >
          <h2>List A</h2>
          <TheFreeform
            v-model="listA"
            drop-zone-id="list-a"
            class="flex flex-wrap gap-2"
            @drop-to-zone="onDropToZone"
          >
            <FreeformItem v-for="item in listA" :key="item.id" :item="item" />
            <FreeformPlaceholder />
          </TheFreeform>
        </div>
      </template>
    </FreeformDropZone>

    <FreeformDropZone id="list-b" class="flex-1">
      <template #default="{ isOver, isAccepted }">
        <div
          class="p-4 rounded border-2"
          :class="{
            'border-gray-200': !isOver,
            'border-green-500 bg-green-50': isOver && isAccepted,
            'border-red-500 bg-red-50': isOver && !isAccepted,
          }"
        >
          <h2>List B</h2>
          <TheFreeform
            v-model="listB"
            drop-zone-id="list-b"
            class="flex flex-wrap gap-2"
            @drop-to-zone="onDropToZone"
          >
            <FreeformItem v-for="item in listB" :key="item.id" :item="item" />
            <FreeformPlaceholder />
          </TheFreeform>
        </div>
      </template>
    </FreeformDropZone>
  </div>
</template>
```
