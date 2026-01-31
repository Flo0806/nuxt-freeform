import { defineNuxtModule, addComponent, addImports, createResolver } from '@nuxt/kit'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
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

    // Auto-import composables
    addImports({
      name: 'useFreeformContext',
      from: resolver.resolve('./runtime/composables/useFreeform'),
    })
    addImports({
      name: 'useAutoScroll',
      from: resolver.resolve('./runtime/composables/useAutoScroll'),
    })
  },
})
