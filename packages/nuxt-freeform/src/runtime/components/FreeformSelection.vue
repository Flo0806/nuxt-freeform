<script setup lang="ts">
import { shallowRef, computed, watch, onMounted, onUnmounted, provide } from 'vue'
import type { FreeformItemData, Position, Rect, RegisteredFreeform } from '../types'
import { SELECTION_CONTEXT_KEY } from '../types'

const emit = defineEmits<{
  select: [items: FreeformItemData[]]
}>()

// Registered freeform - this is the SINGLE SOURCE OF TRUTH for selection
const registeredFreeform = shallowRef<RegisteredFreeform | null>(null)

// Lasso start position (local UI state only)
let lassoStart: Position | null = null

// Computed accessors to the freeform's selection state
const selectionState = computed(() => registeredFreeform.value?.selectionState.value ?? null)
const isLassoActive = computed(() => selectionState.value?.lassoActive ?? false)
const lassoRect = computed(() => selectionState.value?.lassoRect ?? null)
const selectedItems = computed(() => selectionState.value?.items ?? [])

// Watch selection changes and emit select event
watch(selectedItems, (items) => {
  emit('select', [...items])
}, { deep: true })

function startLasso(event: PointerEvent) {
  if (!registeredFreeform.value) return
  if (registeredFreeform.value.disabled.value) return
  if (event.button !== 0) return

  lassoStart = { x: event.clientX, y: event.clientY }
  const initialRect: Rect = { x: event.clientX, y: event.clientY, width: 0, height: 0 }

  // Prevent browser text selection during lasso
  document.body.style.userSelect = 'none'

  // Update freeform's selection state (single source of truth)
  const state = registeredFreeform.value.selectionState.value
  state.lassoActive = true
  state.lassoRect = initialRect
  state.items = []
}

function handleLassoMove(event: PointerEvent) {
  if (!registeredFreeform.value || !isLassoActive.value || !lassoStart) return

  const currentX = event.clientX
  const currentY = event.clientY

  const rect: Rect = {
    x: Math.min(lassoStart.x, currentX),
    y: Math.min(lassoStart.y, currentY),
    width: Math.abs(currentX - lassoStart.x),
    height: Math.abs(currentY - lassoStart.y),
  }

  // Find items inside lasso rect
  const { items, itemElements } = registeredFreeform.value
  const foundItems: FreeformItemData[] = []

  for (const [id, element] of itemElements) {
    if (isElementInRect(element, rect)) {
      const item = items.value.find(i => i.id === id)
      if (item) {
        foundItems.push(item)
      }
    }
  }

  // Update freeform's selection state (single source of truth)
  const state = registeredFreeform.value.selectionState.value
  state.lassoRect = rect
  state.items = foundItems
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

  // Re-enable browser text selection
  document.body.style.userSelect = ''

  if (registeredFreeform.value) {
    const state = registeredFreeform.value.selectionState.value
    state.lassoActive = false
    state.lassoRect = null
  }
}

function onPointerDown(event: PointerEvent) {
  // Only start lasso if not clicking on a freeform item
  const target = event.target as HTMLElement
  if (target.closest('[data-freeform-item]')) return

  startLasso(event)
}

function onPointerMove(event: PointerEvent) {
  if (isLassoActive.value) {
    handleLassoMove(event)
  }
}

function onPointerUp() {
  if (isLassoActive.value) {
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
})

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
      :selected="selectedItems"
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
          :selected-count="selectedItems.length"
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
  border: 1px dashed var(--freeform-color-primary);
  background: color-mix(in srgb, var(--freeform-color-primary) 10%, transparent);
}
</style>
