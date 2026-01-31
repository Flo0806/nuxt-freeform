# FreeformPlaceholder

Visual indicator showing where dragged items will land.

## Basic Usage

```vue
<TheFreeform v-model="items">
  <FreeformItem v-for="item in items" :key="item.id" :item="item" />
  <FreeformPlaceholder />
</TheFreeform>
```

## Slot Props

```vue
<FreeformPlaceholder>
  <template #default="{ count, size }">
    <div class="my-placeholder">
      {{ count }} items
    </div>
  </template>
</FreeformPlaceholder>
```

| Prop | Type | Description |
|------|------|-------------|
| `count` | `number` | Number of items being dragged |
| `size` | `{ width, height }` | Size of the dragged item |

## Behavior

- Only visible during drag operations
- Automatically positions itself at the drop location
- Sizes to match the dragged item dimensions
- Hidden when dragging over a container (items will drop into container instead)

## Default Styling

Without a custom slot, the placeholder shows:
- Dashed border with primary color
- Semi-transparent background
- Matches dragged item size

## Custom Placeholder

```vue
<FreeformPlaceholder>
  <template #default="{ count }">
    <div class="
      border-2 border-dashed border-blue-500
      bg-blue-500/10 rounded-lg
      flex items-center justify-center
    ">
      <span class="text-blue-500 font-medium">
        Drop {{ count }} item{{ count > 1 ? 's' : '' }} here
      </span>
    </div>
  </template>
</FreeformPlaceholder>
```
