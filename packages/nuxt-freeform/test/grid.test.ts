import { describe, it, expect } from 'vitest'
import { resolveGridDrop, resolveGridWishes } from '../src/runtime/utils/grid'
import type { GridCell } from '../src/runtime/types'

const GRID = { columns: 5, rows: 4 }

function cells(...pairs: [number, number][]): GridCell[] {
  return pairs.map(([x, y]) => ({ x, y }))
}

describe('resolveGridDrop', () => {
  it('moves a single item onto the target cell', () => {
    const result = resolveGridDrop({
      dragged: [{ id: 'a', cell: { x: 0, y: 0 } }],
      anchorId: 'a',
      target: { x: 3, y: 2 },
      occupied: [],
      ...GRID,
    })

    expect(result.get('a')).toEqual({ x: 3, y: 2 })
  })

  it('keeps the relative offset of the whole selection', () => {
    const result = resolveGridDrop({
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 1, y: 0 } },
        { id: 'c', cell: { x: 0, y: 1 } },
      ],
      anchorId: 'a',
      target: { x: 2, y: 1 },
      occupied: [],
      ...GRID,
    })

    expect(result.get('a')).toEqual({ x: 2, y: 1 })
    expect(result.get('b')).toEqual({ x: 3, y: 1 })
    expect(result.get('c')).toEqual({ x: 2, y: 2 })
  })

  it('anchors on the grabbed item, not the first one', () => {
    const result = resolveGridDrop({
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 1, y: 0 } },
      ],
      anchorId: 'b',
      target: { x: 4, y: 3 },
      occupied: [],
      ...GRID,
    })

    expect(result.get('b')).toEqual({ x: 4, y: 3 })
    expect(result.get('a')).toEqual({ x: 3, y: 3 })
  })

  it('dodges to the next free cell instead of rejecting the drop', () => {
    const result = resolveGridDrop({
      dragged: [{ id: 'a', cell: { x: 0, y: 0 } }],
      anchorId: 'a',
      target: { x: 2, y: 2 },
      occupied: cells([2, 2]),
      ...GRID,
    })

    expect(result.get('a')).toEqual({ x: 3, y: 2 })
  })

  it('does not let a dodging item displace one that fits', () => {
    // b wants (3,1) and it is free - it must keep it, even though a dodges first
    const result = resolveGridDrop({
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 1, y: 0 } },
      ],
      anchorId: 'a',
      target: { x: 2, y: 1 },
      occupied: cells([2, 1]),
      ...GRID,
    })

    expect(result.get('b')).toEqual({ x: 3, y: 1 })
    expect(result.get('a')).not.toEqual({ x: 3, y: 1 })
  })

  it('clamps the group into the grid instead of clipping single items', () => {
    const result = resolveGridDrop({
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 1, y: 0 } },
      ],
      anchorId: 'a',
      target: { x: 4, y: 0 },
      occupied: [],
      ...GRID,
    })

    // Block shifted left by one so b still fits - offset preserved
    expect(result.get('a')).toEqual({ x: 3, y: 0 })
    expect(result.get('b')).toEqual({ x: 4, y: 0 })
  })

  it('clamps negative positions back into the grid', () => {
    const result = resolveGridDrop({
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 2, y: 2 } },
      ],
      anchorId: 'b',
      target: { x: 0, y: 0 },
      occupied: [],
      ...GRID,
    })

    expect(result.get('a')).toEqual({ x: 0, y: 0 })
    expect(result.get('b')).toEqual({ x: 2, y: 2 })
  })

  it('ignores cells released by the dragged items themselves', () => {
    // a moves onto b's old cell while b is dragged too - must not dodge
    const result = resolveGridDrop({
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 1, y: 0 } },
      ],
      anchorId: 'a',
      target: { x: 1, y: 0 },
      occupied: [],
      ...GRID,
    })

    expect(result.get('a')).toEqual({ x: 1, y: 0 })
    expect(result.get('b')).toEqual({ x: 2, y: 0 })
  })

  it('leaves an item where it was when the grid is full', () => {
    const occupied: GridCell[] = []
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) occupied.push({ x, y })
    }

    const result = resolveGridDrop({
      dragged: [{ id: 'a', cell: { x: 0, y: 0 } }],
      anchorId: 'a',
      target: { x: 1, y: 1 },
      occupied: occupied.filter(c => !(c.x === 0 && c.y === 0)),
      columns: 2,
      rows: 2,
    })

    expect(result.get('a')).toEqual({ x: 0, y: 0 })
  })

  it('reports no placement when the grid is full and the old cell is outside it', () => {
    // Raster shrank to 2x2 and every cell is taken - the stray at (5,5)
    // must not be placed back outside the grid
    const occupied: GridCell[] = cells([0, 0], [1, 0], [0, 1], [1, 1])

    const result = resolveGridDrop({
      dragged: [{ id: 'stray', cell: { x: 5, y: 5 } }],
      anchorId: 'stray',
      target: { x: 1, y: 1 },
      occupied,
      columns: 2,
      rows: 2,
    })

    expect(result.has('stray')).toBe(false)
  })

  it('yields no placement when the target cell is blocked', () => {
    // Cursor is over a folder - the drop is a move-into, not a placement
    const result = resolveGridDrop({
      dragged: [{ id: 'a', cell: { x: 0, y: 1 } }],
      anchorId: 'a',
      target: { x: 2, y: 0 },
      occupied: cells([2, 0]),
      blocked: cells([2, 0]),
      ...GRID,
    })

    expect(result.size).toBe(0)
  })

  it('never dodges onto a blocked cell', () => {
    // (3,0) is free but blocked, so the dodge must skip past it
    const result = resolveGridDrop({
      dragged: [{ id: 'a', cell: { x: 0, y: 1 } }],
      anchorId: 'a',
      target: { x: 2, y: 0 },
      occupied: cells([2, 0]),
      blocked: cells([3, 0]),
      ...GRID,
    })

    expect(result.get('a')).not.toEqual({ x: 3, y: 0 })
    expect(result.get('a')).toEqual({ x: 4, y: 0 })
  })

  it('returns nothing for an empty selection', () => {
    const result = resolveGridDrop({
      dragged: [],
      anchorId: 'a',
      target: { x: 0, y: 0 },
      occupied: [],
      ...GRID,
    })

    expect(result.size).toBe(0)
  })
})

describe('resolveGridWishes', () => {
  it('clamping is not dodging: wishes match the result at the edge', () => {
    const options = {
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 1, y: 0 } },
      ],
      anchorId: 'a',
      target: { x: 4, y: 0 },
      occupied: [],
      ...GRID,
    }

    const wishes = resolveGridWishes(options)
    const placed = resolveGridDrop(options)

    // Group was clamped left by one, but nothing was in the way - so for
    // every item the wish equals where it landed: no dodge happened.
    for (const [id, cell] of placed) {
      expect(wishes.get(id)).toEqual(cell)
    }
  })

  it('marks a real dodge as a mismatch against the wish', () => {
    const options = {
      dragged: [{ id: 'a', cell: { x: 0, y: 0 } }],
      anchorId: 'a',
      target: { x: 2, y: 2 },
      occupied: cells([2, 2]),
      ...GRID,
    }

    expect(resolveGridWishes(options).get('a')).toEqual({ x: 2, y: 2 })
    expect(resolveGridDrop(options).get('a')).toEqual({ x: 3, y: 2 })
  })

  it('the anchor is not on the target cell once the group gets clamped', () => {
    // Documented caveat: near an edge the grabbed item moves too
    const wishes = resolveGridWishes({
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 1, y: 0 } },
      ],
      anchorId: 'b',
      target: { x: 0, y: 0 },
      occupied: [],
      ...GRID,
    })

    expect(wishes.get('b')).not.toEqual({ x: 0, y: 0 })
    expect(wishes.get('b')).toEqual({ x: 1, y: 0 })
    expect(wishes.get('a')).toEqual({ x: 0, y: 0 })
  })

  it('is unaffected by which item is listed first', () => {
    const wishes = resolveGridWishes({
      dragged: [
        { id: 'a', cell: { x: 0, y: 0 } },
        { id: 'b', cell: { x: 2, y: 1 } },
      ],
      anchorId: 'b',
      target: { x: 3, y: 2 },
      occupied: [],
      ...GRID,
    })

    expect(wishes.get('b')).toEqual({ x: 3, y: 2 })
    expect(wishes.get('a')).toEqual({ x: 1, y: 1 })
  })
})
