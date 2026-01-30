import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { FreeformItemData, DragState, SelectionState } from '../types'

export const FREEFORM_CONTEXT_KEY: InjectionKey<FreeformContext> = Symbol('freeform-context')

export interface FreeformContext {
  items: Ref<FreeformItemData[]>
  dragState: Ref<DragState>
  selectionState: Ref<SelectionState>
  registerItem: (id: string, element: HTMLElement) => void
  unregisterItem: (id: string) => void
  select: (item: FreeformItemData, options?: { shift?: boolean, ctrl?: boolean }) => void
  clearSelection: () => void
}

export function createFreeformContext() {
  const itemElements = new Map<string, HTMLElement>()

  const items = ref<FreeformItemData[]>([])

  const dragState = ref<DragState>({
    active: false,
    items: [],
    startPosition: null,
    currentPosition: null,
    offset: null,
    thresholdPassed: false,
  })

  const selectionState = ref<SelectionState>({
    items: [],
    lassoActive: false,
    lassoRect: null,
  })

  const context: FreeformContext = {
    items,
    dragState,
    selectionState,

    registerItem(id: string, element: HTMLElement) {
      itemElements.set(id, element)
    },

    unregisterItem(id: string) {
      itemElements.delete(id)
    },

    select(item: FreeformItemData, options?: { shift?: boolean, ctrl?: boolean }) {
      if (options?.ctrl) {
        const idx = selectionState.value.items.findIndex(i => i.id === item.id)
        if (idx >= 0) {
          selectionState.value.items.splice(idx, 1)
        }
        else {
          selectionState.value.items.push(item)
        }
      }
      else {
        selectionState.value.items = [item]
      }
    },

    clearSelection() {
      selectionState.value.items = []
    },
  }

  provide(FREEFORM_CONTEXT_KEY, context)

  return {
    context,
    items,
    dragState,
    selectionState,
    itemElements,
  }
}

export function useFreeformContext(): FreeformContext {
  const context = inject(FREEFORM_CONTEXT_KEY)
  if (!context) {
    throw new Error('useFreeformContext must be used inside a <Freeform> component')
  }
  return context
}
