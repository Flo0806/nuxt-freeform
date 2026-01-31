<template>
  <div class="font-sans bg-slate-900">
    <AppHeader />
    <main class="pt-12">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
}

body {
  font-family: var(--font-sans);
  margin:0;
}
</style>
