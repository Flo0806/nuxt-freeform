# Custom Ghost Example

Customize the drag ghost that follows the cursor.

## Basic Custom Ghost

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

## Ghost Slot Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | `array` | Items being dragged |
| `count` | `number` | Total number of items |
| `position` | `{ x, y }` | Current cursor position |
| `startPosition` | `{ x, y }` | Where drag started |

## Stacked Cards Ghost

Show a stack effect for multiple items:

```vue
<template #drag-ghost="{ items, count }">
  <div class="relative">
    <!-- Stack effect -->
    <div
      v-for="i in Math.min(count, 3)"
      :key="i"
      class="absolute bg-white rounded-lg shadow-md w-24 h-24"
      :style="{
        top: `${(i - 1) * 4}px`,
        left: `${(i - 1) * 4}px`,
        zIndex: 3 - i,
      }"
    />
    <!-- Top card with content -->
    <div class="relative z-10 bg-white rounded-lg shadow-xl p-4 w-24 h-24 flex flex-col items-center justify-center">
      <span class="text-3xl">{{ items[0]?.icon }}</span>
      <span v-if="count > 1" class="text-xs text-gray-500 mt-1">
        {{ count }} items
      </span>
    </div>
  </div>
</template>
```

## Transparent Clone

Make the ghost look like a semi-transparent copy of the original:

```vue
<template #drag-ghost="{ items }">
  <div class="opacity-75 pointer-events-none">
    <div class="flex flex-col items-center p-4 bg-blue-100 rounded-lg">
      <span class="text-4xl">{{ items[0]?.icon }}</span>
      <span class="mt-2 text-sm">{{ items[0]?.name }}</span>
    </div>
  </div>
</template>
```

## Tips

- The ghost is rendered in a `<Teleport to="body">` for proper positioning
- Use `pointer-events: none` to prevent the ghost from interfering with drop detection
- Keep the ghost lightweight - it updates on every mouse move
