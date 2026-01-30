<script setup lang="ts">
import { watch } from 'vue'
import type { FreeformItemData } from '../types'
import { createFreeformContext } from '../composables/useFreeform'

const props = withDefaults(defineProps<{
  modelValue: FreeformItemData[]
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [items: FreeformItemData[]]
  'select': [items: FreeformItemData[]]
}>()

const { items, selectionState } = createFreeformContext()

watch(() => props.modelValue, (newItems) => {
  items.value = [...newItems]
}, { immediate: true, deep: true })

watch(() => selectionState.value.items, (selected) => {
  emit('select', [...selected])
}, { deep: true })
</script>

<template>
  <div
    class="freeform-container"
    :class="{ 'freeform-disabled': disabled }"
  >
    <slot
      :items="items"
      :selected="selectionState.items"
    />
  </div>
</template>

<style>
.freeform-container {
  position: relative;
  user-select: none;
}

.freeform-disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
