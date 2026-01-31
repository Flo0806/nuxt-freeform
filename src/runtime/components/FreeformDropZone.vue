<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { FreeformItemData } from '../types'
import { useDropZoneRegistry } from '../composables/useDropZoneRegistry'

const props = defineProps<{
  id?: string
  accept?: (items: FreeformItemData[]) => boolean
}>()

const registry = useDropZoneRegistry()
const elementRef = ref<HTMLElement | null>(null)
const zoneId = props.id || `dropzone-${Math.random().toString(36).slice(2, 9)}`

// Reactive: is this zone being hovered?
const isOver = computed(() => registry.hoveredZoneId.value === zoneId)

// Reactive: are the items accepted?
const isAccepted = computed(() => {
  if (!isOver.value) return false
  if (!props.accept) return true
  return props.accept(registry.hoveredItems.value)
})

onMounted(() => {
  if (elementRef.value) {
    registry.register(zoneId, elementRef.value, props.accept)
  }
})

onUnmounted(() => {
  registry.unregister(zoneId)
})

defineExpose({
  zoneId,
  isOver,
  isAccepted,
})
</script>

<template>
  <div
    ref="elementRef"
    class="freeform-dropzone"
    :class="{
      'freeform-dropzone--over': isOver,
      'freeform-dropzone--accepted': isOver && isAccepted,
      'freeform-dropzone--rejected': isOver && !isAccepted,
    }"
    :data-dropzone-id="zoneId"
  >
    <slot
      :is-over="isOver"
      :is-accepted="isAccepted"
    />
  </div>
</template>

<style>
.freeform-dropzone {
  position: relative;
}
</style>
