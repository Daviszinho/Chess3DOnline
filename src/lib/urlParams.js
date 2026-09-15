/**
 * Utilities for reading and writing chess app state to/from the URL search
 * params.  All writes use history.replaceState so there is no extra history
 * entry.
 *
 * Persisted params:
 *   fen      – current board position (FEN string)
 *   engine   – selected engine name
 *   level    – difficulty level (1–20)
 *   lang     – UI language (en | es | pt | it)
 *   theme    – board theme key
 *   color    – player color (w | b)
 */

export const URL_FEN_PARAM = 'fen'

const PARAM_ENGINE = 'engine'
const PARAM_LEVEL = 'level'
const PARAM_LANG = 'lang'
const PARAM_THEME = 'theme'
const PARAM_COLOR = 'color'

/** Read all persisted params from the current URL. */
export function readUrlParams() {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)

  const level = Number(p.get(PARAM_LEVEL))
  return {
    fen: p.get(URL_FEN_PARAM) || p.get('position') || null,
    engine: p.get(PARAM_ENGINE) || null,
    level: level >= 1 && level <= 20 ? level : null,
    language: p.get(PARAM_LANG) || null,
    boardTheme: p.get(PARAM_THEME) || null,
    playerColor: p.get(PARAM_COLOR) === 'b' ? 'b' : p.get(PARAM_COLOR) === 'w' ? 'w' : null,
  }
}

/**
 * Write a partial set of params into the URL without triggering a navigation.
 * Pass null for a value to remove that param.
 */
export function writeUrlParams(updates) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)

  const map = {
    fen: URL_FEN_PARAM,
    engine: PARAM_ENGINE,
    level: PARAM_LEVEL,
    language: PARAM_LANG,
    boardTheme: PARAM_THEME,
    playerColor: PARAM_COLOR,
  }

  for (const [key, param] of Object.entries(map)) {
    if (key in updates) {
      const val = updates[key]
      if (val === null || val === undefined) {
        url.searchParams.delete(param)
      } else {
        url.searchParams.set(param, String(val))
      }
    }
  }

  // Remove legacy 'position' param if present.
  url.searchParams.delete('position')

  try {
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  } catch {
    // Ignore history API restrictions (e.g. file:// or embedded contexts).
  }
}
