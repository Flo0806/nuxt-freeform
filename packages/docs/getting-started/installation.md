# Installation

## Quick Install

The easiest way to add nuxt-freeform to your Nuxt project:

```bash
npx nuxi module add nuxt-freeform
```

## Manual Installation

### 1. Install the package

```bash
pnpm add nuxt-freeform
```

### 2. Add to nuxt.config.ts

```ts
export default defineNuxtConfig({
  modules: ['nuxt-freeform']
})
```

That's it! All components are auto-imported and ready to use.

## What's Included

After installation, these components are available globally:

| Component | Description |
|-----------|-------------|
| `TheFreeform` | Main container that manages drag & drop state |
| `FreeformItem` | Individual draggable item |
| `FreeformPlaceholder` | Shows where items will land |
| `FreeformSelection` | Enables lasso selection |

## Requirements

- **Nuxt** 3.0+ (Nuxt 4 compatible)
- **Vue** 3.5+
- **Node.js** 18+

## Next Steps

Head to [Quick Start](/getting-started/quick-start) to build your first drag & drop interface.
