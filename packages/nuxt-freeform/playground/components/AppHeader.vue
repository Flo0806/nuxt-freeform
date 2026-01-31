<script setup lang="ts">
const route = useRoute()
const showBack = computed(() => route.path !== '/')
</script>

<template>
  <header class="fixed h-14 flex items-center w-full top-0 left-0 bg-gray-800 text-white shadow-md z-10 px-4">
    <NuxtLink
      v-if="showBack"
      to="/"
      class="mr-3 flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </NuxtLink>
    <span><img
      src="/img/nuxt-freeform-logo.png"
      alt="Logo"
      width="48"
      height="48"
      class="mr-2 align-middle inline-block"
    ></span>
    <span class="text-2xl font-semibold">nuxt-freeform</span>
  </header>
</template>
