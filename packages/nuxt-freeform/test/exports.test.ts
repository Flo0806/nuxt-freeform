import { describe, it, expect } from 'vitest'
import * as entry from '../src/module'

// The package entry must expose the grid helpers as values, not just as
// types - otherwise `import { resolveGridDrop } from 'nuxt-freeform'`
// type-checks but blows up at runtime, and anyone running with
// `imports.autoImport: false` has no way to reach them at all.
describe('package entry', () => {
  it('exports the grid helpers as callable values', () => {
    expect(typeof entry.resolveGridDrop).toBe('function')
    expect(typeof entry.resolveGridWishes).toBe('function')
  })

  it('still has the module definition as default export', () => {
    expect(entry.default).toBeDefined()
  })
})
