import { useEffect, useRef } from 'react'

/**
 * Returns a ref to attach to the scrollable moves table container.
 * Automatically scrolls to the bottom whenever `moveCount` increases.
 *
 * @param {number} moveCount  - Total number of moves (moves.length).
 */
export function useMovesScroll(moveCount) {
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [moveCount])

  return containerRef
}
