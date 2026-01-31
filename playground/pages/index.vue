<script setup lang="ts">
const routes = [
  { name: 'Minimal', path: '/minimal', image: '/img/logo-minimal.png', description: 'Zero-config, all defaults' },
  { name: 'Basics', path: '/basics', image: '/img/logo-basics.png', description: 'Simple drag & drop with selection' },
  { name: 'Files & Folders', path: '/files-and-folders', image: '/img/logo-file-and-folders.png', description: 'Drop files into folders' },
  { name: 'DropZones', path: '/dropzones', image: '/img/logo-drop-zone.png', description: 'Drag between multiple lists' },
  { name: 'Scrolling', path: '/scrolling', image: '/img/logo-scroll.png', description: 'Auto-scroll near edges' },
  { name: 'Desktop', path: '/desktop', image: '/img/logo-desktop.png', description: 'Full desktop experience' },
  { name: 'Freeform', path: '/freeform', image: '/img/logo-freeform.png', description: 'Grid-based free positioning' },
]
</script>

<template>
  <div class="px-8 py-6 min-h-[calc(100vh-96px)]">
    <!-- Header with title and links -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold mb-2 text-white">
          nuxt-freeform
        </h1>
        <p class="text-white/60">
          Desktop-like drag & drop for Nuxt/Vue
        </p>
      </div>

      <!-- External links -->
      <div class="flex items-center gap-3">
        <a
          href="https://heuberger.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-white/20 rounded-lg transition-all group"
        >
          <img
            src="/img/heuberger-dev-logo-small.png"
            alt="heuberger.dev"
            class="w-5 h-5 rounded"
          >
          <span class="text-white/70 group-hover:text-white text-sm font-medium">heuberger.dev</span>
        </a>

        <a
          href="https://nuxt.care"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-white/20 rounded-lg transition-all group"
        >
          <img
            src="/img/nuxt.care-logo-quadrat.png"
            alt="nuxt.care"
            class="w-5 h-5 rounded"
          >
          <span class="text-white/70 group-hover:text-white text-sm font-medium">nuxt.care</span>
        </a>

        <a
          href="https://github.com/Flo0806/nuxt-freeform"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-white/20 rounded-lg transition-all group"
        >
          <svg
            class="w-5 h-5 text-white/70 group-hover:text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span class="text-white/70 group-hover:text-white text-sm font-medium">GitHub</span>
        </a>
      </div>
    </div>

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
