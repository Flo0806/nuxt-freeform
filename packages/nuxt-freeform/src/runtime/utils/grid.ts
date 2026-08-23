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
  /**
   * Cells that must never receive a placement, e.g. folders that swallow a
   * drop instead of taking a position. Dropping on one yields no placement
   * at all, so the caller can leave the items untouched.
   */
  blocked?: Iterable<GridCell>
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
 * Mirrors how desktop file managers behave: the grabbed item aims for the
 * target cell, every other selected item keeps its offset relative to it,
 * and items whose cell is taken move to the next free one instead of the
 * drop being rejected.
 *
 * Note the group is clamped into the raster as a block, so near an edge even
 * the grabbed item can end up beside the cell it was dropped on - report the
 * returned cells, not the target, if you tell the user where things landed.
 *
 * Items that find no free cell at all (full grid) keep their old cell, but
 * only if that cell is still inside the raster - otherwise they are left out
 * of the result entirely, so callers can tell placement failed.
 *
 * @returns Map of item id to its new cell
 */
/**
 * The cells the group would take if nothing were in the way: the target cell
 * for the anchor, every other item at its offset from it, and the whole block
 * clamped into the raster.
 *
 * Compare this against {@link resolveGridDrop} to tell which items had to
 * dodge an occupied cell - clamping alone is not dodging.
 *
 * @returns Map of item id to its wished-for cell
 */
export function resolveGridWishes(options: ResolveGridDropOptions): Map<string, GridCell> {
  const { dragged, anchorId, target, columns, rows } = options
  const result = new Map<string, GridCell>()

  if (dragged.length === 0 || columns <= 0 || rows <= 0) return result

  const anchor = dragged.find(d => d.id === anchorId) ?? dragged[0]!

  const wishes = dragged.map(item => ({
    id: item.id,
    cell: {
      x: target.x + (item.cell.x - anchor.cell.x),
      y: target.y + (item.cell.y - anchor.cell.y),
    },
  }))

  const minX = Math.min(...wishes.map(w => w.cell.x))
  const maxX = Math.max(...wishes.map(w => w.cell.x))
  const minY = Math.min(...wishes.map(w => w.cell.y))
  const maxY = Math.max(...wishes.map(w => w.cell.y))

  const shiftX = minX < 0 ? -minX : Math.min(0, columns - 1 - maxX)
  const shiftY = minY < 0 ? -minY : Math.min(0, rows - 1 - maxY)

  for (const wish of wishes) {
    result.set(wish.id, { x: wish.cell.x + shiftX, y: wish.cell.y + shiftY })
  }

  return result
}

export function resolveGridDrop(options: ResolveGridDropOptions): Map<string, GridCell> {
  const { dragged, target, occupied, blocked, columns, rows } = options
  const result = new Map<string, GridCell>()

  if (dragged.length === 0 || columns <= 0 || rows <= 0) return result

  // The target itself is off limits - the drop means something else there
  const blockedKeys = new Set<string>()
  for (const cell of blocked ?? []) blockedKeys.add(key(cell))
  if (blockedKeys.has(key(target))) return result

  const wished = resolveGridWishes(options)
  const wishes = dragged.map(item => ({
    id: item.id,
    origin: item.cell,
    cell: wished.get(item.id)!,
  }))

  // Cells held by items that stay put - the dragged ones release theirs first
  const taken = new Set<string>()
  for (const cell of occupied) taken.add(key(cell))
  for (const cellKey of blockedKeys) taken.add(cellKey)

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
    else if (
      wish.origin.x >= 0 && wish.origin.x < columns
      && wish.origin.y >= 0 && wish.origin.y < rows
    ) {
      // Grid is full - leave the item where it was
      result.set(wish.id, wish.origin)
    }
    // Origin is outside the raster too: no valid cell exists, report nothing
  }

  return result
}
