import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react'

vi.mock('./lib/loadChessboard3', () => ({
  ensureChessboard3Loaded: vi.fn(),
}))

import App from './App'
import { ensureChessboard3Loaded } from './lib/loadChessboard3'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  })
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Mock ChessBoard3 ─────────────────────────────────────────────────────────

let boardInstance = null

class MockChessBoard3 {
  constructor(id, options) {
    this.id = id
    this.options = options
    this.position = vi.fn()
    this.flip = vi.fn()
    this.orientation = vi.fn()
    this.destroy = vi.fn()
    boardInstance = this
  }
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    ensureChessboard3Loaded.mockResolvedValue()
    boardInstance = null
    window.history.replaceState({}, '', '/')

    // Clear localStorage so usePreferences always starts from defaults.
    localStorage.clear()

    Object.defineProperty(window, 'ChessBoard3', {
      writable: true,
      configurable: true,
      value: MockChessBoard3,
    })

    Object.defineProperty(navigator, 'language', {
      configurable: true,
      value: 'en-US',
    })

    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    })

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('*'),
      },
    })

    global.fetch = vi.fn((url, options) => {
      if (url.endsWith('/engines')) {
        return jsonResponse({
          engines: [
            { name: 'stockfish', healthy: true },
            { name: 'fruit', healthy: true },
          ],
          default: 'stockfish',
        })
      }
      if (url.endsWith('/health')) {
        return jsonResponse({}, { ok: true, status: 200 })
      }
      if (url.endsWith('/move') && options?.method === 'POST') {
        return jsonResponse({ success: true, response: { move: 'e7e5', san: 'e5' } })
      }
      return jsonResponse({}, { ok: false, status: 404 })
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  // ── Initialisation ──────────────────────────────────────────────────────────

  it('initializes board and shows white-to-move status', async () => {
    render(<App />)

    await waitFor(() => {
      expect(ensureChessboard3Loaded).toHaveBeenCalledTimes(1)
      expect(boardInstance).toBeTruthy()
    })

    expect(boardInstance.id).toBe('chessboard3-root')
    expect(await screen.findByText(/White to move/i)).toBeInTheDocument()
  })

  // ── Fallback engines ────────────────────────────────────────────────────────

  it('uses fallback engines and displays error when engines endpoint fails', async () => {
    global.fetch = vi.fn((url) => {
      if (url.endsWith('/engines')) return jsonResponse({ error: 'boom' }, { ok: false, status: 500 })
      if (url.endsWith('/health')) return jsonResponse({}, { ok: true })
      return jsonResponse({}, { ok: false, status: 404 })
    })

    render(<App />)

    expect(await screen.findByText(/Using fallback list/i)).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: /stockfish/i }).length).toBeGreaterThan(0)
  })

  // ── Language ────────────────────────────────────────────────────────────────

  it('changes UI language to Spanish', async () => {
    render(<App />)

    const languageSelect = await screen.findByRole('combobox', { name: /Language/i })
    fireEvent.change(languageSelect, { target: { value: 'es' } })

    expect(await screen.findByText(/Idioma/i)).toBeInTheDocument()
    expect(await screen.findByText(/Estado/i)).toBeInTheDocument()
  })

  // ── Engine move via UCI string ──────────────────────────────────────────────

  it('requests and applies engine move from UCI string', async () => {
    render(<App />)

    const fenInput = await screen.findByLabelText(/FEN/i)
    fireEvent.change(fenInput, {
      target: { value: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1' },
    })

    await wait(450)

    const engineMoveButton = screen.getByRole('button', { name: /Engine move now/i })
    expect(engineMoveButton).toBeEnabled()
    fireEvent.click(engineMoveButton)

    await waitFor(() => {
      expect(screen.getByText('e5')).toBeInTheDocument()
    })

    expect(boardInstance.position).toHaveBeenCalled()
    expect(await screen.findByText(/White to move/i)).toBeInTheDocument()
  })

  // ── FEN from URL ────────────────────────────────────────────────────────────

  it('loads board position from fen URL param', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1'
    window.history.replaceState({}, '', `/?fen=${encodeURIComponent(fen)}`)

    render(<App />)

    const fenInput = await screen.findByLabelText(/FEN/i)
    expect(fenInput).toHaveValue(fen)
    expect(boardInstance.position).toHaveBeenCalledWith(fen, false)
    expect(boardInstance.orientation).toHaveBeenCalledWith('black')
    expect(screen.getByRole('combobox', { name: /Play as/i })).toHaveValue('b')
    expect(screen.getByRole('button', { name: /Engine move now/i })).toBeDisabled()
  })

  it('falls back to flip and allows black move when fen URL turn is black', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq - 0 1'
    window.history.replaceState({}, '', `/?fen=${encodeURIComponent(fen)}`)

    render(<App />)
    await screen.findByLabelText(/FEN/i)

    expect(await screen.findByText(/Black to move/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Play as/i })).toHaveValue('b')
    expect(boardInstance.flip).toHaveBeenCalled()

    const dropResult = boardInstance.options.onDrop('a7', 'a6', null, null, {})
    expect(dropResult).toBeUndefined()
  })

  // ── URL persistence ─────────────────────────────────────────────────────────

  it('keeps fen in URL when position changes via input', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    render(<App />)

    const fenInput = await screen.findByLabelText(/FEN/i)
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1'
    fireEvent.change(fenInput, { target: { value: fen } })

    await waitFor(() => {
      expect(replaceStateSpy).toHaveBeenCalled()
      expect(new URLSearchParams(window.location.search).get('fen')).toBe(fen)
    })
  })

  // ── PGN clipboard ───────────────────────────────────────────────────────────

  it('copies PGN to clipboard in secure context', async () => {
    render(<App />)

    const button = await screen.findByRole('button', { name: /Copy PGN/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
    expect(navigator.clipboard.readText).toHaveBeenCalled()
  })

  it('downloads PGN when clipboard is unavailable', async () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Copy PGN/i }))

    await waitFor(() => expect(anchorClickSpy).toHaveBeenCalledTimes(1))

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/PGN downloaded/i)).toBeInTheDocument()
  })

  // ── Undo ────────────────────────────────────────────────────────────────────

  it('undo button removes the last move from the history table', async () => {
    render(<App />)

    // Set up a position where black is to move so we can drive one engine ply.
    const fenInput = await screen.findByLabelText(/FEN/i)
    fireEvent.change(fenInput, {
      target: { value: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1' },
    })
    await wait(450)

    // Click "Engine move now" to get one engine move recorded.
    fireEvent.click(screen.getByRole('button', { name: /Engine move now/i }))

    await waitFor(() => {
      expect(screen.getByText('e5')).toBeInTheDocument()
    })

    // Click Undo — the move should disappear from the table.
    fireEvent.click(screen.getByRole('button', { name: /Undo/i }))

    await waitFor(() => {
      expect(screen.queryByText('e5')).not.toBeInTheDocument()
    })
  })

  // ── Level slider ────────────────────────────────────────────────────────────

  it('shows level number and profile label in the slider label', async () => {
    render(<App />)
    await screen.findByText(/White to move/i)

    // Default level is 5 → Casual profile.
    expect(screen.getByText(/5 — Casual/i)).toBeInTheDocument()
  })

  it('updates the level profile label when the slider changes', async () => {
    render(<App />)
    await screen.findByText(/White to move/i)

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '15' } })

    expect(await screen.findByText(/15 — Advanced/i)).toBeInTheDocument()
  })

  it('slider has aria-valuetext with Elo annotation', async () => {
    render(<App />)
    await screen.findByText(/White to move/i)

    const slider = screen.getByRole('slider')
    expect(slider.getAttribute('aria-valuetext')).toMatch(/Elo/i)
  })

  // ── Promotion modal ─────────────────────────────────────────────────────────

  it('shows promotion modal when a pawn reaches the last rank', async () => {
    // FEN: white pawn on e7, black king on e8, white king on e1. White to move.
    const fen = '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1'
    window.history.replaceState({}, '', `/?fen=${encodeURIComponent(fen)}`)

    render(<App />)
    await waitFor(() => expect(boardInstance).toBeTruthy())
    // Wait for the board to be ready (status is rendered).
    await screen.findByText(/White to move/i)

    // Simulate dropping the pawn from e7 to e8 (promotion move).
    await act(async () => {
      boardInstance.options.onDrop('e7', 'e8', null, null, { e7: 'wP' })
    })

    // The modal should appear asynchronously after the drop.
    expect(await screen.findByText(/Choose promotion piece/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Queen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rook/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bishop/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Knight/i })).toBeInTheDocument()
  })

  it('closes promotion modal when Cancel is clicked', async () => {
    const fen = '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1'
    window.history.replaceState({}, '', `/?fen=${encodeURIComponent(fen)}`)

    render(<App />)
    await waitFor(() => expect(boardInstance).toBeTruthy())
    await screen.findByText(/White to move/i)

    await act(async () => {
      boardInstance.options.onDrop('e7', 'e8', null, null, { e7: 'wP' })
    })

    const cancelBtn = await screen.findByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Choose promotion piece/i)).not.toBeInTheDocument()
    })
  })

  // ── localStorage persistence ────────────────────────────────────────────────

  it('persists level preference to localStorage when slider changes', async () => {
    render(<App />)
    await screen.findByText(/White to move/i)

    fireEvent.change(screen.getByRole('slider'), { target: { value: '18' } })

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('chess3d_prefs') || '{}')
      expect(stored.level).toBe(18)
    })
  })

  it('restores level from localStorage on mount', async () => {
    localStorage.setItem('chess3d_prefs', JSON.stringify({ level: 17 }))
    render(<App />)
    await screen.findByText(/White to move/i)
    expect(screen.getByRole('slider')).toHaveValue('17')
  })
})
