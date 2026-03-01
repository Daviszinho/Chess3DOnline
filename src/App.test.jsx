import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('./lib/loadChessboard3', () => ({
  ensureChessboard3Loaded: vi.fn(),
}))

import App from './App'
import { ensureChessboard3Loaded } from './lib/loadChessboard3'

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  })
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

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

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    ensureChessboard3Loaded.mockResolvedValue()
    boardInstance = null
    window.history.replaceState({}, '', '/')

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
          engines: [{ name: 'stockfish', healthy: true }, { name: 'fruit', healthy: true }],
          default: 'stockfish',
        })
      }
      if (url.endsWith('/health')) {
        return jsonResponse({}, { ok: true, status: 200 })
      }
      if (url.endsWith('/move') && options?.method === 'POST') {
        return jsonResponse({
          success: true,
          response: {
            move: 'e7e5',
            san: 'e5',
          },
        })
      }
      return jsonResponse({}, { ok: false, status: 404 })
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('initializes board and shows healthy status', async () => {
    render(<App />)

    await waitFor(() => {
      expect(ensureChessboard3Loaded).toHaveBeenCalledTimes(1)
      expect(boardInstance).toBeTruthy()
    })
    expect(boardInstance.id).toBe('chessboard3-root')
    expect(await screen.findByText(/White to move/i)).toBeInTheDocument()
  })

  it('uses fallback engines and displays error when engines endpoint fails', async () => {
    global.fetch = vi.fn((url) => {
      if (url.endsWith('/engines')) {
        return jsonResponse({ error: 'boom' }, { ok: false, status: 500 })
      }
      if (url.endsWith('/health')) {
        return jsonResponse({}, { ok: true, status: 200 })
      }
      return jsonResponse({}, { ok: false, status: 404 })
    })

    render(<App />)

    expect(await screen.findByText(/Using fallback list/i)).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: /stockfish/i }).length).toBeGreaterThan(0)
  })

  it('changes UI language to Spanish', async () => {
    render(<App />)

    const languageSelect = await screen.findByRole('combobox', { name: /Language/i })
    fireEvent.change(languageSelect, { target: { value: 'es' } })

    expect(await screen.findByText(/Idioma/i)).toBeInTheDocument()
    expect(await screen.findByText(/Estado/i)).toBeInTheDocument()
  })

  it('requests and applies engine move from UCI string', async () => {
    render(<App />)

    const fenInput = await screen.findByLabelText(/FEN/i)
    fireEvent.change(fenInput, {
      target: {
        value: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
      },
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

  it('loads board position from fen URL param', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1'
    window.history.replaceState({}, '', `/?fen=${encodeURIComponent(fen)}`)

    render(<App />)

    const fenInput = await screen.findByLabelText(/FEN/i)
    expect(fenInput).toHaveValue(fen)
    expect(boardInstance.position).toHaveBeenCalledWith(fen, false)
  })

  it('keeps fen in URL when position changes', async () => {
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
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    })

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /Copy PGN/i }))

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1)
    })

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/PGN downloaded/i)).toBeInTheDocument()
  })
})
