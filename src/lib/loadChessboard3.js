const scripts = [
  'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r80/three.min.js',
  'https://cdn.jsdelivr.net/gh/jtiscione/chessboard3js/js/OrbitControls.js',
  'https://cdn.jsdelivr.net/gh/jtiscione/chessboard3js/js/chessboard3.js',
]

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`)
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.dataset.src = src
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    })
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)))
    document.head.appendChild(script)
  })
}

export async function ensureChessboard3Loaded() {
  for (const src of scripts) {
    // Must load in order because chessboard3 depends on globals from prior scripts.
    await loadScript(src)
  }

  if (!window.ChessBoard3) {
    throw new Error('ChessBoard3 is not available after script loading')
  }
}
