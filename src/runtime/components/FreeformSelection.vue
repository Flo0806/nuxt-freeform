<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted, provide } from 'vue'
import type { FreeformItemData, Position, Rect, SelectionState, RegisteredFreeform } from '../types'
import { SELECTION_CONTEXT_KEY } from '../types'

const emit = defineEmits<{
  select: [items: FreeformItemData[]]
}>()

// Registered freeform (shallowRef to prevent unwrapping nested refs)
const registeredFreeform = shallowRef<RegisteredFreeform | null>(null)

// Local selection state (used when no freeform is registered yet)
const selectionState = ref<SelectionState>({
  items: [],
  lassoActive: false,
  lassoRect: null,
})

// Lasso start position
let lassoStart: Position | null = null

function startLasso(event: PointerEvent) {
  if (!registeredFreeform.value) return
  if (registeredFreeform.value.disabled.value) return
  if (event.button !== 0) return

  lassoStart = { x: event.clientX, y: event.clientY }
  const initialRect: Rect = { x: event.clientX, y: event.clientY, width: 0, height: 0 }

  // Update local state
  selectionState.value.lassoActive = true
  selectionState.value.lassoRect = initialRect
  selectionState.value.items = []

  // Update freeform's selection state
  registeredFreeform.value.selectionState.value.lassoActive = true
  registeredFreeform.value.selectionState.value.lassoRect = initialRect
  registeredFreeform.value.selectionState.value.items = []
}

function handleLassoMove(event: PointerEvent) {
  if (!selectionState.value.lassoActive || !lassoStart || !registeredFreeform.value) return

  const currentX = event.clientX
  const currentY = event.clientY

  const rect: Rect = {
    x: Math.min(lassoStart.x, currentX),
    y: Math.min(lassoStart.y, currentY),
    width: Math.abs(currentX - lassoStart.x),
    height: Math.abs(currentY - lassoStart.y),
  }

  // Update local state
  selectionState.value.lassoRect = rect

  // Find items inside lasso rect
  const { items, itemElements } = registeredFreeform.value
  const selectedItems: FreeformItemData[] = []

  for (const [id, element] of itemElements) {
    if (isElementInRect(element, rect)) {
      const item = items.value.find(i => i.id === id)
      if (item) {
        selectedItems.push(item)
      }
    }
  }

  selectionState.value.items = selectedItems

  // Update freeform's selection state
  registeredFreeform.value.selectionState.value.lassoRect = rect
  registeredFreeform.value.selectionState.value.items = selectedItems

  emit('select', selectedItems)
}

function isElementInRect(element: HTMLElement, rect: Rect): boolean {
  const elRect = element.getBoundingClientRect()
  return !(
    elRect.right < rect.x
    || elRect.left > rect.x + rect.width
    || elRect.bottom < rect.y
    || elRect.top > rect.y + rect.height
  )
}

function endLasso() {
  lassoStart = null

  selectionState.value.lassoActive = false
  selectionState.value.lassoRect = null

  if (registeredFreeform.value) {
    registeredFreeform.value.selectionState.value.lassoActive = false
    registeredFreeform.value.selectionState.value.lassoRect = null
  }
}

function onPointerDown(event: PointerEvent) {
  // Only start lasso if not clicking on a freeform item
  const target = event.target as HTMLElement
  if (target.closest('[data-freeform-item]')) return

  startLasso(event)
}

function onPointerMove(event: PointerEvent) {
  if (selectionState.value.lassoActive) {
    handleLassoMove(event)
  }
}

function onPointerUp() {
  if (selectionState.value.lassoActive) {
    endLasso()
  }
}

// Provide context for Freeform to register
provide(SELECTION_CONTEXT_KEY, {
  registerFreeform: (ctx: RegisteredFreeform) => {
    registeredFreeform.value = ctx
  },
  unregisterFreeform: () => {
    registeredFreeform.value = null
  },
  selectionState,
})

// Computed for template
const isLassoActive = computed(() => selectionState.value.lassoActive)
const lassoRect = computed(() => selectionState.value.lassoRect)

const lassoStyle = computed(() => {
  if (!lassoRect.value) return { display: 'none' }
  return {
    position: 'fixed' as const,
    left: `${lassoRect.value.x}px`,
    top: `${lassoRect.value.y}px`,
    width: `${lassoRect.value.width}px`,
    height: `${lassoRect.value.height}px`,
    pointerEvents: 'none' as const,
    zIndex: 9998,
  }
})

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerUp)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('pointercancel', onPointerUp)
})
</script>

<template>
  <div class="freeform-selection">
    <slot
      :is-lasso-active="isLassoActive"
      :lasso-rect="lassoRect"
      :selected="selectionState.items"
    />

    <!-- Lasso Selection Box -->
    <Teleport to="body">
      <div
        v-if="isLassoActive && lassoRect"
        :style="lassoStyle"
      >
        <slot
          name="lasso"
          :rect="lassoRect"
          :selected-count="selectionState.items.length"
        >
          <div class="freeform-lasso" />
        </slot>
      </div>
    </Teleport>
  </div>
</template>

<style>
/* Basic styles - can be customized via slot */
.freeform-selection {
  display: contents;
}

.freeform-lasso {
  width: 100%;
  height: 100%;
  border: 1px dashed currentColor;
  background: rgba(128, 128, 128, 0.1);
}
</style>
