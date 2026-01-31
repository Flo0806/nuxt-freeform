# FreeformSelection

Wrapper component that enables lasso (rectangle) selection.

## Basic Usage

```vue
<FreeformSelection @select="onSelect">
  <TheFreeform v-model="items">
    <FreeformItem v-for="item in items" :key="item.id" :item="item" />
    <FreeformPlaceholder />
  </TheFreeform>
</FreeformSelection>
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `items[]` | Selected items changed |

## Slot Props

### Default Slot

```vue
<FreeformSelection>
  <template #default="{ isLassoActive, lassoRect, selected }">
    <TheFreeform v-model="items">
      <!-- ... -->
    </TheFreeform>
  </template>
</FreeformSelection>
```

| Prop | Type | Description |
|------|------|-------------|
| `isLassoActive` | `boolean` | Lasso selection in progress |
| `lassoRect` | `Rect` | Current lasso rectangle bounds |
| `selected` | `array` | Currently selected items |

### Lasso Slot

Customize the selection rectangle:

```vue
<FreeformSelection>
  <TheFreeform v-model="items">
    <!-- ... -->
  </TheFreeform>

  <template #lasso="{ rect, selectedCount }">
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
```

| Prop | Type | Description |
|------|------|-------------|
| `rect` | `Rect` | Lasso bounds `{ x, y, width, height }` |
| `selectedCount` | `number` | Number of items in selection |

## How Lasso Works

1. Click and drag on empty space (not on an item)
2. A selection rectangle appears
3. Items that intersect with the rectangle are selected
4. Release to confirm selection

Items clicked directly still work as expected:
- **Click**: Select single item
- **Ctrl/Cmd + Click**: Toggle item selection
