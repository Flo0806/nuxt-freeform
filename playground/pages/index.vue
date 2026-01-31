<script setup lang="ts">
const routes = [
  { name: 'Basics', path: '/basics' },
  { name: 'Advanced', path: '/advanced' },
  { name: 'Dynamic', path: '/dynamic' },
]
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">
      nuxt-freeform Playground
    </h1>

    <div>
      <h4>Choose your sample</h4>

      <NuxtLink
        v-for="route in routes"
        :key="route.path"
        :to="route.path"
        class="inline-block mr-4 mb-2 text-blue-600 hover:underline"
      >
        {{ route.name }}
      </NuxtLink>
    </div>
  </div>
</template>
