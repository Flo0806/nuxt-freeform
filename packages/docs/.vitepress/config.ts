import { defineConfig } from 'vitepress'

export default defineConfig({
  head: [['link', { rel: 'icon', href: '/logo-small.png' }]],
  title: 'nuxt-freeform',
  description: 'Desktop-like drag & drop for Nuxt/Vue',
  themeConfig: {
    siteTitle: 'nuxt-freeform',
    logo: '/logo-small.png',
    nav: [
      { text: 'Guide', link: '/getting-started/installation' },
      { text: 'Components', link: '/components/the-freeform' },
      { text: 'Examples', link: '/examples/minimal' },
      { text: 'GitHub', link: 'https://github.com/Flo0806/nuxt-freeform' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Quick Start', link: '/getting-started/quick-start' },
          { text: 'Concepts', link: '/getting-started/concepts' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'TheFreeform', link: '/components/the-freeform' },
          { text: 'FreeformItem', link: '/components/freeform-item' },
          { text: 'FreeformPlaceholder', link: '/components/freeform-placeholder' },
          { text: 'FreeformSelection', link: '/components/freeform-selection' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'Minimal', link: '/examples/minimal' },
          { text: 'File Manager', link: '/examples/file-manager' },
          { text: 'Custom Ghost', link: '/examples/custom-ghost' },
        ],
      },
      {
        text: 'API Reference',
        link: '/api/',
      },
    ],
    footer: {
      message: 'MIT Licensed',
      copyright: 'Made with love by Flo0806 - Creator of nuxt.care',
    },
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Flo0806/nuxt-freeform' },
    ],
  },
})
