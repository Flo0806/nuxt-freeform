import { defineNuxtModule, addComponent, addImports, addImportsDir, createResolver } from '@nuxt/kit'
// Required so the emitted d.ts can name the module type (TS2742 under pnpm)
import type { NuxtModule } from '@nuxt/schema'

// Re-export types for consumers
export type {
  FreeformItemData,
  DropEventPayload,
  DragState,
  SelectionState,
  Position,
  Rect,
  DropTarget,
  DropTargetType,
  GridCell,
} from './runtime/types'

export type { GridPlacement, ResolveGridDropOptions } from './runtime/utils/grid'

// Also exported as values, so they work without auto-imports too
export { resolveGridDrop, resolveGridWishes } from './runtime/utils/grid'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModuleOptions {}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-freeform',
    configKey: 'nuxtFreeform',
  },
  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)

    // Auto-import components
    addComponent({
      name: 'TheFreeform',
      filePath: resolver.resolve('./runtime/components/TheFreeform.vue'),
    })
    addComponent({
      name: 'FreeformItem',
      filePath: resolver.resolve('./runtime/components/FreeformItem.vue'),
    })
    addComponent({
      name: 'FreeformSelection',
      filePath: resolver.resolve('./runtime/components/FreeformSelection.vue'),
    })
    addComponent({
      name: 'FreeformPlaceholder',
      filePath: resolver.resolve('./runtime/components/FreeformPlaceholder.vue'),
    })
    addComponent({
      name: 'FreeformDropZone',
      filePath: resolver.resolve('./runtime/components/FreeformDropZone.vue'),
    })
    addComponent({
      name: 'FreeformGrid',
      filePath: resolver.resolve('./runtime/components/FreeformGrid.vue'),
    })

    // Auto-import composables
    addImports({
      name: 'useFreeformContext',
      from: resolver.resolve('./runtime/composables/useFreeform'),
    })
    addImports({
      name: 'useAutoScroll',
      from: resolver.resolve('./runtime/composables/useAutoScroll'),
    })

    // Optional helpers (grid placement maths) - use them or ignore them
    addImportsDir(resolver.resolve('./runtime/utils'))
  },
})

export default module
