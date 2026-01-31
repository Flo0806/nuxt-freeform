import { ref, unref, type MaybeRef } from 'vue'

export interface AutoScrollOptions {
  /** Pixels from edge where scrolling starts */
  threshold?: number
  /** Scroll speed in pixels per frame */
  speed?: number
  /** Max scroll speed (for acceleration near edge) */
  maxSpeed?: number
}

const defaultOptions: Required<AutoScrollOptions> = {
  threshold: 50,
  speed: 8,
  maxSpeed: 20,
}

/**
 * Auto-scroll when dragging near edges of a scrollable container.
 *
 * @example
 * ```vue
 * <script setup>
 * const scrollContainer = ref(null)
 * const { onDragMove, stop } = useAutoScroll(scrollContainer)
 *
 * function handleDragMove(items, pos) {
 *   onDragMove(pos)
 * }
 * </script>
 *
 * <template>
 *   <div ref="scrollContainer" class="overflow-auto h-[400px]">
 *     <TheFreeform @drag-move="handleDragMove" @drag-end="stop">
 *       ...
 *     </TheFreeform>
 *   </div>
 * </template>
 * ```
 */
export function useAutoScroll(
  container: MaybeRef<HTMLElement | null>,
  options: AutoScrollOptions = {},
) {
  const opts = { ...defaultOptions, ...options }
  const isScrolling = ref(false)
  let animationFrameId: number | null = null
  let currentScrollX = 0
  let currentScrollY = 0

  function calculateScrollSpeed(distance: number): number {
    // Accelerate as cursor gets closer to edge
    const ratio = 1 - (distance / opts.threshold)
    return Math.min(opts.speed + (ratio * opts.speed), opts.maxSpeed)
  }

  function scrollStep() {
    const el = unref(container)
    if (!el || (currentScrollX === 0 && currentScrollY === 0)) {
      isScrolling.value = false
      animationFrameId = null
      return
    }

    el.scrollLeft += currentScrollX
    el.scrollTop += currentScrollY

    animationFrameId = requestAnimationFrame(scrollStep)
  }

  /**
   * Call this on every drag move with cursor position.
   * Will auto-scroll if cursor is near container edges.
   */
  function onDragMove(position: { x: number, y: number }) {
    const el = unref(container)
    if (!el) return

    const rect = el.getBoundingClientRect()

    // Calculate distance from each edge
    const distanceLeft = position.x - rect.left
    const distanceRight = rect.right - position.x
    const distanceTop = position.y - rect.top
    const distanceBottom = rect.bottom - position.y

    // Determine scroll direction and speed
    currentScrollX = 0
    currentScrollY = 0

    // Horizontal
    if (distanceLeft < opts.threshold && distanceLeft > 0) {
      currentScrollX = -calculateScrollSpeed(distanceLeft)
    }
    else if (distanceRight < opts.threshold && distanceRight > 0) {
      currentScrollX = calculateScrollSpeed(distanceRight)
    }

    // Vertical
    if (distanceTop < opts.threshold && distanceTop > 0) {
      currentScrollY = -calculateScrollSpeed(distanceTop)
    }
    else if (distanceBottom < opts.threshold && distanceBottom > 0) {
      currentScrollY = calculateScrollSpeed(distanceBottom)
    }

    // Start animation loop if needed
    if ((currentScrollX !== 0 || currentScrollY !== 0) && !isScrolling.value) {
      isScrolling.value = true
      animationFrameId = requestAnimationFrame(scrollStep)
    }
  }

  /**
   * Stop auto-scrolling. Call on drag end.
   */
  function stop() {
    currentScrollX = 0
    currentScrollY = 0
    isScrolling.value = false
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  return {
    /** Call on drag-move with cursor position */
    onDragMove,
    /** Call on drag-end to stop scrolling */
    stop,
    /** Is currently auto-scrolling */
    isScrolling,
  }
}
