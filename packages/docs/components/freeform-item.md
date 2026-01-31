# FreeformItem

Individual draggable item component. Automatically registers with the parent `TheFreeform`.

## Basic Usage

```vue
<FreeformItem :item="item" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `item` | `FreeformItemData` | required | Item data (must have `id`) |
| `disabled` | `boolean` | `false` | Disable dragging for this item |
| `asDropZone` | `boolean` | `false` | Force this item to be a drop target |
| `accept` | `(items) => boolean` | - | Validate if drop is allowed |

## Slot Props

The default slot receives state information:

```vue
<FreeformItem :item="item">
  <template #default="{ item, selected, dragging, dropTarget, dropAccepted }">
    <div :class="{
      'ring-blue-500': selected,
      'opacity-50': dragging,
      'ring-green-500': dropTarget && dropAccepted,
      'ring-red-500': dropTarget && !dropAccepted,
    }">
      {{ item.name }}
    </div>
  </template>
</FreeformItem>
```

| Prop | Type | Description |
|------|------|-------------|
| `item` | `object` | The item data |
| `selected` | `boolean` | Item is selected |
| `dragging` | `boolean` | Item is being dragged |
| `dropTarget` | `boolean` | Item is a drop target (hovering) |
| `dropAccepted` | `boolean` | Drop would be accepted |

## Containers

Items with `type: 'container'` automatically become drop targets:

```ts
const items = ref([
  { id: 'folder', type: 'container' },  // Drop target
  { id: 'file' },                        // Normal item
])
```

Or force any item to be a drop target:

```vue
<FreeformItem :item="item" :as-drop-zone="true" />
```

## Accept Function

Control which drops are allowed:

```vue
<FreeformItem
  :item="folder"
  :accept="acceptFiles"
>
```

```ts
// Only accept non-folder items
function acceptFiles(draggedItems: FreeformItemData[]) {
  return draggedItems.every(item => item.type !== 'container')
}
```

When the accept function returns `false`:
- Visual feedback shows red instead of green
- The `@drop-into` event still fires with `accepted: false`

## Default Styling

Without a custom slot, items get default styling:

- **Normal**: Neutral background
- **Selected**: Primary ring
- **Dragging**: Reduced opacity
- **Container (drop target)**: Green or red ring based on `accepted`

Override by providing a custom slot template.
