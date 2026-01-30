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

    // Auto-import composables
    addImports({
      name: 'useFreeformContext',
      from: resolver.resolve('./runtime/composables/useFreeform'),
    })
  },
})
