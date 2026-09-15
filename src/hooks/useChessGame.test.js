import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useChessGame } from './useChessGame'

describe('useChessGame', () => {
  it('starts at the initial position by default', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.fen).toMatch(/^rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR/)
    expect(result.current.moves).toHaveLength(0)
    expect(result.current.moveRows).toHaveLength(0)
  })

  it('loads a custom FEN on mount', () => {
    // chess.js normalises the en-passant square to '-' when no capture is
    // possible, so we compare against the normalised form returned by fen().
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    const { result } = renderHook(() => useChessGame(fen))
    // The en-passant field may be normalised; the position must be equivalent.
    expect(result.current.fen).toMatch(/^rnbqkbnr\/pppppppp\/8\/8\/4P3\/8\/PPPP1PPP\/RNBQKBNR b KQkq/)
  })

  it('applyMove returns the move and updates state', () => {
    const { result } = renderHook(() => useChessGame())
    let move
    act(() => { move = result.current.applyMove('e2', 'e4') })
    expect(move).not.toBeNull()
    expect(move.san).toBe('e4')
    expect(result.current.moves).toHaveLength(1)
    expect(result.current.moves[0].san).toBe('e4')
  })

  it('applyMove returns null for an illegal move', () => {
    const { result } = renderHook(() => useChessGame())
    let move
    act(() => { move = result.current.applyMove('e2', 'e5') }) // illegal
    expect(move).toBeNull()
    expect(result.current.moves).toHaveLength(0)
  })

  it('applyEngineMove uses sanOverride when provided', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.applyMove('e2', 'e4') }) // white move
    act(() => { result.current.applyEngineMove('e7', 'e5', 'e5!') })
    const last = result.current.moves[result.current.moves.length - 1]
    expect(last.san).toBe('e5!')
  })

  it('applyEngineMove throws on invalid move', () => {
    const { result } = renderHook(() => useChessGame())
    expect(() => {
      act(() => { result.current.applyEngineMove('e7', 'e5') }) // wrong turn
    }).toThrow()
  })

  it('undoMoves removes up to 2 plies and returns count', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.applyMove('e2', 'e4') })
    act(() => { result.current.applyEngineMove('e7', 'e5') })
    expect(result.current.moves).toHaveLength(2)

    let count
    act(() => { count = result.current.undoMoves() })
    expect(count).toBe(2)
    expect(result.current.moves).toHaveLength(0)
  })

  it('undoMoves returns 0 when there is nothing to undo', () => {
    const { result } = renderHook(() => useChessGame())
    let count
    act(() => { count = result.current.undoMoves() })
    expect(count).toBe(0)
    expect(result.current.moves).toHaveLength(0)
  })

  it('undoMoves removes only 1 ply when only 1 move was made', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.applyMove('e2', 'e4') })
    let count
    act(() => { count = result.current.undoMoves() })
    expect(count).toBe(1)
    expect(result.current.moves).toHaveLength(0)
  })

  it('resetGame clears moves and returns to start position', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.applyMove('e2', 'e4') })
    act(() => { result.current.resetGame() })
    expect(result.current.moves).toHaveLength(0)
    expect(result.current.fen).toMatch(/^rnbqkbnr\/pppppppp/)
  })

  it('loadFen returns true and updates fen on valid FEN', () => {
    const { result } = renderHook(() => useChessGame())
    // Use a FEN without en-passant square to avoid normalisation differences.
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    let ok
    act(() => { ok = result.current.loadFen(fen) })
    expect(ok).toBe(true)
    expect(result.current.fen).toBe(fen)
    expect(result.current.moves).toHaveLength(0)
  })

  it('loadFen returns false and does not change state on invalid FEN', () => {
    const { result } = renderHook(() => useChessGame())
    const originalFen = result.current.fen
    let ok
    act(() => { ok = result.current.loadFen('not-a-valid-fen') })
    expect(ok).toBe(false)
    expect(result.current.fen).toBe(originalFen)
  })

  it('moveRows groups moves into pairs with correct turn numbers', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.applyMove('e2', 'e4') })
    act(() => { result.current.applyEngineMove('e7', 'e5') })
    act(() => { result.current.applyMove('d2', 'd4') })
    expect(result.current.moveRows).toHaveLength(2)
    expect(result.current.moveRows[0]).toEqual({ turn: 1, white: 'e4', black: 'e5' })
    expect(result.current.moveRows[1]).toEqual({ turn: 2, white: 'd4', black: '' })
  })
})
