<script setup lang="ts">
const route = useRoute()
const showBack = computed(() => route.path !== '/')
</script>

<template>
  <header class="fixed h-14 flex items-center w-full top-0 left-0 bg-gray-800 text-white shadow-md z-10 px-4">
    <NuxtLink
      v-if="showBack"
      to="/"
      class="mr-4 text-white text-lg no-underline hover:text-gray-300"
    >
      ‹
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
