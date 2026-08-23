---
layout: home
title: nuxt-freeform
titleTemplate: Desktop-like drag & drop for Nuxt/Vue
hero:
  name: nuxt-freeform
  text: Desktop-like Drag & Drop
  tagline: Lasso selection, reorder, drop into containers - all with sensible defaults.
  image:
    src: /logo.png
    alt: nuxt-freeform logo
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/Flo0806/nuxt-freeform
features:
  - title: Lasso Selection
    details: Select multiple items with a selection rectangle, just like on your desktop.
    icon: "🎯"
  - title: Drag & Drop
    details: Reorder items or drop into containers/folders with smooth animations.
    icon: "🖐️"
  - title: Multi-Select
    details: Ctrl/Cmd+Click to toggle selection, drag multiple items at once.
    icon: "✨"
  - title: Grid Mode
    details: Desktop icon grids - items keep their arrangement and dodge to free cells instead of refusing the drop.
    icon: "🗂️"
  - title: Zero Config
    details: Works out of the box with sensible defaults - batteries included.
    icon: "🔋"
  - title: Fully Customizable
    details: Override any visual via slots. CSS variables for easy theming.
    icon: "🎨"
  - title: SSR Safe
    details: Proper hydration support for Nuxt. TypeScript with full type support.
    icon: "🚀"
---

<div class="badges">
  <a href="https://www.npmjs.com/package/nuxt-freeform" target="_blank"><img src="https://img.shields.io/npm/v/nuxt-freeform?color=00DC82&label=npm" alt="npm version"></a>
  <a href="https://github.com/Flo0806/nuxt-freeform" target="_blank"><img src="https://img.shields.io/github/stars/Flo0806/nuxt-freeform?style=flat&color=00DC82" alt="GitHub stars"></a>
  <a href="https://www.npmjs.com/package/nuxt-freeform" target="_blank"><img src="https://img.shields.io/npm/dm/nuxt-freeform?color=00DC82" alt="npm downloads"></a>
  <a href="https://github.com/Flo0806/nuxt-freeform/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/Flo0806/nuxt-freeform?color=00DC82" alt="license"></a>
</div>

<div class="why-section">

## Why nuxt-freeform?

**There's no Nuxt module for drag & drop on nuxt.com/modules** - until now.

Most drag & drop libraries focus on list sorting. nuxt-freeform brings **desktop-like** interactions to Vue:

- **Lasso Selection** - Draw a rectangle to select multiple items
- **Drop into Folders** - Items with `type: 'container'` become drop targets
- **Everything is a Slot** - Full control over ghost, placeholder, items, and selection box
- **Grid Mode** - Snap items to a raster the way Finder and Explorer do, including multi-item drag and dodging

</div>

<style>
.badges {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 1.5rem 0 0 0;
}
.badges img {
  height: 22px;
}
.why-section {
  max-width: 800px;
  margin: 3rem auto;
  padding: 0 1.5rem;
}
.why-section h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}
</style>
