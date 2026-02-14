<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { FreeformItemData } from '../types'
import { useFreeformContext } from '../composables/useFreeform'

const props = defineProps<{
  item: FreeformItemData
  disabled?: boolean
  asDropZone?: boolean
  accept?: (items: FreeformItemData[]) => boolean
}>()

const context = useFreeformContext()
const elementRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (elementRef.value) {
    context.registerItem(props.item.id, elementRef.value)

    // Register as drop zone if container
    if (isContainer.value) {
      context.registerDropZone(props.item.id, elementRef.value, props.item, props.accept)
    }
  }
})

onUnmounted(() => {
  context.unregisterItem(props.item.id)

  // Unregister drop zone
  if (isContainer.value) {
    context.unregisterDropZone(props.item.id)
  }
})

const isSelected = computed(() =>
  context.selectionState.value.items.some((i: FreeformItemData) => i.id === props.item.id),
)

const isDragging = computed(() =>
  context.dragState.value.thresholdPassed
  && context.dragState.value.items.some((i: FreeformItemData) => i.id === props.item.id),
)

const actualIndex = computed(() =>
  context.items.value.findIndex(i => i.id === props.item.id),
)

const visualIndex = computed(() =>
  context.getVisualIndex(props.item.id),
)

// Container/DropZone logic
const isContainer = computed(() =>
  props.asDropZone || props.item.type === 'container',
)

const isDropTarget = computed(() =>
  context.currentDropTarget.value?.item?.id === props.item.id,
)

const isDropAccepted = computed(() =>
  isDropTarget.value && context.currentDropTarget.value?.accepted,
)

function hasHandle(): boolean {
  return !!elementRef.value?.querySelector('[data-freeform-handle]')
}

function isFromHandle(event: PointerEvent): boolean {
  const target = event.target as HTMLElement | null
  return !!target?.closest('[data-freeform-handle]')
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return

  // Stop propagation so container doesn't start lasso
  event.stopPropagation()

  // If a handle exists, only drag from it
  if (hasHandle() && !isFromHandle(event)) return

  // Handle selection on pointer down
  // Ctrl/Cmd+click toggles selection
  if (event.ctrlKey || event.metaKey) {
    context.select(props.item, { ctrl: true })
    return
  }

  // Start drag (will also select item if not already selected)
  context.startDrag(props.item, event)
}

function onClick(event: MouseEvent) {
  if (props.disabled) return

  // If a drag happened, don't change selection
  if (context.dragState.value.thresholdPassed) return

  // Ctrl+click was already handled in pointerdown
  if (event.ctrlKey || event.metaKey) return

  // Normal click selects only this item
  context.select(props.item)
}

// Note: Container drop detection is now handled centrally in useFreeform.ts
</script>

<template>
  <div
    ref="elementRef"
    class="freeform-item"
    :class="{
      'freeform-item--selected': isSelected,
      'freeform-item--dragging': isDragging,
      'freeform-item--disabled': disabled,
      'freeform-item--container': isContainer,
      'freeform-item--drop-target': isDropTarget,
      'freeform-item--drop-accepted': isDropAccepted,
      'freeform-item--drop-rejected': isDropTarget && !isDropAccepted,
    }"
    :style="{ order: visualIndex, display: isDragging ? 'none' : undefined }"
    data-freeform-item
    :data-index="actualIndex"
    :data-visual-index="visualIndex"
    @pointerdown="onPointerDown"
    @click="onClick"
  >
    <slot
      :item="item"
      :selected="isSelected"
      :dragging="isDragging"
      :index="actualIndex"
      :visual-index="visualIndex"
      :is-container="isContainer"
      :drop-target="isDropTarget"
      :drop-accepted="isDropAccepted"
    >
      <!-- Default item rendering -->
      <div class="freeform-item-default">
        {{ item.id }}
      </div>
    </slot>
  </div>
</template>

<style>
.freeform-item {
  touch-action: none;
  align-self: flex-start;
}

/* Default item styling */
.freeform-item-default {
  padding: 16px 24px;
  background: var(--freeform-color-neutral);
  border-radius: 8px;
  font-weight: 500;
  color: var(--freeform-color-text);
  transition: all 0.15s ease;
}

.freeform-item--selected .freeform-item-default {
  background: var(--freeform-color-primary-light);
  box-shadow: 0 0 0 2px var(--freeform-color-primary);
}

.freeform-item--drop-target.freeform-item--drop-accepted .freeform-item-default {
  background: var(--freeform-color-success-light);
  box-shadow: 0 0 0 2px var(--freeform-color-success);
  transform: scale(1.02);
}

.freeform-item--drop-target.freeform-item--drop-rejected .freeform-item-default {
  background: var(--freeform-color-danger-light);
  box-shadow: 0 0 0 2px var(--freeform-color-danger);
}
</style>
