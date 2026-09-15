import { useCallback, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'

/**
 * Manages the chess game state: position, move history, undo, FEN sync and
 * URL persistence.
 *
 * @param {string|null} initialFen  - FEN to load at startup, or null for the
 *                                    starting position.
 *
 * Returns:
 *   gameRef      – React ref holding the Chess instance (stable reference)
 *   fen          – current FEN string (reactive)
 *   moves        – array of { color, san } move objects
 *   applyMove    – (from, to, promotion?) => move object | null
 *   undoMoves    – () => number of plies removed (0 if nothing to undo)
 *   resetGame    – () => resets to starting position
 *   loadFen      – (fen) => boolean — loads an arbitrary FEN; returns false on parse error
 *   moveRows     – memoised array of { turn, white, black } for the moves table
 */
export function useChessGame(initialFen = null) {
  const gameRef = useRef(null)

  // Initialise game once.
  if (gameRef.current === null) {
    const g = new Chess()
    if (initialFen) {
      try { g.load(initialFen) } catch { /* ignore, keep start position */ }
    }
    gameRef.current = g
  }

  const [fen, setFen] = useState(() => gameRef.current.fen())
  const [moves, setMoves] = useState([])

  /** Apply a move and update reactive state. Returns the chess.js move object or null. */
  const applyMove = useCallback((from, to, promotion) => {
    let move
    try {
      move = gameRef.current.move({ from, to, promotion })
    } catch {
      return null
    }
    if (!move) return null
    setFen(gameRef.current.fen())
    setMoves((prev) => [...prev, { color: move.color, san: move.san }])
    return move
  }, [])

  /**
   * Apply a move coming from the engine, allowing an override for the SAN
   * string (the API may return a nicer version than chess.js produces).
   */
  const applyEngineMove = useCallback((from, to, sanOverride, promotion) => {
    const move = gameRef.current.move({ from, to, promotion })
    if (!move) throw new Error(`Engine returned invalid move: ${from}${to}`)
    setFen(gameRef.current.fen())
    setMoves((prev) => [...prev, { color: move.color, san: sanOverride || move.san }])
    return move
  }, [])

  /** Undo up to 2 plies (one full round-trip: player + engine). Returns count removed. */
  const undoMoves = useCallback(() => {
    let count = 0
    for (let i = 0; i < 2; i++) {
      if (!gameRef.current.undo()) break
      count++
    }
    if (count > 0) {
      setFen(gameRef.current.fen())
      setMoves((prev) => prev.slice(0, Math.max(0, prev.length - count)))
    }
    return count
  }, [])

  /** Reset to starting position. */
  const resetGame = useCallback(() => {
    gameRef.current.reset()
    setFen(gameRef.current.fen())
    setMoves([])
  }, [])

  /**
   * Load an arbitrary FEN string.  Returns true on success, false if the FEN
   * is invalid (game state is unchanged on failure).
   */
  const loadFen = useCallback((newFen) => {
    try {
      gameRef.current.load(newFen)
      setFen(gameRef.current.fen())
      setMoves([])
      return true
    } catch {
      return false
    }
  }, [])

  const moveRows = useMemo(() => {
    const rows = []
    for (let i = 0; i < moves.length; i += 2) {
      rows.push({
        turn: rows.length + 1,
        white: moves[i]?.san || '',
        black: moves[i + 1]?.san || '',
      })
    }
    return rows
  }, [moves])

  return { gameRef, fen, moves, applyMove, applyEngineMove, undoMoves, resetGame, loadFen, moveRows }
}
