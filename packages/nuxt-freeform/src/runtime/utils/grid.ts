import type { GridCell } from '../types'

/**
 * An item participating in a grid drag, with the cell it currently occupies.
 */
export interface GridPlacement {
  id: string
  cell: GridCell
}

export interface ResolveGridDropOptions {
  /** Items being dragged, with the cells they occupied before the drag */
  dragged: GridPlacement[]
  /** Id of the item under the cursor - it defines the anchor of the group */
  anchorId: string
  /** Cell the anchor should land on */
  target: GridCell
  /** Cells taken by items that are NOT being dragged */
  occupied: Iterable<GridCell>
  columns: number
  rows: number
}

function key(cell: GridCell): string {
  return `${cell.x},${cell.y}`
}

/**
 * Scan for the next free cell, starting at `from` and walking row by row.
 * Wraps around to the top of the grid so a free cell is found whenever one exists.
 */
function findFreeCell(from: GridCell, taken: Set<string>, columns: number, rows: number): GridCell | null {
  const total = columns * rows
  const start = from.y * columns + from.x

  for (let step = 0; step < total; step++) {
    const index = (start + step) % total
    const cell: GridCell = { x: index % columns, y: Math.floor(index / columns) }
    if (!taken.has(key(cell))) return cell
  }

  return null
}

/**
 * Work out where a group of dragged items should land on a grid.
 *
 * Mirrors how desktop file managers behave: the grabbed item goes to the
 * target cell, every other selected item keeps its offset relative to it,
 * the group is clamped into the raster, and items whose cell is taken move
 * to the next free one instead of the drop being rejected.
 *
 * Items that find no free cell at all (full grid) are left where they were.
 *
 * @returns Map of item id to its new cell
 */
export function resolveGridDrop(options: ResolveGridDropOptions): Map<string, GridCell> {
  const { dragged, anchorId, target, occupied, columns, rows } = options
  const result = new Map<string, GridCell>()

  if (dragged.length === 0 || columns <= 0 || rows <= 0) return result

  const anchor = dragged.find(d => d.id === anchorId) ?? dragged[0]!

  // Wish position for each item: target cell plus its offset from the anchor
  const wishes = dragged.map(item => ({
    id: item.id,
    origin: item.cell,
    cell: {
      x: target.x + (item.cell.x - anchor.cell.x),
      y: target.y + (item.cell.y - anchor.cell.y),
    },
  }))

  // Clamp the group as a block, so the arrangement survives at the edges
  const minX = Math.min(...wishes.map(w => w.cell.x))
  const maxX = Math.max(...wishes.map(w => w.cell.x))
  const minY = Math.min(...wishes.map(w => w.cell.y))
  const maxY = Math.max(...wishes.map(w => w.cell.y))

  const shiftX = minX < 0 ? -minX : Math.min(0, columns - 1 - maxX)
  const shiftY = minY < 0 ? -minY : Math.min(0, rows - 1 - maxY)

  for (const wish of wishes) {
    wish.cell = { x: wish.cell.x + shiftX, y: wish.cell.y + shiftY }
  }

  // Cells held by items that stay put - the dragged ones release theirs first
  const taken = new Set<string>()
  for (const cell of occupied) taken.add(key(cell))

  // Items whose wish is free and inside the grid win it; the rest look for a
  // free cell afterwards, so they cannot displace an item that already fits.
  const pending: typeof wishes = []

  for (const wish of wishes) {
    const inside = wish.cell.x >= 0 && wish.cell.x < columns && wish.cell.y >= 0 && wish.cell.y < rows
    if (inside && !taken.has(key(wish.cell))) {
      taken.add(key(wish.cell))
      result.set(wish.id, wish.cell)
    }
    else {
      pending.push(wish)
    }
  }

  // Stable order, so the outcome does not depend on selection order
  pending.sort((a, b) => a.origin.y - b.origin.y || a.origin.x - b.origin.x)

  for (const wish of pending) {
    const from: GridCell = {
      x: Math.min(Math.max(wish.cell.x, 0), columns - 1),
      y: Math.min(Math.max(wish.cell.y, 0), rows - 1),
    }
    const free = findFreeCell(from, taken, columns, rows)
    if (free) {
      taken.add(key(free))
      result.set(wish.id, free)
    }
    else {
      // Grid is full - leave the item where it was
      result.set(wish.id, wish.origin)
    }
  }

  return result
}
