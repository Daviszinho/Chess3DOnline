import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureChessboard3Loaded } from './loadChessboard3'

const SCRIPT_URLS = [
  'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r80/three.min.js',
  'https://cdn.jsdelivr.net/gh/jtiscione/chessboard3js/js/OrbitControls.js',
  'https://cdn.jsdelivr.net/gh/jtiscione/chessboard3js/js/chessboard3.js',
]

describe('ensureChessboard3Loaded', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    vi.restoreAllMocks()
    delete window.ChessBoard3
  })

  it('loads scripts in order and resolves when ChessBoard3 exists', async () => {
    const originalAppendChild = document.head.appendChild.bind(document.head)
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const appended = originalAppendChild(node)
      setTimeout(() => {
        node.dispatchEvent(new Event('load'))
      }, 0)
      return appended
    })

    window.ChessBoard3 = function MockChessBoard3() {}

    await ensureChessboard3Loaded()

    expect(appendSpy).toHaveBeenCalledTimes(4)
    const scripts = Array.from(document.querySelectorAll('script[data-src]'))
    expect(scripts).toHaveLength(4)
    expect(scripts.map((s) => s.dataset.src)).toEqual(SCRIPT_URLS)
    expect(scripts.every((s) => s.dataset.loaded === 'true')).toBe(true)
  })

  it('reuses already loaded scripts without appending new tags', async () => {
    SCRIPT_URLS.forEach((src) => {
      const script = document.createElement('script')
      script.dataset.src = src
      script.dataset.loaded = 'true'
      document.head.appendChild(script)
    })

    const appendSpy = vi.spyOn(document.head, 'appendChild')
    window.ChessBoard3 = function MockChessBoard3() {}

    await ensureChessboard3Loaded()

    expect(appendSpy).not.toHaveBeenCalled()
  })

  it('waits for existing pending script load listeners before continuing', async () => {
    const pendingScript = document.createElement('script')
    pendingScript.dataset.src = SCRIPT_URLS[0]
    document.head.appendChild(pendingScript)

    const originalAppendChild = document.head.appendChild.bind(document.head)
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const appended = originalAppendChild(node)
      setTimeout(() => {
        node.dispatchEvent(new Event('load'))
      }, 0)
      return appended
    })

    window.ChessBoard3 = function MockChessBoard3() {}

    const promise = ensureChessboard3Loaded()
    setTimeout(() => {
      pendingScript.dispatchEvent(new Event('load'))
    }, 0)

    await expect(promise).resolves.toBeUndefined()
    expect(pendingScript.dataset.loaded).not.toBe('true')
  })

  it('rejects when an existing pending script emits error', async () => {
    const pendingScript = document.createElement('script')
    pendingScript.dataset.src = SCRIPT_URLS[0]
    document.head.appendChild(pendingScript)

    const promise = ensureChessboard3Loaded()
    setTimeout(() => {
      pendingScript.dispatchEvent(new Event('error'))
    }, 0)

    await expect(promise).rejects.toThrow(`Failed to load ${SCRIPT_URLS[0]}`)
  })

  it('rejects when a script fails to load', async () => {
    const originalAppendChild = document.head.appendChild.bind(document.head)
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const appended = originalAppendChild(node)
      setTimeout(() => {
        node.dispatchEvent(new Event('error'))
      }, 0)
      return appended
    })

    await expect(ensureChessboard3Loaded()).rejects.toThrow(
      'Failed to load https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
    )
  })

  it('rejects when ChessBoard3 is still unavailable after loading scripts', async () => {
    const originalAppendChild = document.head.appendChild.bind(document.head)
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const appended = originalAppendChild(node)
      setTimeout(() => {
        node.dispatchEvent(new Event('load'))
      }, 0)
      return appended
    })

    await expect(ensureChessboard3Loaded()).rejects.toThrow(
      'ChessBoard3 is not available after script loading',
    )
  })
})
