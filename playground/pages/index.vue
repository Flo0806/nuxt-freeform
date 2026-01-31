<script setup lang="ts">
const routes = [
  { name: 'Basics', path: '/basics', image: '/img/logo-basics.png', description: 'Simple drag & drop with selection' },
  { name: 'Files & Folders', path: '/files-and-folders', image: '/img/logo-file-and-folders.png', description: 'Drop files into folders' },
  { name: 'DropZones', path: '/dropzones', image: '/img/logo-drop-zone.png', description: 'Drag between multiple lists' },
  { name: 'Scrolling', path: '/scrolling', image: '/img/logo-scroll.png', description: 'Auto-scroll near edges' },
  { name: 'Desktop', path: '/desktop', image: '/img/logo-desktop.png', description: 'Full desktop experience' },
]
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <h1 class="text-3xl font-bold mb-2 text-white">
      nuxt-freeform
    </h1>
    <p class="text-white/60 mb-8">
      Desktop-like drag & drop for Nuxt/Vue
    </p>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <NuxtLink
        v-for="route in routes"
        :key="route.path"
        :to="route.path"
        class="group block"
      >
        <div class="bg-slate-800 rounded-xl overflow-hidden border border-white/10 transition-all hover:border-blue-500/50 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
          <div class="aspect-square overflow-hidden bg-slate-700">
            <img
              :src="route.image"
              :alt="route.name"
              class="w-full h-full object-cover transition-transform group-hover:scale-105"
            >
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-white mb-1">
              {{ route.name }}
            </h3>
            <p class="text-sm text-white/50">
              {{ route.description }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
