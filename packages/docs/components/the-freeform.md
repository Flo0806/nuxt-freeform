# TheFreeform

The main container component that manages all drag & drop state.

## Basic Usage

```vue
<TheFreeform v-model="items" @drop-into="onDropInto">
  <FreeformItem v-for="item in items" :key="item.id" :item="item" />
  <FreeformPlaceholder />
</TheFreeform>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `FreeformItemData[]` | required | Items array (v-model) |
| `disabled` | `boolean` | `false` | Disable all interactions |
| `manualReorder` | `boolean` | `false` | Don't auto-reorder, handle `@reorder` manually |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `items[]` | Items array changed (reorder) |
| `select` | `items[]` | Selection changed |
| `drag-start` | `items[]` | Drag operation started |
| `drag-move` | `items[], position` | Dragging (with cursor position) |
| `drag-end` | `items[]` | Drag operation ended |
| `drop-into` | `items[], container, accepted` | Items dropped into a container |
| `reorder` | `fromIndex, toIndex` | Items reordered |

## Slots

### Default Slot

Receives state information:

```vue
<TheFreeform v-model="items">
  <template #default="{ items, selected, isDragging, dragItems, dropIndex }">
    <!-- Your content -->
  </template>
</TheFreeform>
```

| Prop | Type | Description |
|------|------|-------------|
| `items` | `array` | Current items |
| `selected` | `array` | Currently selected items |
| `isDragging` | `boolean` | Drag in progress |
| `dragItems` | `array` | Items being dragged |
| `dropIndex` | `number` | Where items will drop |

### drag-ghost

Custom ghost displayed while dragging:

```vue
<template #drag-ghost="{ items, count, position }">
  <div class="my-ghost">
    {{ items[0]?.name }}
    <span v-if="count > 1">+{{ count - 1 }}</span>
  </div>
</template>
```

## CSS Variables

Set these on the container to customize colors:

```css
.my-freeform {
  --freeform-color-primary: #3b82f6;
  --freeform-color-primary-light: #dbeafe;
  --freeform-color-success: #22c55e;
  --freeform-color-success-light: #dcfce7;
  --freeform-color-danger: #ef4444;
  --freeform-color-danger-light: #fee2e2;
  --freeform-color-neutral: #f3f4f6;
  --freeform-color-text: #374151;
}
```

## Manual Reorder

Set `manualReorder` to handle reordering yourself:

```vue
<TheFreeform
  v-model="items"
  :manual-reorder="true"
  @reorder="handleReorder"
>
```

```ts
function handleReorder(fromIndex: number, toIndex: number) {
  // Custom reorder logic
  const item = items.value.splice(fromIndex, 1)[0]
  items.value.splice(toIndex, 0, item)
}
```
